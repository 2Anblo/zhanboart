import type { Metadata } from "next";
import "@/index.css";

export const metadata: Metadata = {
  title: "zhanbo.art",
  description: "Fragments, light, night, music, and memory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
