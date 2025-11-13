import { formatCurrency } from '../utils/formatCurrency';
import logo from '../assets/logo.png';

interface PrintReceiptData {
  ventaId: number;
  fecha: Date;
  clientName: string;
  vendedor: string;
  almacenName: string;
  items: any[];
  subtotal: number;
  impuesto: number;
  total: number;
}

export const usePrintReceipt = () => {

  const printMobileReceipt = (saleData: PrintReceiptData) => {
    // Crear ventana en pantalla completa para mejor experiencia
    const printWindow = window.open('', '_blank', 'fullscreen=yes,scrollbars=yes');
    
    if (!printWindow) {
      console.warn('No se pudo abrir ventana de impresión. Verifica permisos de pop-up.');
      return;
    }

    // HTML con botones de control manual (COPIADO EXACTO del código que funciona)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
          <title>Venta #${saleData.ventaId}</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  font-size: 16px; 
                  line-height: 1.5; 
                  color: #000; 
                  background: #fff; 
                  padding: 20px;
                  margin: 0;
              }
              .controls {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  background: #333;
                  padding: 10px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  z-index: 1000;
              }
              .btn {
                  background: #1976d2;
                  color: white;
                  border: none;
                  padding: 12px 20px;
                  font-size: 16px;
                  border-radius: 5px;
                  cursor: pointer;
                  margin: 0 5px;
              }
              .btn-close { background: #d32f2f; }
              .btn:hover { opacity: 0.8; }
              .receipt-container {
                  margin-top: 60px;
                  max-width: 100%;
                  background: white;
                  padding: 20px;
                  border: 1px solid #ddd;
              }
              .header { 
                  text-align: center; 
                  border-bottom: 2px solid #000; 
                  padding-bottom: 15px; 
                  margin-bottom: 20px; 
              }
              .header h1 { 
                  color: #1976d2; 
                  font-size: 28px; 
                  margin: 0 0 10px 0; 
              }
              .info-section {
                  margin-bottom: 25px;
              }
              .info-row { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 10px; 
                  padding: 8px 0;
                  border-bottom: 1px dotted #ccc;
                  font-size: 16px;
              }
              .products-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 25px 0; 
                  font-size: 15px;
              }
              .products-table th, 
              .products-table td { 
                  border: 1px solid #000; 
                  padding: 12px 10px; 
                  text-align: left; 
              }
              .products-table th { 
                  background: #f0f0f0; 
                  font-weight: bold; 
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .totals-section { 
                  border-top: 2px solid #000; 
                  padding-top: 20px; 
                  margin-top: 25px; 
              }
              .total-final { 
                  font-weight: bold; 
                  font-size: 20px; 
                  border-top: 1px solid #000; 
                  padding-top: 15px; 
                  margin-top: 15px; 
              }
              .footer { 
                  text-align: center; 
                  margin-top: 40px; 
                  padding-top: 25px; 
                  border-top: 1px dashed #000; 
              }
              
              @media print {
                  .controls { display: none !important; }
                  body { padding: 0; margin: 0; }
                  .receipt-container { 
                      margin-top: 0; 
                      border: none; 
                      padding: 20px; 
                  }
              }
          </style>
      </head>
      <body>
          <div class="controls">
              <button class="btn btn-close" onclick="window.close()">✖ Cerrar</button>
              <div>
                  <span style="color: white; font-weight: bold;">Venta #${saleData.ventaId}</span>
              </div>
              <button class="btn" onclick="window.print()">🖨️ Imprimir</button>
          </div>
          
                  <div class="receipt-container">
                      <div class="header">
                          <div style="text-align: center; margin-bottom: 15px;">
                              <img src="${logo}" alt="VinoVault Logo" style="height: 100px; max-width: 300px;" />
                          </div>
                          <h1>VINOVAULT</h1>
                          <p style="margin: 10px 0; font-size: 18px;">Sistema de Gestión de Inventario</p>
                          <h2 style="margin-top: 20px; font-size: 22px; color: #333;">COMPROBANTE DE VENTA</h2>
                      </div>              <div class="info-section">
                  <div class="info-row">
                      <strong>N° de Venta:</strong>
                      <span>#${saleData.ventaId}</span>
                  </div>
                  <div class="info-row">
                      <strong>Fecha:</strong>
                      <span>${new Date(saleData.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}</span>
                  </div>
                  <div class="info-row">
                      <strong>Cliente:</strong>
                      <span>${saleData.clientName || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                      <strong>Vendedor:</strong>
                      <span>${saleData.vendedor || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                      <strong>Almacén:</strong>
                      <span>${saleData.almacenName || 'N/A'}</span>
                  </div>
                  <div class="info-row">
                      <strong>Moneda:</strong>
                      <span>USD</span>
                  </div>
              </div>

              <table class="products-table">
                  <thead>
                      <tr>
                          <th>Producto</th>
                          <th class="text-center" style="width: 100px;">Cantidad</th>
                          <th class="text-right" style="width: 120px;">Precio Unit.</th>
                          <th class="text-right" style="width: 120px;">Subtotal</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${saleData.items?.map((item: any) => {
                          const price = item.precio_venta;
                          const itemSubtotal = price * item.quantity;
                          return `
                              <tr>
                                  <td>${item.nombre}</td>
                                  <td class="text-center">${item.quantity}</td>
                                  <td class="text-right">${formatCurrency(price, 'USD')}</td>
                                  <td class="text-right">${formatCurrency(itemSubtotal, 'USD')}</td>
                              </tr>
                          `;
                      }).join('') || '<tr><td colspan="4" class="text-center">No hay productos disponibles</td></tr>'}
                  </tbody>
              </table>

              <div class="totals-section">
                  <div class="info-row">
                      <strong>Subtotal:</strong>
                      <span>${formatCurrency(saleData.subtotal, 'USD')}</span>
                  </div>
                  <div class="info-row">
                      <strong>IVA (10%):</strong>
                      <span>${formatCurrency(saleData.impuesto, 'USD')}</span>
                  </div>
                  <div class="info-row total-final">
                      <strong>TOTAL:</strong>
                      <strong>${formatCurrency(saleData.total, 'USD')}</strong>
                  </div>
              </div>

              <div class="footer">
                  <p style="font-size: 18px;"><strong>¡Gracias por su compra!</strong></p>
                  <p style="margin: 10px 0; font-size: 16px;">VINOVAULT - Sistema de Gestión de Inventario</p>
                  <p style="margin-top: 15px; font-size: 14px; color: #666;">
                      Documento generado el: ${new Date().toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Escribir contenido y enfocar ventana
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const printDesktopReceipt = (saleData: PrintReceiptData) => {
    // Crear una nueva ventana para imprimir en desktop
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Crear el contenido HTML completo optimizado para desktop
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Comprobante Venta #${saleData.ventaId}</title>
          <style>
              @page {
                  size: A4;
                  margin: 15mm;
              }
              body {
                  font-family: Arial, sans-serif;
                  color: #000;
                  background: white;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.4;
              }
              .receipt-header {
                  text-align: center;
                  margin-bottom: 20px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 15px;
              }
              .receipt-details {
                  margin-bottom: 20px;
              }
              .receipt-flex {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 20px;
              }
              .receipt-column {
                  flex: 1;
                  margin-right: 20px;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
              }
              th, td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
              }
              th {
                  background: #f5f5f5;
                  font-weight: bold;
              }
              .text-right {
                  text-align: right;
              }
              .text-center {
                  text-align: center;
              }
              .receipt-totals {
                  border-top: 2px solid #000;
                  padding-top: 15px;
                  margin-top: 20px;
              }
              .total-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
              }
              .total-final {
                  font-weight: bold;
                  font-size: 1.2em;
                  border-top: 1px solid #000;
                  padding-top: 10px;
              }
              .receipt-footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px dashed #000;
              }
          </style>
      </head>
      <body>
          <div class="receipt-header">
              <div style="text-align: center; margin-bottom: 15px;">
                  <img src="${logo}" alt="VinoVault Logo" style="height: 100px; max-width: 300px;" />
              </div>
              <h1 style="color: #1976d2; margin: 0;">VINOVAULT</h1>
              <p style="margin: 5px 0;">Sistema de Gestión de Inventario</p>
              <h2 style="margin: 15px 0;">COMPROBANTE DE VENTA</h2>
          </div>

          <div class="receipt-flex">
              <div class="receipt-column">
                  <p><strong>N° de Venta:</strong> #${saleData.ventaId}</p>
                  <p><strong>Fecha:</strong> ${new Date(saleData.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                  })}</p>
                  <p><strong>Moneda:</strong> USD</p>
              </div>
              <div class="receipt-column">
                  <p><strong>Cliente:</strong> ${saleData.clientName || ''}</p>
                  <p><strong>Vendedor:</strong> ${saleData.vendedor || ''}</p>
                  <p><strong>Almacén:</strong> ${saleData.almacenName || ''}</p>
              </div>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>Producto</th>
                      <th class="text-center">Cantidad</th>
                      <th class="text-right">Precio Unit.</th>
                      <th class="text-right">Subtotal</th>
                  </tr>
              </thead>
              <tbody>
                  ${saleData.items?.map((item: any) => {
                      const price = item.precio_venta;
                      const itemSubtotal = price * item.quantity;
                      return `
                          <tr>
                              <td>${item.nombre}</td>
                              <td class="text-center">${item.quantity}</td>
                              <td class="text-right">${formatCurrency(price, 'USD')}</td>
                              <td class="text-right">${formatCurrency(itemSubtotal, 'USD')}</td>
                          </tr>
                      `;
                  }).join('') || '<tr><td colspan="4" class="text-center">No hay productos disponibles</td></tr>'}
              </tbody>
          </table>

          <div class="receipt-totals">
              <div style="float: right; width: 300px;">
                  <div class="total-row">
                      <span>Subtotal:</span>
                      <span>${formatCurrency(saleData.subtotal, 'USD')}</span>
                  </div>
                  <div class="total-row">
                      <span>IVA (10%):</span>
                      <span>${formatCurrency(saleData.impuesto, 'USD')}</span>
                  </div>
                  <div class="total-row total-final">
                      <span>TOTAL:</span>
                      <span>${formatCurrency(saleData.total, 'USD')}</span>
                  </div>
              </div>
              <div style="clear: both;"></div>
          </div>

          <div class="receipt-footer">
              <p><strong>¡Gracias por su compra!</strong></p>
              <p>VINOVAULT - Sistema de Gestión de Inventario</p>
              <p style="font-size: 0.9em;">Impreso el: ${new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
              })}</p>
          </div>
      </body>
      </html>
    `;

    // Escribir el contenido y imprimir
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar un momento para que se cargue el contenido
    printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
    };
  };

  const handlePrint = (saleData: PrintReceiptData) => {
    if (!saleData) {
      console.warn('No hay datos de venta para imprimir');
      return;
    }

    // Verificar si estamos en móvil
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // En móvil, usar ventana con controles manuales
      printMobileReceipt(saleData);
    } else {
      // En desktop, usar ventana nueva optimizada
      printDesktopReceipt(saleData);
    }
  };

  return { handlePrint };
};