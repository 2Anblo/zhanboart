import type { Metadata } from "next";
import "@/index.css";
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
