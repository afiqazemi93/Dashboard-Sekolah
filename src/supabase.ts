import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration for Vercel production as requested
const supabaseUrl = 'https://vmydujwojodpazbrhhri.supabase.co';
const supabaseAnonKey = 'sb_publishable_tbsh0CXiArKRZ1Nd7iROwg_beqo6r93';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload details/images to Supabase Storage.
 * If the storage bucket "school_media" is not created or fails,
 * it falls back to passing back the base64 data URL so nothing breaks.
 */
/**
 * Compress base64 images to lower resolution and quality on client-side
 * to optimize network speed, storage footprint, and database load.
 */
export const compressImageBase64 = (base64Str: string, maxWidth = 1100, maxHeight = 1100, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (!base64Str || !base64Str.startsWith('data:image/') || base64Str.includes('image/svg+xml')) {
        resolve(base64Str);
        return;
      }

      // If already small enough (under ~60KB), don't process
      if (base64Str.length < 60000) {
        resolve(base64Str);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(base64Str);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (e) {
          console.error("Canvas compression failed, using original image", e);
          resolve(base64Str);
        }
      };
      img.onerror = (e) => {
        console.error("Image load dynamic failure, using original image", e);
        resolve(base64Str);
      };
      img.src = base64Str;
    } catch (err) {
      console.error("Image compression error, using original", err);
      resolve(base64Str);
    }
  });
};

/**
 * Upload details/images to Supabase Storage.
 * If the storage bucket "school_media" is not created or fails,
 * it falls back to passing back the compressed base64 data URL so nothing breaks.
 */
export const uploadBase64ToStorage = async (filePath: string, base64String: string): Promise<string> => {
  let activeBase64 = base64String;
  if (base64String && base64String.startsWith('data:image')) {
    activeBase64 = await compressImageBase64(base64String);
  }

  if (!isSupabaseConfigured) {
    console.warn("Supabase is not configured yet. Retaining inline base64 data.");
    if (activeBase64.length > 350000) {
       console.warn("Base64 string too large to store in database as fallback. Returning empty string.");
       return "";
    }
    return activeBase64;
  }

  try {
    // Standard base64 data-url check
    if (!activeBase64.startsWith('data:')) {
      return activeBase64;
    }

    const res = await fetch(activeBase64);
    const blob = await res.blob();

    // Remove any leading slashes or folders for storage uploads
    const cleanPath = filePath.replace(/^\/+/, '');

    const { error: uploadError } = await supabase.storage
      .from('school_media')
      .upload(cleanPath, blob, {
        upsert: true,
        contentType: blob.type
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('school_media')
      .getPublicUrl(cleanPath);

    return data.publicUrl;
  } catch (err: any) {
    console.warn(`Supabase Storage upload failed ("${filePath}"). Falling back to highly compressed database fallback:`, err?.message || err);
    
    let fallbackBase64 = activeBase64;
    if (activeBase64.startsWith('data:image')) {
      // Compress to a highly performant micro-thumbnail to prevent Postgres locks and transit drops
      fallbackBase64 = await compressImageBase64(activeBase64, 320, 320, 0.45);
    }

    if (fallbackBase64.length > 350000) {
      console.warn("Base64 string too large to store in database as fallback. Returning empty string.");
      return "";
    }
    return fallbackBase64;
  }
};

/**
 * Document Partition Engine:
 * Emulates Firestore's single doc GET.
 * Reads from a simple Postgres table: `school_data`
 */
export const getDocument = async (key: string): Promise<any | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('school_data')
      .select('data')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      // 42P01 is Postgres code for "relation does not exist" - meaning table doesn't exist yet
      if (error.code === '42P01') {
        console.warn(`Supabase Table "school_data" does not exist yet. Please run the SQL migration script.`);
        throw new Error("TABLE_MISSING");
      }
      throw error;
    }

    return data ? data.data : null;
  } catch (err: any) {
    if (err.message === "TABLE_MISSING") {
      throw err;
    }
    console.error(`Error querying Supabase document partition "${key}":`, err);
    throw err;
  }
};

/**
 * Emulates Firestore's single doc SET.
 * Upserts a row with the partition key and jsonb data.
 */
export const setDocument = async (key: string, docData: any): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Please supply NEXT_PUBLIC_SUPABASE_URL.");
  }

  try {
    const { error } = await supabase
      .from('school_data')
      .upsert({
        key,
        data: docData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });

    if (error) {
      if (error.code === '42P01') {
         throw new Error("TABLE_MISSING");
      }
      throw error;
    }
  } catch (err: any) {
    if (err.message === "TABLE_MISSING") {
       throw err;
    }
    console.error(`Error upserting Supabase document partition "${key}":`, err);
    throw err;
  }
};

// SQL code string for the user console / instructions
export const SQL_MIGRATION_SCRIPT = `-- Salin dan tampal kod SQL ini di Supabase SQL Editor anda:

-- 1. Cipta jadual untuk simpanan data sekolah
create table if not exists public.school_data (
  key text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Hidupkan baris sekuriti RLS
alter table public.school_data enable row level security;

-- 3. Kebenaran membaca & menulis secara umum (Public Read & Write)
create policy "Allow public read and write" on public.school_data
  for all using (true) with check (true);

-- 4. Polisi simpanan fail Storage (Sekiranya mahukan gambar & logo dimuat naik ke Storage)
-- Pastikan anda telah mencipta bucket bernama "school_media" di bahagian Storage Supabase anda terlebih dahulu.
`;
