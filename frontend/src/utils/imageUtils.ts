/**
 * Utility para construir URLs de imágenes desde Supabase Storage
 */

const getImageUrl = (imageUrl: string | undefined | null): string => {
  // Si no hay imagen, retornar placeholder
  if (!imageUrl) {
    return 'https://placehold.co/300x300/212121/90caf9?text=Sin+Imagen';
  }

  // Si ya es una URL completa (Supabase o cualquier URL externa), retornarla directamente
  if (imageUrl.startsWith('http')) {
    console.log('🖼️ Using complete URL:', imageUrl);
    return imageUrl;
  }

  // Para rutas relativas antiguas, construir URL del backend
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  
  // Si la ruta ya incluye 'uploads/', no duplicarla
  const cleanImageUrl = imageUrl.startsWith('uploads/') 
    ? imageUrl.replace('uploads/', '') 
    : imageUrl;
    
  const fallbackUrl = `${baseUrl}/uploads/${cleanImageUrl}`;
  
  console.log('🖼️ Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

export { getImageUrl };