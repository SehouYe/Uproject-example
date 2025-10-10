"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password: "x",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) setErr("Login failed. Please check your email or sign up first.");
    else router.push("/matches");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full p-6 bg-white rounded shadow">
        <h1 className="text-3xl font-bold mb-4">LOGIN PAGE</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border rounded px-3 py-2"
          />
          {err && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{err}</div>}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-4 text-center">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-indigo-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  );
}
