import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Otobüs QR Biniş Prototipi",
  description: "Kameradan QR okuma ve bakiye düşme prototipi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
