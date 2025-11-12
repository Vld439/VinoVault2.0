/**
 * Utility para construir URLs de imágenes desde Supabase Storage
 */

const getImageUrl = (imageUrl: string | undefined | null): string => {
  // Si no hay imagen, retornar placeholder
  if (!imageUrl) {
    return 'https://placehold.co/300x300/212121/90caf9?text=Sin+Imagen';
  }

  // Si ya es una URL completa de Supabase, retornarla directamente
  if (imageUrl.startsWith('http')) {
    console.log('🖼️ Using Supabase URL:', imageUrl);
    return imageUrl;
  }

  // Fallback para URLs locales (desarrollo)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  const fallbackUrl = `${baseUrl}/uploads/${imageUrl}`;
  
  console.log('🖼️ Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

export { getImageUrl };