"use client";
import { signOut } from "next-auth/react";

export function AuthBar() {
  return (
    <div className="mb-4">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="px-3 py-1 bg-gray-200 rounded"
      >
        Sign out
      </button>
    </div>
  );
}
