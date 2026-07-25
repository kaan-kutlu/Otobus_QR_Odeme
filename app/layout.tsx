import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erzincan Belediyesi | QR Biniş Sistemi",
  description: "Modern QR biniş deneyimi, bakiye takibi ve hızlı erişim",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
