"use client";

import React, { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; role: string; token: string }) => void;
  apiBaseUrl: string;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess, apiBaseUrl }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!isLoginMode && password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      setIsSubmitting(false);
      return;
    }

    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
    const payload = isLoginMode
      ? { email, password }
      : { name, email, password, phone, role: "CITIZEN" };

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (isLoginMode) {
        localStorage.setItem("dr_token", data.token);
        localStorage.setItem("dr_user", JSON.stringify({ name: data.name, role: data.role }));
        onLoginSuccess({ name: data.name, role: data.role, token: data.token });
        onClose();
      } else {
        setIsLoginMode(true);
        setError("Account created successfully! Please log in with your credentials.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication service is unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white border border-[#E4E7EC] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-[#172033] my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[#E4E7EC] pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#172033]">
              {isLoginMode ? "Account Sign In" : "Register Profile"}
            </h2>
            <p className="text-xs text-[#667085]">
              {isLoginMode ? "Access your emergency response console." : "Create a citizen account."}
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-700 text-2xl font-bold" onClick={onClose}>
            &times;
          </button>
        </div>

        {!isLoginMode && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Citizen access is open. Responder and EOC accounts are provisioned by an administrator.</p>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs font-medium">
          {!isLoginMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[#172033] font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="text-[#172033] font-bold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[#172033] font-bold block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#172033] font-bold block mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF]"
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="text-[#172033] font-bold block mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF]"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-700 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1677FF] hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition uppercase tracking-wider mt-2"
          >
            {isSubmitting
              ? "Submitting..."
              : isLoginMode
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="border-t border-[#E4E7EC] pt-3 text-center">
          <button
            type="button"
            className="text-xs text-[#1677FF] hover:underline font-bold transition"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
          >
            {isLoginMode
              ? "Need an account? Register here →"
              : "Already have an account? Sign in here →"}
          </button>
        </div>
      </div>
    </div>
  );
}
