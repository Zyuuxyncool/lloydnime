'use client';

// File ini diperlukan untuk membungkus aplikasi Anda dengan
// SessionProvider, agar useSession() bisa berfungsi.

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export default function NextAuthProvider({ children }) {
  useEffect(() => {
    // Suppress hydration warnings caused by browser extensions (Bitdefender, etc.)
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('Hydration') || 
         args[0].includes('bis_skin_checked') ||
         args[0].includes('server rendered HTML didn\'t match'))
      ) {
        return;
      }
      originalError(...args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}