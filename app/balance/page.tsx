"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";

const STORAGE_KEY_BALANCE = "otobus-qr-balance";
const BALANCE_UPDATED_EVENT = "otobus-qr-balance-updated";

export default function BalancePage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Bakiye eklemek için tutarı girin.");

  useEffect(() => {
    const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
    if (savedBalance) {
      setAmount(savedBalance);
    }
  }, []);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setStatus("Lütfen geçerli bir tutar girin.");
      return;
    }

    const savedBalance = Number(localStorage.getItem(STORAGE_KEY_BALANCE) || "0");
    const nextBalance = Number((savedBalance + parsed).toFixed(2));
    localStorage.setItem(STORAGE_KEY_BALANCE, nextBalance.toString());
    window.dispatchEvent(new CustomEvent(BALANCE_UPDATED_EVENT));
    setStatus(`Bakiye başarıyla eklendi: ${nextBalance.toFixed(2)} ₺`);
    router.push("/");
  };

  return (
    <AppShell title="Bakiye Ekle" subtitle="Bakiyenizi hızlıca güncelleyebilirsiniz.">
      <section className="card form-card">
        <form onSubmit={handleSave} className="stack">
          <label>
            Bakiye tutarı (₺)
            <input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="50" />
          </label>
          <button type="submit">Kaydet</button>
          <p className="success-text">{status}</p>
        </form>
      </section>
    </AppShell>
  );
}
