"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("pfc-theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Chuyển nền sáng" : "Chuyển nền tối"}
      title={dark ? "Nền sáng" : "Nền tối"}
      className="ml-auto p-2 rounded-lg hover:bg-white/10 transition text-lg leading-none"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
