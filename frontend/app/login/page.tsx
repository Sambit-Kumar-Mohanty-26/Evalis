"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-beige flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-serif text-brand-dark mb-2"
          >
            Evalis
          </motion.h1>
          <p className="text-brand-dark/60 text-sm font-sans">
            Academic Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-brand-dark/5 border border-brand-dark/5 p-8">
          <h2 className="text-xl font-serif text-brand-dark mb-1">Welcome back</h2>
          <p className="text-brand-dark/50 text-sm mb-6 font-sans">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-dark/70 mb-1.5 font-sans">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@institution.edu"
                className="w-full px-4 py-3 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green/50 transition-all font-sans text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark/70 mb-1.5 font-sans">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-brand-beige/50 border border-brand-dark/10 rounded-xl text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green/50 transition-all font-sans text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark/70 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-sans"
              >
                {error}
              </motion.div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-green text-white font-medium rounded-xl hover:bg-brand-green-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:ring-offset-2 focus:ring-offset-brand-beige disabled:opacity-60 disabled:cursor-not-allowed font-sans text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-brand-dark/30 text-xs mt-6 font-sans">
          Evalis Academic Intelligence Platform
        </p>
      </motion.div>
    </div>
  );
}