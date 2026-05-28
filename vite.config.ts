import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env / .env.local if present
dotenv.config();
dotenv.config({ path: '.env.local' });

// Safely read firebase-applet-config.json as a fallback
let firebaseConfig: Record<string, string> = {};
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.NEXT_PUBLIC_FIREBASE_API_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
        process.env.VITE_FIREBASE_API_KEY || 
        firebaseConfig.apiKey || 
        ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 
        process.env.VITE_FIREBASE_AUTH_DOMAIN || 
        firebaseConfig.authDomain || 
        ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
        process.env.VITE_FIREBASE_PROJECT_ID || 
        firebaseConfig.projectId || 
        ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
        process.env.VITE_FIREBASE_STORAGE_BUCKET || 
        firebaseConfig.storageBucket || 
        ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 
        firebaseConfig.messagingSenderId || 
        ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_APP_ID': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 
        process.env.VITE_FIREBASE_APP_ID || 
        firebaseConfig.appId || 
        ''
      ),
      'process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(
        process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || 
        process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 
        firebaseConfig.firestoreDatabaseId || 
        ''
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
