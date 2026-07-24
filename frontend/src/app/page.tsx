"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKey, EnvelopeSimple, Wrench, ShieldCheck, Lightning } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (loginType === "admin") {
      if (email === "admin123@society.in" && password === "admin@123") {
        router.push("/admin");
      } else {
        setError("Invalid admin email or password");
      }
    } else {
      if (email === "resident@society.in" && password === "password") {
        router.push("/resident");
      } else if (email === "vendor@fixnest.in" && password === "password") {
        router.push("/vendor");
      } else {
        setError("Invalid user email or password");
      }
    }
  };

  // Quick login helpers
  const fillQuickCreds = (type: string) => {
    if (type === "admin") {
      setLoginType("admin");
      setEmail("admin123@society.in");
      setPassword("admin@123");
    } else if (type === "resident") {
      setLoginType("user");
      setEmail("resident@society.in");
      setPassword("password");
    } else {
      setLoginType("user");
      setEmail("vendor@fixnest.in");
      setPassword("password");
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left side: Hero/Info Panel (Spacious design) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl font-bold tracking-tighter">FN</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">FixNest</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Smart Facility Management <br />
            <span className="text-primary-400">Powered by AI</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md mb-12">
            The all-in-one platform connecting gated communities with verified professionals for instant issue resolution.
          </p>

          <div className="space-y-6 max-w-sm">
            <div className="flex items-start gap-4">
              <div className="bg-slate-800 p-3 rounded-lg text-primary-400">
                <Lightning size={24} weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI-Powered Triage</h3>
                <p className="text-sm text-slate-400 mt-1">Automatically categorize and prioritize maintenance requests instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-slate-800 p-3 rounded-lg text-emerald-400">
                <ShieldCheck size={24} weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Geo-Tag Verification</h3>
                <p className="text-sm text-slate-400 mt-1">Ensures absolute accountability with location-matched job completion.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-12">
          <p className="text-slate-500 text-sm">© 2026 FixNest Platforms Inc.</p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 bg-slate-50 relative">
        <div className="max-w-sm w-full mx-auto">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          {/* Toggle Navigation */}
          <div className="flex p-1 bg-slate-200/60 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => { setLoginType("user"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginType === "user"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Resident / Vendor
            </button>
            <button
              type="button"
              onClick={() => { setLoginType("admin"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginType === "admin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <EnvelopeSimple size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow outline-none"
                  placeholder={loginType === "admin" ? "admin123@society.in" : "resident@society.in"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LockKey size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md shadow-primary-500/20 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98] mt-4"
            >
              Sign in as {loginType === "admin" ? "Admin" : "User"}
            </button>
          </form>
          
          {/* Quick Login */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-4">Quick Access</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={() => fillQuickCreds("resident")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50">Resident</button>
              <button onClick={() => fillQuickCreds("vendor")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50">Vendor</button>
              <button onClick={() => fillQuickCreds("admin")} className="px-3 py-1.5 bg-white border border-slate-200 text-primary-600 text-xs font-bold rounded-md hover:bg-primary-50 border-primary-200">Admin</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
