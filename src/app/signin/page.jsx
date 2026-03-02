// app/signin/page.jsx
"use client";

import { getProviders, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import BreadcrumbNavigation from "../components/BreadcrumbNavigation";

// (Opsional) Impor ikon jika Anda mau
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function SignInPage() {
  const breadcrumbs = [
    { title: 'Sign In', href: '/signin' }
  ];
  const [providers, setProviders] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    // Ambil daftar provider (Google, GitHub) saat komponen dimuat
    const fetchProviders = async () => {
      try {
        const res = await getProviders();
        setProviders(res || {});
      } catch {
        setProviders({});
        setLoadError('Gagal memuat provider login. Coba refresh halaman.');
      }
    };
    fetchProviders();
  }, []);

  if (!providers) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <p className="text-white">Memuat...</p>
      </div>
    );
  }

  const providerList = Object.values(providers || {});

  // Objek untuk ikon (opsional)
  const providerIcons = {
    Google: <FcGoogle size={24} />,
    GitHub: <FaGithub size={24} />,
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-10">
        <BreadcrumbNavigation crumbs={breadcrumbs} />
      </div>
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-white">
          Login Ke LloydNime
        </h2>

        {loadError && (
          <p className="text-sm text-red-300 text-center bg-red-500/10 border border-red-500/30 rounded-md p-2">
            {loadError}
          </p>
        )}

        {providerList.length === 0 && (
          <p className="text-sm text-yellow-200 text-center bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2">
            Provider login belum dikonfigurasi. Isi env OAuth terlebih dahulu.
          </p>
        )}
        
        <div className="space-y-4">
          {/* Looping semua provider yang Anda daftarkan 
            di file route.js (Google, GitHub)
          */}
          {providerList.map((provider) => (
            <button
              key={provider.name}
              // Ini adalah fungsi utama untuk memicu login
              onClick={() => signIn(provider.id, { 
                callbackUrl: '/users/dashboard' // Redirect ke dashboard setelah login
              })}
              className={`
                w-full flex items-center justify-center gap-3 px-4 py-3 
                rounded-md font-semibold transition-colors duration-200 
                focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-offset-gray-800
                ${
                  provider.name === "Google"
                    ? "bg-white text-gray-700 hover:bg-gray-100 focus:ring-blue-500"
                    : "bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500"
                }
              `}
            >
              {providerIcons[provider.name]}
              <span>Sign in with {provider.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}