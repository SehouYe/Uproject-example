"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

const LANGS = [
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese" },
  { code: "id", label: "Indonesian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

type Me = { email: string; displayName: string; natives: string[]; targets: string[] };

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [natives, setNatives] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggle = (arr: string[], code: string, set: (v: string[]) => void) =>
    set(arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]);

  // Load current profile (uses GET /api/me)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e?.error || "Failed to load profile");
        }
        const data = (await r.json()) as Me;
        setMe(data);
        setNatives(data.natives || []);
        setTargets(data.targets || []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch("/api/me/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ natives, targets }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.error || "Save failed");
      }
      setMsg("Languages updated. Your matches will refresh.");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("This will permanently delete your account. Continue?")) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const r = await fetch("/api/me", { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.error || "Delete failed");
      }
      await signOut({ callbackUrl: "/login" });
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link href="/matches" className="text-indigo-600 underline">
            Back to matches
          </Link>
        </header>

        {loading && (
          <div className="p-4 rounded-2xl border border-gray-200 animate-pulse">Loading…</div>
        )}

        {!loading && me && (
          <div className="mb-6 text-sm text-gray-700">
            <div>
              <span className="font-semibold">Email:</span> {me.email}
            </div>
            <div>
              <span className="font-semibold">Name:</span> {me.displayName}
            </div>
          </div>
        )}

        {err && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{err}</div>}
        {msg && <div className="p-3 bg-emerald-100 text-emerald-700 rounded mb-4">{msg}</div>}

        {!loading && (
          <>
            <section className="mb-6">
              <h2 className="font-semibold mb-2">Native language(s)</h2>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button
                    key={"n-" + l.code}
                    type="button"
                    onClick={() => toggle(natives, l.code, setNatives)}
                    className={`px-3 py-1 rounded-full border ${
                      natives.includes(l.code)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-6">
              <h2 className="font-semibold mb-2">Target language(s)</h2>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button
                    key={"t-" + l.code}
                    type="button"
                    onClick={() => toggle(targets, l.code, setTargets)}
                    className={`px-3 py-1 rounded-full border ${
                      targets.includes(l.code)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={busy}
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save languages"}
              </button>

              <button
                onClick={deleteAccount}
                disabled={busy}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
              >
                {busy ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
