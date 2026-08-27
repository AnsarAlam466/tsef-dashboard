"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center text-[#F2EFE4]"
      style={{
        background:
          "radial-gradient(ellipse at 70% 30%, rgba(184,149,74,0.08) 0%, transparent 60%), radial-gradient(ellipse at 15% 80%, rgba(184,149,74,0.05) 0%, transparent 50%), #141B17",
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#2E3A32] bg-[#1C2420] p-8 shadow-xl">
        <div className="mb-6">
          <div className="font-heading text-xl font-bold leading-tight tracking-tight">
            <span className="text-[#B8954A]">Ten&</span>
            <span className="font-light text-[#F2EFE4]">See</span>
          </div>
          <div className="mt-0.5 text-[12px] leading-tight text-[#6E7E72]">Sign in to the operating system</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-[#6E7E72]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2.5 text-sm outline-none focus:border-[#6E7E72]"
              placeholder="you@tensee.local"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-[#6E7E72]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#2E3A32] bg-[#232D27] px-3 py-2.5 text-sm outline-none focus:border-[#6E7E72]"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#B8954A] py-2.5 text-sm font-semibold text-[#1C2420] transition hover:bg-[#C9A06B] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
