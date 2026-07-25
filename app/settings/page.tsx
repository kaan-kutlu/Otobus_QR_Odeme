"use client";

import { useEffect, useState, type FormEvent } from "react";
import AppShell from "../components/AppShell";

const STORAGE_KEY_USER = "otobus-qr-user";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
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
  }, []);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem(
      STORAGE_KEY_USER,
      JSON.stringify({ name, surname, password })
    );
    setSaved(true);
  };

  return (
    <AppShell title="Ayarlar" subtitle="Ad, soyad ve şifrenizi güncelleyebilirsiniz.">
      <section className="card form-card">
        <form onSubmit={handleSave} className="stack">
          <label>
            Ad
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Adınızı girin" />
          </label>
          <label>
            Soyad
            <input value={surname} onChange={(event) => setSurname(event.target.value)} placeholder="Soyadınızı girin" />
          </label>
          <label>
            Şifre
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Şifrenizi girin" />
          </label>
          <button type="submit">Kaydet</button>
          {saved ? <p className="success-text">Ayarlar kaydedildi.</p> : null}
        </form>
      </section>
    </AppShell>
  );
}
