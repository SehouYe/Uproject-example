"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react"; // 👁️ icons (install: npm i lucide-react)

// Language options
const LANGS = [
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese" },
  { code: "id", label: "Indonesian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState(""); // ✅ new password state
  const [showPassword, setShowPassword] = useState(false); // ✅ show/hide state
  const [natives, setNatives] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggle(arr: string[], code: string, setter: (v: string[]) => void) {
    setter(arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName,
        password, // ✅ send password to backend
        natives,
        targets,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErr(data?.error || "Signup failed");
      return;
    }

    // ✅ Auto sign-in after signup
    await signIn("credentials", { email, password, redirect: false });
    router.push("/matches");
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-sm text-gray-600 mb-6">
          Choose native & target languages to get matched.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Display name
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Ryan"
            />
          </div>

          {/* ✅ Password Field with Show/Hide */}
<div>
  <label className="block text-sm font-medium mb-1">Password</label>
  <div className="relative">
    <input
      className="w-full border rounded px-3 py-2 pr-16 focus:ring-2 focus:ring-indigo-500"
      type={showPassword ? "text" : "password"}
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Choose a password"
    />

    {/* 👁️ Button clearly visible now */}
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-gray-900 bg-white border-l border-gray-200 rounded-r"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      <span className="ml-1 text-sm">{showPassword ? "Hide" : "Show"}</span>
    </button>
  </div>
</div>


          {/* Native Languages */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Native language(s)
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  type="button"
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
          <div>
            <label className="block text-sm font-medium mb-2">
              Target language(s)
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  type="button"
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

          {/* Error message */}
          {err && (
            <div className="p-3 bg-red-100 text-red-700 rounded">{err}</div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
