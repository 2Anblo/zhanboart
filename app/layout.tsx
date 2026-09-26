import type { Metadata } from "next";
import "@/index.css";
import "@/landing.css";
import ThemeProvider from "@/components/ThemeProvider";
import FluidCursor from "@/components/FluidCursor";

export const metadata: Metadata = {
  title: "zhanbo.art",
  description: "Fragments, light, night, music, and memory.",
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = saved;
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var root = document.documentElement;
    root.classList.add(theme);
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Landing-only faces; nothing else references these families. Root layout, so it applies to every page. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300&family=Noto+Serif+SC:wght@300;400&display=swap"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <FluidCursor />
        </ThemeProvider>
      </body>
    </html>
  );
}
