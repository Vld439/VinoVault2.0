import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography
} from '@mui/material';

interface AdjustStockModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cantidad: number) => void;
  tipoMovimiento: 'Entrada' | 'Salida';
  almacenNombre: string;
}

const AdjustStockModal = ({ open, onClose, onSubmit, tipoMovimiento, almacenNombre }: AdjustStockModalProps) => {
  const [cantidad, setCantidad] = useState('');

  const handleSubmit = () => {
    const cantidadNum = Number(cantidad);
    if (cantidadNum > 0) {
      onSubmit(tipoMovimiento === 'Salida' ? -cantidadNum : cantidadNum);
      setCantidad('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tipoMovimiento} de Stock</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Introduce la cantidad para la <strong>{tipoMovimiento.toLowerCase()}</strong> en el almacén <strong>{almacenNombre}</strong>.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Cantidad"
          type="number"
          fullWidth
          variant="outlined"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          InputProps={{ inputProps: { min: 1 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdjustStockModal;