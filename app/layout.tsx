import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
export const metadata: Metadata = { title: "Mark / Down — 文档转 Markdown", description: "由 Microsoft MarkItDown 驱动的即用即走文档转换工具。" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>; }
