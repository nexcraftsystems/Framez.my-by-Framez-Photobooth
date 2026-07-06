import { useState, useEffect } from "react";
import { Role, Booking, HardwareItem, CrewLead, ChatMessage, SystemAuditLog } from "./types";
import {
  PACKAGES,
  ADDONS,
  DEFAULT_BOOKINGS,
  DEFAULT_HARDWARE,
  DEFAULT_CREW,
  DEFAULT_CHATS,
  DEFAULT_AUDIT_LOGS,
} from "./data";

// Sub-components
import BackgroundVideo from "./components/BackgroundVideo";
import NavigationHeader from "./components/NavigationHeader";
import HeroSection from "./components/HeroSection";
import PortalLogin from "./components/PortalLogin";
import AvailabilityCalendar from "./components/AvailabilityCalendar";
import ClientDashboard from "./components/ClientDashboard";
import CrewDashboard from "./components/CrewDashboard";
import OwnerDashboard from "./components/OwnerDashboard";
import DeveloperDashboard from "./components/DeveloperDashboard";
import WebsitePages from "./components/WebsitePages";

import { motion, AnimatePresence } from "motion/react";

// Lucide icons
import { Sparkles, Briefcase, User, ShieldAlert, Award, Calendar, Layers, ShieldCheck, Heart, Laptop, Tablet, Monitor } from "lucide-react";

export default function App() {
  // Main session database keys (persistent with localstorage)
  const [activeRole, setActiveRole] = useState<Role>(() => {
    const saved = localStorage.getItem("framez_role");
    return (saved as Role) || "GUEST";
  });

  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("framez_email") || "guest@framez.my";
  });

  const [bookingsList, setBookingsList] = useState<Booking[]>(() => {
    const saved = localStorage.getItem("framez_bookings");
    return saved ? JSON.parse(saved) : DEFAULT_BOOKINGS;
  });

  const [hardwareList, setHardwareList] = useState<HardwareItem[]>(() => {
    const saved = localStorage.getItem("framez_hardware");
    return saved ? JSON.parse(saved) : DEFAULT_HARDWARE;
  });

  const [crewLeads, setCrewLeads] = useState<CrewLead[]>(() => {
    const saved = localStorage.getItem("framez_crew");
    return saved ? JSON.parse(saved) : DEFAULT_CREW;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("framez_chats");
    return saved ? JSON.parse(saved) : DEFAULT_CHATS;
  });

  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => {
    const saved = localStorage.getItem("framez_logs");
    return saved ? JSON.parse(saved) : DEFAULT_AUDIT_LOGS;
  });

  // UI state
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("hero");
  const [selectedDate, setSelectedDate] = useState("2026-07-22");
  const [preselectedPackageId, setPreselectedPackageId] = useState("");
  const [screenWidth, setScreenWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync back to localstorage on change
  useEffect(() => {
    localStorage.setItem("framez_role", activeRole);
    localStorage.setItem("framez_email", userEmail);
    localStorage.setItem("framez_bookings", JSON.stringify(bookingsList));
    localStorage.setItem("framez_hardware", JSON.stringify(hardwareList));
    localStorage.setItem("framez_crew", JSON.stringify(crewLeads));
    localStorage.setItem("framez_chats", JSON.stringify(chatMessages));
    localStorage.setItem("framez_logs", JSON.stringify(auditLogs));
  }, [activeRole, userEmail, bookingsList, hardwareList, crewLeads, chatMessages, auditLogs]);

  // Database mutations helpers
  const handleNewBooking = (newBooking: Booking) => {
    setBookingsList((prev) => [newBooking, ...prev]);
    addAuditLog(
      "Client User",
      `Initiated Pre-Booking slot on ${newBooking.date} with ${newBooking.packageName}`,
      "info"
    );
  };

  const handleApproveReceipt = (bookingId: string) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "BOOKED", receiptApproved: true, rejectionReason: undefined } : b))
    );
  };

  const handleRejectReceipt = (bookingId: string, reason: string) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "REJECTED", receiptApproved: false, rejectionReason: reason } : b))
    );
  };

  const handleAssignCrew = (bookingId: string, crewId: string) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, crewLeadId: crewId } : b))
    );
    const crewName = crewLeads.find((c) => c.id === crewId)?.name || "Zack";
    addAuditLog("Irfan (Co-Founder)", `Assigned Crew Coordinator ${crewName} to booking reference ${bookingId}.`, "info");
  };

  const handleSendMessage = (clientId: string, text: string, sender: "CLIENT" | "CREW" | "OWNER") => {
    const newMsg: ChatMessage = {
      id: "msg_new_" + Math.random().toString(36).substr(2, 9),
      clientId,
      clientName: bookingsList.find((b) => b.id === clientId)?.clientName || "Client",
      sender,
      text,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleUpdateHardwareStock = (id: string, count: number) => {
    setHardwareList((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const status = count <= h.threshold ? "Low Stock" : "Fully Operational";
          return { ...h, stockCount: count, status };
        }
        return h;
      })
    );
  };

  const addAuditLog = (actor: string, action: string, severity: "info" | "warning" | "alert") => {
    const newLog: SystemAuditLog = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      actor,
      action,
      severity,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Reset database state
  const handleResetDatabase = () => {
    if (confirm("Reset local storage database to system defaults? All new logs, bookings, and chats will be cleared.")) {
      localStorage.clear();
      setBookingsList(DEFAULT_BOOKINGS);
      setHardwareList(DEFAULT_HARDWARE);
      setCrewLeads(DEFAULT_CREW);
      setChatMessages(DEFAULT_CHATS);
      setAuditLogs(DEFAULT_AUDIT_LOGS);
      setActiveRole("GUEST");
      setUserEmail("guest@framez.my");
      alert("Local storage successfully refreshed.");
    }
  };

  // Simulate incoming chat request
  const handleSimulateInboundInquiry = () => {
    const newInquiry: ChatMessage = {
      id: "msg_sim_" + Math.random().toString(36).substr(2, 9),
      clientId: "b4",
      clientName: "Irsalina Test",
      sender: "CLIENT",
      text: "Hi Irfan! Can we extend our Classics Experience booking by 2 additional hours during the event on-site? What is the pricing rate?",
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newInquiry]);
    addAuditLog("System Agent", "Received simulation of client WhatsApp CRM inquiry from Irsalina Test.", "info");
    alert("⚡ Simulated new inbound WhatsApp CRM message received! Switch to Owner view to draft a Gemini AI reply draft.");
  };

  // Handle successful login routing
  const handleLoginSuccess = (role: Role, email: string) => {
    setActiveRole(role);
    setUserEmail(email);
    setLoginOpen(false);
    addAuditLog(`${role} Portal`, `Successfully authenticated using account email "${email}".`, "info");
  };

  const handleExplorePackages = () => {
    setCurrentSection("spaces"); // Goes directly to packages list on desktop
    document.getElementById("interactive-portal-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-hidden p-6 md:p-8 lg:p-12 max-w-[1920px] mx-auto bg-black">
      
      {/* Absolute background video & interactive radial cursor-glow tracking */}
      <BackgroundVideo />

      {/* Header Navigation */}
      <NavigationHeader
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenLogin={() => {
          if (activeRole !== "GUEST") {
            setActiveRole("GUEST");
            setUserEmail("guest@framez.my");
            addAuditLog("System", "User logged out of active workspace.", "info");
          } else {
            setLoginOpen(true);
          }
        }}
        onNavigateSection={setCurrentSection}
        currentSection={currentSection}
      />

      {/* 2. MAIN WEBSITE CONTENT SECTION or PORTAL ACCESS WORKSPACE */}
      {activeRole === "GUEST" ? (
        <div className="relative w-full z-30 my-6">
          <AnimatePresence mode="wait">
            {currentSection === "hero" ? (
              <motion.div
                key="hero-key"
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              >
                <HeroSection onExplorePackages={handleExplorePackages} />
              </motion.div>
            ) : (
              <WebsitePages
                currentSection={currentSection}
                onSelectPackage={(pkg) => {
                  setPreselectedPackageId(pkg.id);
                  setCurrentSection("calendar");
                }}
                onStateSelect={setSelectedDate}
                selectedState="selangor"
                bookingsList={bookingsList}
                onNewBooking={handleNewBooking}
                preselectedPackageId={preselectedPackageId}
                onClearPreselectedPackage={() => setPreselectedPackageId("")}
                onAddAuditLog={addAuditLog}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* PORTAL ACCESS WORKSPACE SECTION */
        <div
          id="interactive-portal-section"
          className="relative z-30 w-full mt-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#a1c398] font-bold uppercase tracking-widest">
                Active Session Workspace
              </span>
              <h2 className="text-xl md:text-2xl font-bold font-display text-white mt-1">
                {activeRole} Control Dashboard
              </h2>
            </div>

            {/* Quick toggle list for testing or demonstration ease - only visible in DEVELOPER view */}
            {activeRole === "DEVELOPER" && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-gray-500 uppercase">Interactive Switch:</span>
                {(["CLIENT", "CREW", "OWNER", "DEVELOPER"] as Role[]).map((r) => {
                  const active = activeRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                        if (r === "CLIENT") setUserEmail("nexcraftsystems@gmail.com");
                        else if (r === "CREW") setUserEmail("crew@framez.my");
                        else if (r === "OWNER") setUserEmail("irfan@framez.my");
                        else if (r === "DEVELOPER") setUserEmail("dev@framez.my");
                        
                        addAuditLog("Workspace", `Quick-switched active workspace view to ${r}.`, "info");
                      }}
                      className={`text-[9px] font-bold font-mono uppercase px-2.5 py-1 rounded-md transition-all ${
                        active
                          ? "bg-[#799351] border border-[#a1c398] text-white shadow-md"
                          : "bg-neutral-900 border border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic portal layout switching */}
          <div className="space-y-8">
            
            {activeRole === "CLIENT" && (
              <ClientDashboard
                userEmail={userEmail}
                onNewBooking={handleNewBooking}
                bookingsList={bookingsList}
                role={activeRole}
                onAddAuditLog={addAuditLog}
              />
            )}

            {activeRole === "CREW" && (
              <CrewDashboard
                userEmail={userEmail}
                bookingsList={bookingsList}
                hardwareList={hardwareList}
                crewLeads={crewLeads}
                onAddAuditLog={addAuditLog}
                onUpdateHardwareStock={handleUpdateHardwareStock}
                onUpdateCrewLeads={setCrewLeads}
                chatMessages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            )}

            {(activeRole === "OWNER" || activeRole === "DEVELOPER") && (
              screenWidth < 768 ? (
                <div className="bg-neutral-900/80 border border-white/10 rounded-[2rem] p-6 sm:p-8 text-center backdrop-blur-md max-w-md mx-auto my-6 space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-pulse">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold font-display uppercase tracking-widest text-white">
                      Device Restricted
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono font-bold text-amber-500 uppercase tracking-wider">
                      Mobile Access Protocol Blocked
                    </p>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-light">
                    For operational security and spreadsheet layout fidelity, the <strong>{activeRole} Control Center</strong> is strictly restricted to computers, laptops, or iPad/tablet displays.
                  </p>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-2 text-[11px] text-gray-400">
                    <span className="font-bold text-white block uppercase text-[9px] tracking-widest font-mono mb-1">
                      Approved Displays (768px+):
                    </span>
                    <div className="flex items-center gap-2.5">
                      <Tablet className="w-4 h-4 text-emerald-500" />
                      <span>iPad & Android Tablets</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Laptop className="w-4 h-4 text-emerald-500" />
                      <span>MacBooks & Windows Laptops</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      <span>Wide iMac & Desktop Monitors</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setActiveRole("GUEST");
                        setUserEmail("guest@framez.my");
                        addAuditLog("System", `Logged out of restricted ${activeRole} mobile session.`, "info");
                      }}
                      className="w-full py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Exit Console
                    </button>
                  </div>
                </div>
              ) : (
                <OwnerDashboard
                  bookingsList={bookingsList}
                  hardwareList={hardwareList}
                  crewLeads={crewLeads}
                  chatMessages={chatMessages}
                  auditLogs={auditLogs}
                  onApproveReceipt={handleApproveReceipt}
                  onRejectReceipt={handleRejectReceipt}
                  onAssignCrew={handleAssignCrew}
                  onSendMessage={handleSendMessage}
                  onAddAuditLog={addAuditLog}
                  role={activeRole}
                  onResetDatabase={handleResetDatabase}
                  onSimulateInboundInquiry={handleSimulateInboundInquiry}
                />
              )
            )}

          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="relative z-30 w-full mt-12 text-center border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-3">
        <span>© 2026 Framez.my by Framez Photobooth. All Rights Reserved.</span>
        <span className="flex items-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" /> by Irfan & Irsalina.
        </span>
      </footer>

      {/* High-End Login Modal Overlay */}
      {loginOpen && (
        <PortalLogin
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}
