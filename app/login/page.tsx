"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const apiBaseUrl = "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email or username is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 4) {
      setError("Password must meet the required format.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      localStorage.setItem("dr_token", data.token);
      localStorage.setItem("dr_user", JSON.stringify({ name: data.name, role: data.role }));
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F5F7FA] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Two-Panel Container matching specifications */}
      <div className="saas-card w-full max-w-4xl bg-white border border-[#E4E7EC] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* LEFT PANEL: Dark Navy Branding Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0B1F3A] text-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Shield Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6 text-white" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 5L33 10V19C33 27 27.5 33.5 20 36C12.5 33.5 7 27 7 19V10L20 5Z"
                    fill="#0B1F3A"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path d="M20 13V27M13 20H27" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-extrabold tracking-wider text-white uppercase block leading-tight">
                  ResQ
                </span>
                <span className="text-[10px] text-slate-300 block font-medium leading-tight">
                  Emergency Response
                </span>
              </div>
            </div>

            {/* Statement */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-base font-extrabold text-white leading-snug">
                &quot;Prepared communities.<br />Faster response.<br />Safer outcomes.&quot;
              </p>
              <p className="text-xs text-slate-300 font-medium">
                National emergency operations platform for unified citizen distress dispatch and field coordination.
              </p>
            </div>

            {/* 3 Benefits Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-[#102A43] p-3 rounded-xl border border-slate-800">
                <span className="text-base">🚨</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Emergency Assistance</h4>
                  <p className="text-[11px] text-slate-300">Instant one-click SOS dispatch to nearby field units.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#102A43] p-3 rounded-xl border border-slate-800">
                <span className="text-base">📡</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Situational Awareness</h4>
                  <p className="text-[11px] text-slate-300">Real-time telemetry, risk indicators, and weather advisories.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#102A43] p-3 rounded-xl border border-slate-800">
                <span className="text-base">🤝</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Response Coordination</h4>
                  <p className="text-[11px] text-slate-300">Unified EOC, shelters tracking, and medical triage matrix.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 pt-4 border-t border-slate-800 flex justify-between">
            <span>● SYSTEM ONLINE</span>
            <span>v1.0</span>
          </div>
        </div>

        {/* RIGHT PANEL: Light Authentication Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-12 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-[#172033]">Welcome Back</h2>
            <p className="text-xs text-[#667085]">
              Sign in to access the emergency response platform.
            </p>
          </div>

          {/* Error Banner State */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-medium text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#172033] font-bold mb-1.5">
                Email / Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl pl-9 pr-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                />
                <span className="absolute left-3 top-3 text-slate-400">✉️</span>
              </div>
            </div>

            <div>
              <label className="block text-[#172033] font-bold mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl pl-9 pr-10 py-2.5 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                />
                <span className="absolute left-3 top-3 text-slate-400">🔒</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 text-xs font-bold"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[#667085] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#1677FF] focus:ring-[#1677FF]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setError("Password reset instructions have been sent to your administrator.")}
                className="text-[#1677FF] hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1677FF] hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "LOGIN"}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center text-xs text-[#667085] pt-2 border-t border-[#E4E7EC]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#1677FF] font-bold hover:underline">
              REGISTER
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
