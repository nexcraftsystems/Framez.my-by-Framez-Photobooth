import { useState } from "react";
import { ArrowUpRight, Menu, X, ShieldAlert, User, Briefcase, Sparkles } from "lucide-react";
import { Role } from "../types";

interface NavigationHeaderProps {
  activeRole: Role;
  onRoleChange: (role: Role) => void;
  onOpenLogin: () => void;
  onNavigateSection: (section: string) => void;
  currentSection: string;
}

export default function NavigationHeader({
  activeRole,
  onRoleChange,
  onOpenLogin,
  onNavigateSection,
  currentSection,
}: NavigationHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: "about", label: "About" },
    { id: "spaces", label: "Spaces" },
    { id: "how-to-book", label: "How to Book" },
    { id: "locations", label: "Locations" },
    { id: "calendar", label: "Calendar" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <header className="relative w-full z-50 flex justify-between items-center bg-transparent py-4">
      {/* Logo (Left) */}
      <div className="flex items-center gap-3">
        <div id="app-logo" className="cursor-pointer group flex items-center gap-2" onClick={() => onNavigateSection("hero")}>
          <span className="text-2xl md:text-3xl font-bold tracking-tighter text-white font-display">
            FRAMEZ<span className="text-[#799351]">.MY</span>
          </span>
        </div>
      </div>

      {/* Desktop Nav (Center) */}
      <nav className="hidden md:flex items-center bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md rounded-full p-1 transition-all">
        {activeRole === "GUEST" ? (
          navLinks.map((link) => {
            const isActive = currentSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigateSection(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-5 py-2 rounded-full text-xs lg:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/90 text-neutral-900 shadow-md font-semibold"
                    : "text-white/85 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            );
          })
        ) : (
          <div className="px-5 py-2 text-xs font-mono font-bold tracking-widest text-[#a1c398] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#799351] animate-pulse" />
            SECURE {activeRole} PORTAL WORKSPACE
          </div>
        )}
      </nav>

      {/* Right Column: Portal Login/Logout CTA */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenLogin}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-medium text-white bg-[#799351] hover:bg-[#5f743e] transition-colors border border-[#a1c398]/30 shadow-xl font-display group"
        >
          {activeRole === "GUEST" ? "Login" : `Logout (${activeRole})`}
          <ArrowUpRight className="w-3.5 h-3.5 text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Mobile Hamburger Trigger */}
      <div className="flex md:hidden items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/10 border border-white/10 text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 p-5 rounded-2xl bg-neutral-950/95 border border-emerald-900/40 backdrop-blur-xl flex flex-col gap-4 z-50 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[#a1c398] font-mono tracking-widest uppercase">Navigation</span>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigateSection(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                  currentSection === link.id
                    ? "bg-[#799351]/50 text-[#a1c398] border border-[#799351]/20"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 my-1 pt-4 flex flex-col gap-3">
            <button
              onClick={() => {
                onOpenLogin();
                setMobileMenuOpen(false);
              }}
              className="flex justify-between items-center w-full px-4 py-3 bg-[#799351] text-white font-medium rounded-xl text-sm hover:bg-[#5f743e] transition-all"
            >
              <span>{activeRole === "GUEST" ? "Login" : `Logout (${activeRole})`}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
