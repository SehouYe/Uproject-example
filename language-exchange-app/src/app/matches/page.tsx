"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthBar } from "@/components/AuthBar";
import Link from "next/link";

type Match = {
  id: number;
  displayName: string;
  natives: string[];
  targets: string[];
  pair?: { myNative: string; myTarget: string };
  reason: string;
};

export default function MatchesPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const checkedRef = useRef(false); // ✅ prevents infinite refresh

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ✅ Refresh session ONCE when authenticated
  useEffect(() => {
    if (status === "authenticated" && !checkedRef.current) {
      checkedRef.current = true;
      (async () => {
        const fresh = await update({ trigger: "update" });
        console.log("✅ Fresh session:", fresh);
        if (fresh?.needsSetup) {
          router.replace("/language-setup"); // use replace to avoid history loop
        }
      })();
    }
  }, [status, update, router]);

  // ✅ Load matches
  useEffect(() => {
    if (status !== "authenticated") return;
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const data = await (res.ok
          ? res.json()
          : res.json().then((e) => Promise.reject(e)));

        if (alive) setMatches(Array.isArray(data.matches) ? data.matches : []);
      } catch (e: any) {
        if (alive) setErr(e?.error ?? "Failed to load matches");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Checking session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-1">Your Matches</h1>
      <p className="text-sm text-gray-600 mb-4">
        Rule: <span className="font-semibold">A.native ∈ B.targets</span> and{" "}
        <span className="font-semibold">B.native ∈ A.targets</span>.
      </p>

      <AuthBar />

      <div className="mb-4">
        <Link href="/settings" className="text-indigo-600 underline">
          Edit languages / Delete account
        </Link>
      </div>

      {loading && (
        <div className="mt-4 p-6 rounded-2xl border border-gray-200 animate-pulse">
          Loading matches…
        </div>
      )}

      {err && (
        <div className="mt-4 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && matches.length === 0 && (
        <div className="mt-4 p-6 rounded-2xl border border-dashed border-gray-300 text-gray-600">
          No reciprocal matches right now.
        </div>
      )}

      {Array.isArray(matches) && matches.length > 0 && (
        <div className="mt-4 grid gap-4">
          {matches.map((m) => (
            <article
              key={m.id}
              className="p-4 rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{m.displayName}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {m.pair ? (
                      <>
                        Pair:{" "}
                        <span className="font-semibold">
                          {m.pair.myNative?.toUpperCase()}
                        </span>{" "}
                        ↔{" "}
                        <span className="font-semibold">
                          {m.pair.myTarget?.toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">No pair info</span>
                    )}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <LangRow label="native" items={m.natives} tone="native" />
                  <LangRow label="target" items={m.targets} tone="target" />
                </div>
              </div>

              <p className="text-sm text-gray-700 mt-3">{m.reason}</p>

              <div className="mt-4 flex items-center gap-2">
                <button className="px-3 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95">
                  Connect
                </button>
                <button className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95">
                  View profile
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function LangRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "native" | "target";
}) {
  const pill =
    tone === "native"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
  const tag =
    tone === "native"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-indigo-100 text-indigo-800";
  return (
    <div className="flex items-center gap-1 flex-wrap justify-end">
      <span
        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tag}`}
      >
        {label}
      </span>
      {items.map((c) => (
        <span
          key={label + c}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${pill}`}
        >
          {c.toUpperCase()}
        </span>
      ))}
    </div>
  );
}
