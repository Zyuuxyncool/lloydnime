import React from 'react'

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-2xl border border-pink-500/30 bg-neutral-900/80 p-8 md:p-12 shadow-2xl shadow-pink-900/20 text-center">
        <p className="inline-block rounded-full bg-pink-500/15 border border-pink-500/40 px-4 py-1 text-xs font-semibold tracking-widest text-pink-300 mb-6">
          MAINTENANCE MODE
        </p>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Website sedang dalam perbaikan
        </h1>

        <p className="mt-4 text-neutral-300 text-sm md:text-base leading-relaxed">
          Kami sedang melakukan maintenance untuk meningkatkan performa dan stabilitas layanan.
          Silakan kembali beberapa saat lagi.
        </p>

        <div className="mt-8 grid gap-3 text-sm text-neutral-400">
          <p>Terima kasih atas pengertiannya 🙏</p>
        </div>
      </section>
    </main>
  )
}