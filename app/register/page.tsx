"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const apiBaseUrl = "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email address is required.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setError("Account created. Please sign in with your new credentials.");
      router.push("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F5F7FA] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Two-Panel Container */}
      <div className="saas-card w-full max-w-4xl bg-white border border-[#E4E7EC] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
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
                &quot;Join the emergency network.<br />Save lives together.&quot;
              </p>
              <p className="text-xs text-slate-300 font-medium">
                Register as a Citizen, Field Responder, or EOC Specialist to coordinate disaster relief.
              </p>
            </div>

            {/* 3 Benefits Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-[#102A43] p-3 rounded-xl border border-slate-800">
                <span className="text-base">👤</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Citizen Access</h4>
                  <p className="text-[11px] text-slate-300">Submit SOS alerts, track active shelters & weather advisories.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#102A43] p-3 rounded-xl border border-slate-800">
                <span className="text-base">🚑</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Responder Dispatch</h4>
                  <p className="text-[11px] text-slate-300">Receive real-time distress signals & route mapping.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#102A43] p-3 rounded-xl border border-slate-800">
                <span className="text-base">🛡️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">EOC Control Desk</h4>
                  <p className="text-[11px] text-slate-300">Command & control matrix for national resource management.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 pt-4 border-t border-slate-800 flex justify-between">
            <span>● SECURE REGISTRATION</span>
            <span>v1.0</span>
          </div>
        </div>

        {/* RIGHT PANEL: Light Registration Form Panel (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-center space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-[#172033]">Create Account</h2>
            <p className="text-xs text-[#667085]">
              Register to access emergency services and operational dashboards.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-medium text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Account Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                >
                  <option value="CITIZEN">Citizen User</option>
                </select>
                <p className="mt-1 text-[10px] text-[#667085]">Responder and EOC accounts are provisioned by an administrator.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                />
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl pl-3 pr-8 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 p-1 text-xs font-bold"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#172033] font-bold mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1677FF] hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 mt-2"
            >
              {isSubmitting ? "Creating Account..." : "REGISTER ACCOUNT"}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-xs text-[#667085] pt-2 border-t border-[#E4E7EC]">
            Already registered?{" "}
            <Link href="/login" className="text-[#1677FF] font-bold hover:underline">
              LOGIN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
