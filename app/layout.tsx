import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PFC Visual Browser — Hồ sơ sản xuất trực quan",
  description:
    "Trình duyệt trực quan hồ sơ sản xuất PFC: định mức, lưu trình công đoạn và ảnh minh họa.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <header className="bg-slate-900 text-white sticky top-0 z-40 shadow">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg tracking-tight">
              <span className="text-amber-400">PFC</span> Visual Browser
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded hover:bg-white/10 transition"
              >
                Tổng quan
              </Link>
              <Link
                href="/brand/adidas"
                className="px-3 py-1.5 rounded hover:bg-white/10 transition"
              >
                ADIDAS
              </Link>
              <Link
                href="/brand/jileon"
                className="px-3 py-1.5 rounded hover:bg-white/10 transition"
              >
                JILEON
              </Link>
              <Link
                href="/gallery"
                className="px-3 py-1.5 rounded hover:bg-white/10 transition"
              >
                Thư viện ảnh
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          PFC Visual Browser — dữ liệu tĩnh từ hồ sơ sản xuất PFC (Giầy Tuấn
          Việt)
        </footer>
      </body>
    </html>
  );
}
