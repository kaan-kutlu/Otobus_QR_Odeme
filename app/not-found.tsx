import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center" }}>
        <h2>Sayfa bulunamadı</h2>
        <p>İstenen sayfa mevcut değil.</p>
        <Link href="/">Ana sayfaya dön</Link>
      </div>
    </main>
  );
}
