"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FARE_AMOUNT = 1.25;
const STORAGE_KEY_BALANCE = "otobus-qr-balance";
const STORAGE_KEY_CODE = "otobus-qr-token";
const INITIAL_BALANCE = 20;

function createToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<any>(null);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [token, setToken] = useState<string>(createToken());
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string>("Hazır");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
    const savedToken = localStorage.getItem(STORAGE_KEY_CODE);

    if (savedBalance) {
      setBalance(Number(savedBalance));
    }

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BALANCE, balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, token);
  }, [token]);

  useEffect(() => {
    let active = true;

    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(token, { width: 280, margin: 2 }))
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((error) => {
        console.error("QR kodu oluşturulamadı:", error);
        setStatus("QR oluşturulurken hata oluştu");
      });

    return () => {
      active = false;
    };
  }, [token]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.warn("Tarayıcı durdurulurken hata:", error);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    if (!videoRef.current) {
      setStatus("Kamera başlatılamadı");
      return;
    }

    setStatus("Kamera açılıyor...");

    const QrScanner = (await import("qr-scanner")).default;

    if (scannerRef.current) {
      await stopScanner();
    }

    scannerRef.current = new QrScanner(
      videoRef.current,
      (result: string) => {
        if (result === token) {
          const nextBalance = Math.max(0, Number((balance - FARE_AMOUNT).toFixed(2)));
          setBalance(nextBalance);
          setToken(createToken());
          setStatus("Okuma başarılı. Bakiye düşürüldü.");
          stopScanner();
        } else {
          setStatus("Geçersiz QR. Lütfen doğru QR kodunu okutun.");
        }
      },
      // TypeScript'in tip denetimini 'as any' ile atlıyoruz
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      } as any
    );

    try {
      await scannerRef.current.start();
      setScanning(true);
      setStatus("QR okutmak için kamerayı yazılıma doğrultun.");
    } catch (error) {
      console.error("Kamera başlatılamadı:", error);
      setStatus("Kamera başlatılamadı. İzin verin veya yeniden deneyin.");
      scannerRef.current = null;
    }
  };

  const refreshToken = () => {
    setToken(createToken());
    setStatus("Yeni QR oluşturuldu.");
  };

  return (
    <main>
      <div className="container">
        <section className="card">
          <h1>Otobüs QR Biniş Prototipi</h1>
          <p>Kart yerine QR ile biniş prototipi. Her başarılı okutmadan sonra QR yenilenir.</p>
          <div className="status">Bakiye: {balance.toFixed(2)} ₺</div>
        </section>

        <section className="card">
          <h2>QR Kodun</h2>
          <div className="qr-preview">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Kod" width={280} height={280} />
            ) : (
              <div>QR hazırlanıyor...</div>
            )}
          </div>
          <button onClick={refreshToken} className="secondary">
            QR Yenile
          </button>
        </section>

        <section className="card">
          <h2>Kamera ile Oku</h2>
          <div className="video-wrapper">
            <video ref={videoRef} muted playsInline />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <button onClick={startScanner} disabled={scanning}>
              Tarayıcıyı Başlat
            </button>
            <button onClick={stopScanner} className="secondary" disabled={!scanning}>
              Tarayıcıyı Durdur
            </button>
          </div>
          <p style={{ marginTop: "1rem", color: "#cbd5e1" }}>{status}</p>
        </section>
      </div>

      <footer>
        <p>Not: Bu prototip tamamen istemci tarafında çalışır ve Vercel üzerinde ücretsiz deploy edilebilir.</p>
      </footer>
    </main>
  );
}