import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "PFC Visual Browser — Hồ sơ sản xuất trực quan",
  description:
    "Trình duyệt trực quan hồ sơ sản xuất PFC: định mức, lưu trình công đoạn và ảnh minh họa.",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('pfc-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
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
                href="/cong-doan"
                className="px-3 py-1.5 rounded hover:bg-white/10 transition"
              >
                Công đoạn
              </Link>
              <Link
                href="/gallery"
                className="px-3 py-1.5 rounded hover:bg-white/10 transition"
              >
                Thư viện ảnh
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-700 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          PFC Visual Browser — dữ liệu tĩnh từ hồ sơ sản xuất PFC (Giầy Tuấn
          Việt)
        </footer>
      </body>
    </html>
  );
}
