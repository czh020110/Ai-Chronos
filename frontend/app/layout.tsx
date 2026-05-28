import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chronos 智纪元 — AI 进化时间线",
  description: "全自动化 AI 进化时间线与协同百科平台",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="night" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
