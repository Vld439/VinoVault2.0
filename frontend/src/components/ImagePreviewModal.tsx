// src/components/ImagePreviewModal.tsx
import { Modal, Box, IconButton } from '@mui/material';
import { Icon } from '@mui/material';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImagePreviewModal = ({ imageUrl, onClose }: ImagePreviewModalProps) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <Modal
      open={!!imageUrl}
      onClose={onClose}
      aria-labelledby="image-preview-title"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box sx={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }
          }}
        >
          <Icon>close</Icon>
        </IconButton>
        <img 
          src={imageUrl} 
          alt="Vista previa del producto" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </Box>
    </Modal>
  );
};

export default ImagePreviewModal;