import React, { useState } from "react";
import { ArrowRight, Mail, X, Check, Eye } from "lucide-react";
import { Role } from "../types";
import { motion } from "motion/react";

interface PortalLoginProps {
  onClose: () => void;
  onLoginSuccess: (role: Role, email: string) => void;
}

export default function PortalLogin({ onClose, onLoginSuccess }: PortalLoginProps) {
  const [emailInput, setEmailInput] = useState("");
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [btnHovered, setBtnHovered] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-fill accounts helper
  const roleAccounts = [
    { email: "nexcraftsystems@gmail.com", role: "CLIENT" as Role, desc: "Siti / Client Workspace" },
    { email: "crew@framez.my", role: "CREW" as Role, desc: "Zack / Crew Field App" },
    { email: "irfan@framez.my", role: "OWNER" as Role, desc: "Irfan / Co-Founder CRM" },
    { email: "dev@framez.my", role: "DEVELOPER" as Role, desc: "Superuser Sandbox" },
  ];

  const checkDeviceAndLogin = (role: Role, email: string) => {
    if ((role === "OWNER" || role === "DEVELOPER") && window.innerWidth < 768) {
      setLoginError("⚠️ Operational Restriction: The Owner and Developer consoles are restricted to Laptop, Desktop, or iPad displays (768px and wider). Please sign in from a wider device.");
      return;
    }
    setLoginError(null);
    onLoginSuccess(role, email);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    
    // Resolve role based on input email
    let resolvedRole: Role = "CLIENT";
    if (cleanEmail.includes("dev")) resolvedRole = "DEVELOPER";
    else if (cleanEmail.includes("irfan") || cleanEmail.includes("irsalina")) resolvedRole = "OWNER";
    else if (cleanEmail.includes("crew") || cleanEmail.includes("zack") || cleanEmail.includes("maya")) resolvedRole = "CREW";
    
    checkDeviceAndLogin(resolvedRole, cleanEmail || "nexcraftsystems@gmail.com");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      className="fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 bg-black overflow-y-auto"
    >
      {/* 1. Global Background Video (scaled 105% with overlay and backdrop blur) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          src="https://cdn.sceneai.art/backgrounds/e102a51c-c095-492e-b909-72bb753f83a2.mov"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Dark overlay & backdrop blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      {/* Close button top-right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 2. Main Center Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative w-full max-w-[1040px] min-h-[650px] bg-neutral-950/80 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row my-auto backdrop-blur-2xl"
      >
        
        {/* 3. Left Side (Video Mask Area - 45% width) */}
        <div className="w-full md:w-[45%] bg-[#0c0c0e] relative overflow-hidden hidden md:block min-h-[400px] md:min-h-auto">
          <video
            src="https://cdn.sceneai.art/backgrounds/e102a51c-c095-492e-b909-72bb753f83a2.mov"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle warm vignette to accent left mask area */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/25 via-transparent to-amber-950/25 pointer-events-none" />
          
          {/* Decorative branding info inside the left side video mask */}
          <div className="absolute bottom-8 left-8 right-8 z-10 text-white flex flex-col gap-2">
            <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase">Premium Experience</span>
            <h3 className="text-3xl font-light font-display italic tracking-tight leading-tight">Framez Photobooth</h3>
            <p className="text-xs text-white/70 leading-relaxed font-light">
              Interactive high-speed printing, unlimited downloads, and AI-enabled coordination CRM systems.
            </p>
          </div>
        </div>

        {/* 4. Right Side (Form Area - 55% width) */}
        <div className="w-full md:w-[55%] bg-neutral-900/60 p-6 md:p-10 lg:p-12 relative flex flex-col justify-between overflow-hidden">
          
          {/* Decorative, absolutely positioned blurred circle in the top-left corner using a woody-green theme gradient */}
          <div 
            className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-20"
            style={{
              background: "linear-gradient(135deg, #799351 0%, #a1c398 100%)"
            }}
          />

          {/* Header */}
          <div className="text-center mt-4">
            <h2 className="text-3xl md:text-[40px] font-semibold tracking-tight text-white leading-tight font-display italic">
              Welcome back
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Sign in to your premium photobooth workspace
            </p>
          </div>

          {loginError && (
            <div className="p-4 mt-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-300 leading-relaxed text-center font-light relative z-10 animate-fade-in">
              {loginError}
            </div>
          )}

          {/* Account Quick Click Assistants */}
          <div className="bg-[#799351]/10 border border-[#799351]/20 rounded-2xl p-4 my-4 relative z-10">
            <span className="text-[10px] font-mono font-bold text-[#a1c398] tracking-widest uppercase block mb-2">
              ⚡ Sandbox Demo Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {roleAccounts.map((acc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setEmailInput(acc.email);
                  }}
                  className="flex flex-col items-start p-2 bg-black/40 hover:bg-[#799351]/10 border border-[#799351]/20 rounded-xl text-left transition-all group"
                >
                  <span className="text-xs font-semibold text-white font-mono group-hover:text-[#a1c398]">
                    {acc.desc}
                  </span>
                  <span className="text-[9px] text-gray-400 truncate w-full block">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Social Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
              <button
                type="button"
                onMouseEnter={() => setHoveredSocial("google")}
                onMouseLeave={() => setHoveredSocial(null)}
                onClick={() => {
                  setEmailInput("nexcraftsystems@gmail.com");
                  checkDeviceAndLogin("CLIENT", "nexcraftsystems@gmail.com");
                }}
                className="flex items-center justify-between p-3.5 bg-black/30 hover:bg-black/50 border border-white/10 rounded-[1.25rem] text-xs text-white font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Google Logo SVG */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Google Connection</span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-colors ${hoveredSocial === "google" ? "text-[#a1c398]" : "text-gray-500"}`} />
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredSocial("x")}
                onMouseLeave={() => setHoveredSocial(null)}
                onClick={() => {
                  setEmailInput("irfan@framez.my");
                  checkDeviceAndLogin("OWNER", "irfan@framez.my");
                }}
                className="flex items-center justify-between p-3.5 bg-black/30 hover:bg-black/50 border border-white/10 rounded-[1.25rem] text-xs text-white font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* X Logo SVG */}
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Continue with X</span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-colors ${hoveredSocial === "x" ? "text-[#a1c398]" : "text-gray-500"}`} />
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold font-mono">OR</span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {/* Email Input Group with rotating conic-gradient button */}
            <form onSubmit={handleFormSubmit} className="relative z-10">
              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-[1.25rem] p-2 focus-within:bg-black/60 focus-within:border-[#799351] transition-all gap-2">
                <div className="flex-1 pl-3 flex flex-col py-1">
                  <label className="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-wider leading-none">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-transparent border-none outline-none text-white text-xs font-medium mt-1 w-full placeholder-gray-600"
                  />
                </div>

                {/* Submit Button (CRITICAL): Rotating conic-gradient border on hover */}
                <div 
                  className="relative flex items-center justify-center p-0.5 rounded-full"
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                >
                  {/* Conic background halo (outer glow spinning) */}
                  <div 
                    className={`absolute inset-0 rounded-full blur-md opacity-75 transition-all duration-500 scale-105 pointer-events-none ${
                      btnHovered ? "animate-spin-conic opacity-100" : "opacity-0"
                    }`}
                    style={{
                      background: "conic-gradient(from 0deg, #799351, #a1c398, #5f743e, #799351)"
                    }}
                  />

                  {/* Conic background border */}
                  <div 
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${
                      btnHovered ? "animate-spin-conic" : ""
                    }`}
                    style={{
                      background: "conic-gradient(from 0deg, #799351, #a1c398, #5f743e, #799351)"
                    }}
                  />

                  {/* Inner black button */}
                  <button
                    type="submit"
                    className="relative w-[48px] h-[48px] rounded-full bg-neutral-950 flex items-center justify-center text-white shadow-[inner_0_2px_4px_rgba(255,255,255,0.2)] hover:scale-102 transition-transform duration-200 z-10 cursor-pointer"
                  >
                    <ArrowRight className={`w-4 h-4 text-white transition-transform duration-300 ${btnHovered ? "translate-x-0.5" : ""}`} />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer with background clip sunset/woody-green gradient */}
          <div className="text-center text-[11px] text-gray-500 mt-6 relative z-10">
            <span>Don't have an account? </span>
            <button
              onClick={() => setEmailInput("nexcraftsystems@gmail.com")}
              className="font-semibold transition-all hover:opacity-85 text-[#a1c398] hover:underline"
            >
              Sign up
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
