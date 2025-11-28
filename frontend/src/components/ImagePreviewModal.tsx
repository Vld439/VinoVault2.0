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
      <Box sx={{
        position: 'relative',
        width: { xs: '90vw', md: '600px' },
        height: { xs: '60vh', md: '600px' },
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 0,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
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