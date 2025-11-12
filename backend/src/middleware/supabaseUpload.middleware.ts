import multer from 'multer';
import { supabase } from '../config/supabase.js';
import path from 'path';

// Configurar multer para usar memoria en lugar de disco
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: ¡Solo se permiten archivos de imagen!'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});

/**
 * Función para subir imagen a Supabase Storage
 */
export const uploadToSupabase = async (file: Express.Multer.File, folder: string = 'productos'): Promise<string> => {
  try {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('vinovault-images') // Nombre del bucket
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('vinovault-images')
      .getPublicUrl(filePath);

    console.log('✅ Imagen subida exitosamente a Supabase:', publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error en uploadToSupabase:', error);
    throw error;
  }
};

/**
 * Función para eliminar imagen de Supabase Storage
 */
export const deleteFromSupabase = async (publicUrl: string): Promise<boolean> => {
  try {
    // Extraer el path del archivo de la URL pública
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // folder/filename

    const { error } = await supabase.storage
      .from('vinovault-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting from Supabase:', error);
      return false;
    }

    console.log('✅ Imagen eliminada exitosamente de Supabase:', filePath);
    return true;
  } catch (error) {
    console.error('Error en deleteFromSupabase:', error);
    return false;
  }
};

export default upload;