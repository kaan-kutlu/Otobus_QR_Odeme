"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "./components/AppShell";

const FARE_AMOUNT = 20;
const STORAGE_KEY_BALANCE = "otobus-qr-balance";
const STORAGE_KEY_CODE = "otobus-qr-token";
const STORAGE_KEY_USED_CODE = "otobus-qr-used-token";
const STORAGE_KEY_USER = "otobus-qr-user";
const LOGIN_STORAGE_KEY = "otobus-qr-logged-in";
const BALANCE_UPDATED_EVENT = "otobus-qr-balance-updated";
const INITIAL_BALANCE = 20;

function readBalanceFromStorage() {
  if (typeof window === "undefined") {
    return INITIAL_BALANCE;
  }

  const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
  const parsed = Number(savedBalance);
  return Number.isFinite(parsed) ? parsed : INITIAL_BALANCE;
}

function createToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<any>(null);
  const pathname = usePathname();
  const [balance, setBalance] = useState<number>(readBalanceFromStorage);
  const [token, setToken] = useState<string>(createToken());
  const [usedToken, setUsedToken] = useState<string>("");
  const lastScannedRef = useRef<string>("");
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string>("Hazır");
  const [receipt, setReceipt] = useState<{ amount: number; balance: number } | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
    const savedToken = localStorage.getItem(STORAGE_KEY_CODE);
    const savedUsedToken = localStorage.getItem(STORAGE_KEY_USED_CODE);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const loggedIn = sessionStorage.getItem(LOGIN_STORAGE_KEY);

    if (savedBalance) {
      setBalance(Number(savedBalance));
    }

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUsedToken) {
      setUsedToken(savedUsedToken);
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setName(parsed.name || "");
        setSurname(parsed.surname || "");
        setPassword(parsed.password || "");
      } catch {
        // ignore
      }
    }

    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BALANCE, balance.toString());
  }, [balance]);

  useEffect(() => {
    const syncBalance = (value: string | null = localStorage.getItem(STORAGE_KEY_BALANCE)) => {
      if (value === null) {
        setBalance(INITIAL_BALANCE);
        return;
      }

      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        setBalance(parsed);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY_BALANCE) {
        syncBalance(event.newValue);
      }
    };

    const handleBalanceUpdated = () => {
      syncBalance();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleBalanceUpdated();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdated);
    window.addEventListener("focus", handleBalanceUpdated);
    document.addEventListener("visibilitychange", handleVisibility);
    syncBalance();

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdated);
      window.removeEventListener("focus", handleBalanceUpdated);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
    if (savedBalance) {
      const parsed = Number(savedBalance);
      if (Number.isFinite(parsed)) {
        setBalance(parsed);
      }
    }
  }, [pathname]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, token);
  }, [token]);

  useEffect(() => {
    if (usedToken) {
      localStorage.setItem(STORAGE_KEY_USED_CODE, usedToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_USED_CODE);
    }
  }, [usedToken]);

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
        if (result === lastScannedRef.current) {
          return;
        }

        lastScannedRef.current = result;
        const nextBalance = Math.max(0, Number((balance - FARE_AMOUNT).toFixed(2)));
        setBalance(nextBalance);
        setUsedToken(result);
        setToken(createToken());
        setReceipt({ amount: FARE_AMOUNT, balance: nextBalance });
        setReceiptVisible(true);
        setStatus(`QR algılandı. ${FARE_AMOUNT} ₺ düşüldü. Yeni QR oluşturuldu.`);
        void stopScanner();
      },
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

  const router = useRouter();

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !surname.trim() || !password.trim()) {
      setErrorMessage("Ad, soyad ve şifre alanları boş bırakılamaz.");
      return;
    }

    setErrorMessage("");
    setIsLoggedIn(true);
    sessionStorage.setItem(LOGIN_STORAGE_KEY, "true");
    setStatus("Giriş başarılı. QR biniş paneline hoş geldin.");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem(LOGIN_STORAGE_KEY);
    setStatus("Çıkış yapıldı. Giriş sayfasına yönlendiriliyorsunuz.");
    router.push("/");
  };

  return (
    <AppShell
      title={isLoggedIn ? "QR Biniş Paneli" : "Giriş Yap"}
      subtitle={
        isLoggedIn
          ? "QR’yu okut, bakiyeni takip et ve modern deneyime devam et."
          : undefined
      }
      isLoggedIn={isLoggedIn}
      onLogout={handleLogout}
    >
      {!isLoggedIn ? (
        <section className="card form-card">
          <form onSubmit={handleLogin} className="stack">
            <label>
              Ad
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Adınız" />
            </label>
            <label>
              Soyad
              <input value={surname} onChange={(event) => setSurname(event.target.value)} placeholder="Soyadınız" />
            </label>
            <label>
              Şifre
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Şifreniz" />
            </label>
            <button type="submit">Giriş Yap</button>
            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          </form>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="card highlight-card">
            <p className="eyebrow">Aktif bakiye</p>
            <h2>{balance.toFixed(2)} ₺</h2>
            <p>Her başarılı işlemde bakiye 20 ₺ düşer ve yeni QR oluşturulur.</p>
            <div className="status">Durum: {status}</div>
          </section>

          <section className="card">
            <h3>QR Kodun</h3>
            <div className="qr-preview">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Kod" width={280} height={280} />
              ) : (
                <div className="qr-placeholder">QR hazırlanıyor...</div>
              )}
            </div>
            <button onClick={refreshToken} className="secondary">
              QR Yenile
            </button>
          </section>

          <section className="card">
            <h3>Kamera ile Oku</h3>
            <div className="video-wrapper">
              <video ref={videoRef} muted playsInline />
            </div>
            <div className="action-row">
              <button onClick={startScanner} disabled={scanning}>
                Tarayıcıyı Başlat
              </button>
              <button onClick={stopScanner} className="secondary" disabled={!scanning}>
                Tarayıcıyı Durdur
              </button>
            </div>
            <p className="helper-text">{status}</p>
          </section>
        </div>
      )}

      {receiptVisible && receipt ? (
        <div className="receipt-modal-backdrop" onClick={() => setReceiptVisible(false)}>
          <div className="receipt-modal" onClick={(event) => event.stopPropagation()}>
            <h3>İşlem Tamamlandı</h3>
            <p>Alınan Tutar: <strong>{receipt.amount.toFixed(2)} ₺</strong></p>
            <p>Güncel Bakiye: <strong>{receipt.balance.toFixed(2)} ₺</strong></p>
            <button type="button" onClick={() => setReceiptVisible(false)}>
              Kapat
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}