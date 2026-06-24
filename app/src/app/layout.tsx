import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Thanh Long Market",
  description:
    "Mô phỏng đa người chơi về thị trường, quy luật giá trị và cơ chế hình thành giá cả.",
  icons: {
    icon: [{ url: "/dragonfruit.svg", type: "image/svg+xml" }],
    shortcut: "/dragonfruit.svg",
    apple: "/dragonfruit.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
