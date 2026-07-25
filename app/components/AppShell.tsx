"use client";

import Link from "next/link";
import { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  isLoggedIn?: boolean;
  onLogout?: () => void;
};

export default function AppShell({ title, subtitle, children, isLoggedIn, onLogout }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">QR</span>
          <div>
            <strong>Erzincan Belediyesi</strong>
            <small>Modern biniş deneyimi</small>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Ana navigasyon">
          <Link href="/">Ana Sayfa</Link>
          <Link href="/settings">Ayarlar</Link>
          <Link href="/balance">Bakiye Ekle</Link>
          {isLoggedIn && onLogout ? (
            <button type="button" onClick={onLogout} className="secondary logout-button">
              Çıkış Yap
            </button>
          ) : null}
        </nav>
      </header>

      <main className="page-content">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Gelişmiş mobil deneyim</p>
            <h1>{title}</h1>
            {subtitle ? <p className="hero-copy">{subtitle}</p> : null}
          </div>
        </section>

        {children}
      </main>

      <footer className="site-footer">
        <p>Erzincan Belediyesi • QR biniş sistemi • Her an güncel bakiye</p>
      </footer>
    </div>
  );
}
