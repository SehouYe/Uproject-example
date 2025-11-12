"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LANGS = [
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese" },
  { code: "id", label: "Indonesian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function LanguageSetup() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [natives, setNatives] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ If user already has languages, skip setup
  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        const fresh = await update({ trigger: "update" });
        console.log("Fresh session on setup:", fresh);
        if (fresh?.needsSetup === false) {
          console.log("✅ User already setup, skipping");
          router.push("/matches");
        }
      })();
    }
  }, [status, update, router]);

  function toggle(arr: string[], code: string, setter: (v: string[]) => void) {
    setter(arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]);
  }

  async function handleSave() {
    if (natives.length === 0 || targets.length === 0) {
      alert("Please select at least one native and one target language.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/user-languages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ natives, targets }),
    });
    setLoading(false);

    if (res.ok) {
      // ✅ Force token/session refresh
      await update({ trigger: "update" });
      router.push("/matches");
    } else {
      alert("Failed to save preferences.");
    }
  }

  if (status === "loading") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Checking account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Set Your Language Preferences</h1>
        <p className="text-gray-600 mb-6">
          Choose at least one native and one target language to get matched.
        </p>

        {/* Native Languages */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Native language(s)</h2>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={"n-" + l.code}
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
        </div>

        {/* Target Languages */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Target language(s)</h2>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={"t-" + l.code}
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
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save and Continue"}
        </button>
      </div>
    </main>
  );
}
