import { useState, useRef, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, Chip, Tabs, Tab, useTheme
} from '@mui/material';
import '../assets/print-mobile.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth, axiosInstance } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logo from '../assets/logo.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Interfaces para los datos del reporte
interface VentaItem {
  producto_nombre: string;
  cantidad: number;
  precio_unitario: string;
}
interface VentaReporte {
  id: number;
  fecha_venta: string;
  cliente_nombre: string;
  vendedor_nombre: string;
  subtotal: string;
  impuesto: string;
  total: string;
  moneda: 'USD' | 'PYG' | 'BRL';
  estado: string;
  items: VentaItem[];
}

interface ProductoStock {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  precio_compra: string;
  precio_venta: string;
  precio_venta_pyg?: string;
  precio_venta_brl?: string;
  total_stock: number;
  stock_minimo?: number;
  estado_stock: 'Crítico' | 'Bajo' | 'Normal' | 'Alto';
}

interface ExchangeRates {
  PYG: number;
  BRL: number;
}

const ReportesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reporte, setReporte] = useState<VentaReporte[]>([]);
  const [reporteStock, setReporteStock] = useState<ProductoStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const { showNotification } = useAuth();
  const { currency } = useCart();
  const printRef = useRef(null);
  const theme = useTheme();

  // Determine the primary brand color based on the theme mode
  const brandColor = theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.primary.main;

  // Cargar tasas de cambio al montar el componente
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await axiosInstance.get('/dashboard/exchange-rates');
        setExchangeRates(response.data);
        console.log('Tasas de cambio cargadas:', response.data);
      } catch (error) {
        console.error('Error al cargar tasas de cambio:', error);
        showNotification('Error al cargar tasas de cambio. Usando tasas aproximadas.', 'warning');
        // Tasas de respaldo si falla la API
        setExchangeRates({ PYG: 7500, BRL: 5 });
      }
    };

    fetchExchangeRates();
  }, [showNotification]);

  const handleGenerarReporte = async () => {
    if (tabValue === 0) {
      // Reporte de ventas
      if (!fechaInicio || !fechaFin) {
        showNotification('Por favor, selecciona ambas fechas.', 'warning');
        return;
      }

      // Validar que las fechas no sean futuras
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Establecer al final del día actual

      if (fechaInicio > today) {
        showNotification('La fecha de inicio no puede ser futura.', 'warning');
        return;
      }

      if (fechaFin > today) {
        showNotification('La fecha fin no puede ser futura.', 'warning');
        return;
      }

      if (fechaFin < fechaInicio) {
        showNotification('La fecha fin debe ser posterior a la fecha de inicio.', 'warning');
        return;
      }
      const f1 = format(fechaInicio, 'yyyy-MM-dd');
      const f2 = format(fechaFin, 'yyyy-MM-dd');

      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/reportes/ventas?fechaInicio=${f1}&fechaFin=${f2}`);
        setReporte(response.data);
        if (response.data.length === 0) {
          showNotification('No se encontraron ventas en ese rango de fechas.', 'info');
        }
      } catch (error) {
        showNotification('Error al generar el reporte.', 'error');
      } finally {
        setIsLoading(false);
      }
    } else if (tabValue === 1) {
      // Reporte de stock
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/reportes/stock');
        const stockData = response.data.map((producto: any) => ({
          ...producto,
          estado_stock: producto.total_stock <= 5 ? 'Crítico' :
            producto.total_stock <= 15 ? 'Bajo' :
              producto.total_stock <= 50 ? 'Normal' : 'Alto'
        }));
        setReporteStock(stockData);
        if (stockData.length === 0) {
          showNotification('No se encontraron productos en inventario.', 'info');
        }
      } catch (error) {
        showNotification('Error al generar el reporte de stock.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      setIsLoading(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const fileName = `Reporte-${tabValue === 0 ? 'Ventas' : 'Stock'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      showNotification('Reporte descargado correctamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showNotification('Error al generar el PDF', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcula los totales del reporte (los datos están en USD, convertimos según la moneda seleccionada)
  const totales = reporte.reduce((acc, venta) => {
    if (venta.estado === 'Completada') {
      // Los datos vienen en USD desde la base de datos
      const totalUSD = parseFloat(venta.total);
      const impuestoUSD = parseFloat(venta.impuesto);

      // Usar tasas reales del API o valores por defecto
      const rates = exchangeRates || { PYG: 7500, BRL: 5 };

      // Convertir de USD a la moneda seleccionada
      let totalEnMonedaSeleccionada = totalUSD;
      let impuestoEnMonedaSeleccionada = impuestoUSD;

      if (currency === 'PYG') {
        totalEnMonedaSeleccionada = totalUSD * rates.PYG;
        impuestoEnMonedaSeleccionada = impuestoUSD * rates.PYG;
      } else if (currency === 'BRL') {
        totalEnMonedaSeleccionada = totalUSD * rates.BRL;
        impuestoEnMonedaSeleccionada = impuestoUSD * rates.BRL;
      }

      acc.total += totalEnMonedaSeleccionada;
      acc.impuesto += impuestoEnMonedaSeleccionada;
    }
    return acc;
  }, { total: 0, impuesto: 0 });

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      {/* Elementos que NO deben aparecer en impresión */}
      <Box className="no-print" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">Reportes</Typography>
        <Button component={RouterLink} to="/dashboard" variant="outlined">Volver al Dashboard</Button>
      </Box>

      <Paper className="no-print" sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Reporte de Ventas" />
          <Tab label="Stock por Producto" />
        </Tabs>
      </Paper>

      <Paper className="no-print" sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {tabValue === 0 && (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha Inicio"
              value={fechaInicio}
              onChange={setFechaInicio}
              maxDate={new Date()}
              slotProps={{
                textField: {
                  helperText: fechaInicio && fechaInicio > new Date() ? 'La fecha no puede ser futura' : ''
                }
              }}
            />
            <DatePicker
              label="Fecha Fin"
              value={fechaFin}
              onChange={setFechaFin}
              maxDate={new Date()}
              minDate={fechaInicio || undefined}
              slotProps={{
                textField: {
                  helperText: fechaFin && fechaFin > new Date() ? 'La fecha no puede ser futura' :
                    fechaFin && fechaInicio && fechaFin < fechaInicio ? 'La fecha fin debe ser posterior a la fecha inicio' : ''
                }
              }}
            />
          </LocalizationProvider>
        )}
        <Button variant="contained" onClick={handleGenerarReporte} disabled={isLoading}>
          {tabValue === 0 ? 'Generar Reporte de Ventas' : 'Generar Reporte de Stock'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleDownloadPDF}
          disabled={(tabValue === 0 ? reporte.length === 0 : reporteStock.length === 0)}
        >
          Descargar PDF
        </Button>
      </Paper>

      {isLoading ? (
        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : tabValue === 0 ? (
        <div
          ref={printRef}
          data-print="true"
          style={{
            padding: '16px',
            backgroundColor: 'white',
            color: '#000'
          }}
        >
          {/* Encabezado para impresión */}
          <Box className="print-header" sx={{ mb: 3, backgroundColor: 'white !important', color: '#000 !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img
                  src={logo}
                  alt="VinoVault Logo"
                  style={{ height: '100px', maxWidth: '300px' }}
                />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${brandColor} !important` }}>
                    VinoVault
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#666 !important' }}>
                    Sistema de Gestión de Inventario
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                  REPORTE DE VENTAS
                </Typography>
                <Typography variant="body1" sx={{ color: '#000 !important' }}>
                  Fecha de generación: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
                {fechaInicio && fechaFin && (
                  <Typography variant="body1" sx={{ color: '#000 !important' }}>
                    Período: {format(fechaInicio, 'dd/MM/yyyy', { locale: es })} - {format(fechaFin, 'dd/MM/yyyy', { locale: es })}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Resumen ejecutivo */}
          {reporte.length > 0 && (
            <Paper sx={{ p: 1.5, mb: 2, backgroundColor: '#f8f9fa !important', color: '#000 !important' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#000 !important', fontSize: '16px' }}>
                Resumen Ejecutivo
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: brandColor, fontSize: '24px' }}>
                    {reporte.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Total Ventas
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32 !important', fontSize: '24px' }}>
                    {reporte.filter(v => v.estado === 'Completada').length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Completadas
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f !important', fontSize: '24px' }}>
                    {reporte.filter(v => v.estado === 'Anulada').length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Anuladas
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: `${brandColor} !important`, fontSize: '24px' }}>
                    {formatCurrency(totales.total, currency)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Total Facturado
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Tabla de resultados */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: '#000 !important' }}>
            Detalle de Ventas
          </Typography>

          {reporte.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'white !important', color: '#000 !important' }}>
              <Typography variant="h6" sx={{ color: '#666 !important' }}>
                No se encontraron ventas en el período seleccionado
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2, backgroundColor: 'white !important' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>ID Venta</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Fecha</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Cliente</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Vendedor</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Estado</TableCell>
                    <TableCell align="right" sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Subtotal</TableCell>
                    <TableCell align="right" sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Impuesto</TableCell>
                    <TableCell align="right" sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reporte.map((venta, index) => (
                    <TableRow
                      key={venta.id}
                      className={venta.estado === 'Anulada' ? 'anulada-row' : ''}
                      sx={{
                        backgroundColor: venta.estado === 'Anulada'
                          ? 'rgba(255, 0, 0, 0.05)'
                          : index % 2 === 0
                            ? '#f8f9fa'
                            : 'white',
                        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold', color: '#000 !important' }}>#{venta.id}</TableCell>
                      <TableCell sx={{ color: '#000 !important' }}>
                        {format(new Date(venta.fecha_venta), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell sx={{ color: '#000 !important' }}>{venta.cliente_nombre}</TableCell>
                      <TableCell sx={{ color: '#000 !important' }}>{venta.vendedor_nombre}</TableCell>
                      <TableCell>
                        <Chip
                          label={venta.estado}
                          size="small"
                          color={venta.estado === 'Completada' ? 'success' : 'error'}
                          variant={venta.estado === 'Completada' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#000 !important' }}>
                        {(() => {
                          // Los datos están en USD, convertir a moneda seleccionada
                          const subtotalUSD = parseFloat(venta.total) - parseFloat(venta.impuesto);
                          const rates = exchangeRates || { PYG: 7500, BRL: 5 };

                          let subtotalConvertido = subtotalUSD;
                          if (currency === 'PYG') {
                            subtotalConvertido = subtotalUSD * rates.PYG;
                          } else if (currency === 'BRL') {
                            subtotalConvertido = subtotalUSD * rates.BRL;
                          }

                          return formatCurrency(subtotalConvertido, currency);
                        })()}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#000 !important' }}>
                        {(() => {
                          // Los datos están en USD, convertir a moneda seleccionada
                          const impuestoUSD = parseFloat(venta.impuesto);
                          const rates = exchangeRates || { PYG: 7500, BRL: 5 };

                          let impuestoConvertido = impuestoUSD;
                          if (currency === 'PYG') {
                            impuestoConvertido = impuestoUSD * rates.PYG;
                          } else if (currency === 'BRL') {
                            impuestoConvertido = impuestoUSD * rates.BRL;
                          }

                          return formatCurrency(impuestoConvertido, currency);
                        })()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                        {(() => {
                          // Los datos están en USD, convertir a moneda seleccionada
                          const totalUSD = parseFloat(venta.total);
                          const rates = exchangeRates || { PYG: 7500, BRL: 5 };

                          let totalConvertido = totalUSD;
                          if (currency === 'PYG') {
                            totalConvertido = totalUSD * rates.PYG;
                          } else if (currency === 'BRL') {
                            totalConvertido = totalUSD * rates.BRL;
                          }

                          return formatCurrency(totalConvertido, currency);
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Totales mejorados */}
          {reporte.length > 0 && (
            <Paper className="print-totals" sx={{ mt: 3, p: 3, backgroundColor: '#f5f5f5 !important', color: '#000 !important' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#000 !important' }}>
                Resumen Financiero
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: 1, minWidth: '250px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#000 !important' }}>Ventas Completadas:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                      {reporte.filter(v => v.estado === 'Completada').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#000 !important' }}>Ventas Anuladas:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                      {reporte.filter(v => v.estado === 'Anulada').length}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: '250px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#000 !important' }}>Total Impuestos ({currency}):</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                      {formatCurrency(totales.impuesto, currency)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${brandColor} !important` }}>
                      TOTAL GENERAL ({currency}):
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${brandColor} !important` }}>
                      {formatCurrency(totales.total, currency)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Pie de página para impresión */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center', backgroundColor: 'white !important' }}>
            <Typography variant="body2" sx={{ color: '#666 !important' }}>
              Reporte generado automáticamente por VinoVault - {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666 !important' }}>
              Este documento es un reporte interno y no constituye un documento fiscal
            </Typography>
          </Box>
        </div>
      ) : (
        // Reporte de Stock
        <div
          ref={printRef}
          data-print="true"
          style={{
            padding: '16px',
            backgroundColor: 'white',
            color: '#000'
          }}
        >
          {/* Encabezado para impresión */}
          <Box className="print-header" sx={{ mb: 3, backgroundColor: 'white !important', color: '#000 !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img
                  src={logo}
                  alt="VinoVault Logo"
                  style={{ height: '100px', maxWidth: '300px' }}
                />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${brandColor} !important` }}>
                    VinoVault
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#666 !important' }}>
                    Sistema de Gestión de Inventario
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                  REPORTE DE STOCK
                </Typography>
                <Typography variant="body1" sx={{ color: '#000 !important' }}>
                  Fecha de generación: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Resumen de stock */}
          {reporteStock.length > 0 && (
            <Paper sx={{ p: 1.5, mb: 2, backgroundColor: '#f8f9fa !important', color: '#000 !important' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#000 !important', fontSize: '16px' }}>
                Resumen de Inventario
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: brandColor, fontSize: '24px' }}>
                    {reporteStock.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Total Productos
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f !important', fontSize: '24px' }}>
                    {reporteStock.filter(p => p.estado_stock === 'Crítico').length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Stock Crítico
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ed6c02 !important', fontSize: '24px' }}>
                    {reporteStock.filter(p => p.estado_stock === 'Bajo').length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Stock Bajo
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32 !important', fontSize: '24px' }}>
                    {reporteStock.filter(p => p.estado_stock === 'Normal' || p.estado_stock === 'Alto').length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666 !important', fontSize: '11px' }}>
                    Stock Normal/Alto
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Tabla de stock */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: '#000 !important' }}>
            Inventario Actual
          </Typography>

          {reporteStock.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'white !important', color: '#000 !important' }}>
              <Typography variant="h6" sx={{ color: '#666 !important' }}>
                No se encontraron productos en inventario
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 2, backgroundColor: 'white !important' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>SKU</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Producto</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Descripción</TableCell>
                    <TableCell align="right" sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Stock Actual</TableCell>
                    <TableCell align="right" sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Precio Compra</TableCell>
                    <TableCell align="right" sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Precio Venta</TableCell>
                    <TableCell sx={{ color: '#000 !important', fontWeight: 'bold', fontSize: '14px' }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reporteStock
                    .sort((a, b) => {
                      const orden = { 'Crítico': 0, 'Bajo': 1, 'Normal': 2, 'Alto': 3 };
                      return orden[a.estado_stock] - orden[b.estado_stock];
                    })
                    .map((producto, index) => (
                      <TableRow
                        key={producto.id}
                        sx={{
                          backgroundColor: producto.estado_stock === 'Crítico'
                            ? 'rgba(211, 47, 47, 0.1)'
                            : producto.estado_stock === 'Bajo'
                              ? 'rgba(237, 108, 2, 0.1)'
                              : index % 2 === 0
                                ? '#f8f9fa'
                                : 'white',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 'bold', color: '#000 !important' }}>{producto.sku}</TableCell>
                        <TableCell sx={{ color: '#000 !important' }}>{producto.nombre}</TableCell>
                        <TableCell sx={{ color: '#000 !important' }}>{producto.descripcion}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                          {producto.total_stock}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#000 !important' }}>
                          {formatCurrency(producto.precio_compra, 'USD')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#000 !important' }}>
                          {formatCurrency(producto.precio_venta, 'USD')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={producto.estado_stock}
                            size="small"
                            color={
                              producto.estado_stock === 'Crítico' ? 'error' :
                                producto.estado_stock === 'Bajo' ? 'warning' :
                                  'success'
                            }
                            variant="filled"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Resumen de valorización */}
          {reporteStock.length > 0 && (
            <Paper className="print-totals" sx={{ mt: 3, p: 3, backgroundColor: '#f5f5f5 !important', color: '#000 !important' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#000 !important' }}>
                Valorización de Inventario
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: 1, minWidth: '250px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#000 !important' }}>Valor en Compras (USD):</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                      {formatCurrency(
                        reporteStock.reduce((acc, p) => acc + (parseFloat(p.precio_compra) * p.total_stock), 0),
                        'USD'
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#000 !important' }}>Valor en Ventas (USD):</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                      {formatCurrency(
                        reporteStock.reduce((acc, p) => acc + (parseFloat(p.precio_venta) * p.total_stock), 0),
                        'USD'
                      )}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: '250px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ color: '#000 !important' }}>Total Unidades:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000 !important' }}>
                      {reporteStock.reduce((acc, p) => acc + p.total_stock, 0)} unidades
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${brandColor} !important` }}>
                      GANANCIA POTENCIAL:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: `${brandColor} !important` }}>
                      {formatCurrency(
                        reporteStock.reduce((acc, p) => acc + ((parseFloat(p.precio_venta) - parseFloat(p.precio_compra)) * p.total_stock), 0),
                        'USD'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Pie de página para impresión */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center', backgroundColor: 'white !important' }}>
            <Typography variant="body2" sx={{ color: '#666 !important' }}>
              Reporte generado automáticamente por VinoVault - {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666 !important' }}>
              Este documento es un reporte interno y no constituye un documento fiscal
            </Typography>
          </Box>
        </div>
      )}
    </Container>
  );
};

export default ReportesPage;