/**
 * Utility para construir URLs de imágenes
 */

const getImageUrl = (imageName: string | undefined | null): string => {
  // Si no hay imagen, retornar placeholder
  if (!imageName) {
    return 'https://placehold.co/300x300/212121/90caf9?text=Sin+Imagen';
  }

  // Obtener la URL base del backend
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  
  // Construir URL completa
  const fullImageUrl = `${baseUrl}/uploads/${imageName}`;
  
  // Log para debugging
  console.log('🖼️ Image URL constructed:', fullImageUrl);
  
  return fullImageUrl;
};

export { getImageUrl };