import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'OK' : 'MISSING');
  throw new Error('Missing Supabase environment variables');
}

console.log('✅ Supabase configuration loaded successfully');
export const supabase = createClient(supabaseUrl, supabaseKey);