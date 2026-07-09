import React, { useState, useEffect, useRef } from "react";
import { Role, Booking, HardwareItem, CrewLead, ChatMessage, SystemAuditLog, Testimonial, InventoryLocation, InventoryItem, InventoryRequest, SystemNotification } from "./types";
import {
  PACKAGES,
  ADDONS,
  DEFAULT_BOOKINGS,
  DEFAULT_HARDWARE,
  DEFAULT_CREW,
  DEFAULT_CHATS,
  DEFAULT_AUDIT_LOGS,
  DEFAULT_TESTIMONIALS,
  DEFAULT_LOCATIONS,
  DEFAULT_INVENTORY,
  DEFAULT_NOTIFICATIONS,
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
import { initializeFirestoreDb, db, addFirestoreAuditLog, handleFirestoreError, OperationType, auth, FireAccount } from "./firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Lucide icons
import { Sparkles, Briefcase, User, ShieldAlert, Award, Calendar, Layers, ShieldCheck, Heart, Laptop, Tablet, Monitor, Volume2, VolumeX, Loader2 } from "lucide-react";

export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Play a high chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Play a secondary lower chime for harmony
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(440, now + 0.05); // A4
    osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.2); // D5
    gain2.gain.setValueAtTime(0.1, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.6);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.85);
  } catch (e) {
    console.warn("AudioContext notification failed:", e);
  }
}

export default function App() {
  const [loadingAuth, setLoadingAuth] = useState(true);

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

  const [isCalendarSynced, setIsCalendarSynced] = useState<boolean>(() => {
    const saved = localStorage.getItem("framez_calendar_synced");
    return saved ? saved === "true" : true;
  });

  const [testimonialsList, setTestimonialsList] = useState<Testimonial[]>(() => {
    const saved = localStorage.getItem("framez_testimonials");
    return saved ? JSON.parse(saved) : DEFAULT_TESTIMONIALS;
  });

  const [locations, setLocations] = useState<InventoryLocation[]>(() => {
    const saved = localStorage.getItem("framez_locations");
    return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("framez_inventory");
    return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
  });

  const [inventoryRequests, setInventoryRequests] = useState<InventoryRequest[]>(() => {
    const saved = localStorage.getItem("framez_inventory_requests");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem("framez_notifications");
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("framez_sound_enabled");
    return saved ? saved === "true" : true;
  });

  // UI state
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("hero");
  const [selectedDate, setSelectedDate] = useState("2026-07-22");
  const [preselectedPackageId, setPreselectedPackageId] = useState("");
  const [screenWidth, setScreenWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));

  useEffect(() => {
    initializeFirestoreDb();
  }, []);

  // Live session state observer (secures session boundary)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true);
      if (user) {
        try {
          const email = (user.email || "").trim().toLowerCase();
          const q = query(collection(db, "accounts"), where("email", "==", email));
          const qSnap = await getDocs(q);

          let role: Role = "CLIENT";
          let resolvedEmail = email;

          if (!qSnap.empty) {
            const accData = qSnap.docs[0].data() as FireAccount;
            role = accData.role;
            resolvedEmail = accData.email;
          } else {
            // Auto-provision user account document on first secure federated login
            const isDev = email === "nexcraftsystems@gmail.com";
            const isOwner = email === "nexcraftsystems@google.com";
            const resolvedRole: Role = isDev ? "DEVELOPER" : isOwner ? "OWNER" : "CLIENT";

            const newId = user.uid;
            const newAccount: FireAccount = {
              id: newId,
              email: email,
              name: user.displayName || (isDev ? "Nexcraft Developer" : isOwner ? "Nexcraft Owner" : "Google Client User"),
              role: resolvedRole,
              accessStatus: "ACTIVE_VERIFIED",
              clientBookingIds: [],
              firstTimeLogin: false
            };
            await setDoc(doc(db, "accounts", newId), newAccount);
            role = resolvedRole;
            resolvedEmail = email;
          }

          setActiveRole(role);
          setUserEmail(resolvedEmail);
          localStorage.setItem("framez_role", role);
          localStorage.setItem("framez_email", resolvedEmail);
        } catch (err) {
          console.error("Failed to sync authentic session with Firestore database:", err);
        }
      } else {
        setActiveRole("GUEST");
        setUserEmail("guest@framez.my");
        localStorage.removeItem("framez_role");
        localStorage.removeItem("framez_email");
      }
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save sound setting to localStorage
  useEffect(() => {
    localStorage.setItem("framez_sound_enabled", soundEnabled ? "true" : "false");
  }, [soundEnabled]);

  // Real-time synchronization of Bookings and Notifications with Firestore
  useEffect(() => {
    // 1. Sync Bookings List
    const unsubscribeBookings = onSnapshot(collection(db, "bookings"), async (snapshot) => {
      if (snapshot.empty) {
        // Seed DEFAULT_BOOKINGS to Firestore
        try {
          const promises = DEFAULT_BOOKINGS.map(b => setDoc(doc(db, "bookings", b.id), b));
          await Promise.all(promises);
        } catch (err) {
          console.error("Failed to seed default bookings to Firestore", err);
        }
      } else {
        const list: Booking[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Booking);
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setBookingsList(list);
      }
    }, (error) => {
      console.error("Bookings sync error:", error);
      handleFirestoreError(error, OperationType.GET, "bookings");
    });

    // 2. Sync Notifications List
    const unsubscribeNotifications = onSnapshot(collection(db, "notifications"), async (snapshot) => {
      if (snapshot.empty) {
        // Seed DEFAULT_NOTIFICATIONS to Firestore
        try {
          const promises = DEFAULT_NOTIFICATIONS.map(n => setDoc(doc(db, "notifications", n.id), n));
          await Promise.all(promises);
        } catch (err) {
          console.error("Failed to seed default notifications to Firestore", err);
        }
      } else {
        const list: SystemNotification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as SystemNotification);
        });
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(list);
      }
    }, (error) => {
      console.error("Notifications sync error:", error);
      handleFirestoreError(error, OperationType.GET, "notifications");
    });

    return () => {
      unsubscribeBookings();
      unsubscribeNotifications();
    };
  }, []);

  // Play sound when a new notification is added
  const prevNotifCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (notifications.length > 0) {
      if (prevNotifCountRef.current !== null && notifications.length > prevNotifCountRef.current) {
        // A new notification was added! Play sound if enabled and the notification is very recent
        const newest = notifications[0]; // notifications are sorted newest first
        const ageMs = Date.now() - new Date(newest.timestamp).getTime();
        if (soundEnabled && ageMs < 10000) {
          playNotificationSound();
        }
      }
      prevNotifCountRef.current = notifications.length;
    } else if (prevNotifCountRef.current === null) {
      prevNotifCountRef.current = 0;
    }
  }, [notifications, soundEnabled]);

  // Sync back to localstorage on change
  useEffect(() => {
    localStorage.setItem("framez_role", activeRole);
    localStorage.setItem("framez_email", userEmail);
    localStorage.setItem("framez_bookings", JSON.stringify(bookingsList));
    localStorage.setItem("framez_hardware", JSON.stringify(hardwareList));
    localStorage.setItem("framez_crew", JSON.stringify(crewLeads));
    localStorage.setItem("framez_chats", JSON.stringify(chatMessages));
    localStorage.setItem("framez_logs", JSON.stringify(auditLogs));
    localStorage.setItem("framez_calendar_synced", isCalendarSynced ? "true" : "false");
    localStorage.setItem("framez_testimonials", JSON.stringify(testimonialsList));
    localStorage.setItem("framez_locations", JSON.stringify(locations));
    localStorage.setItem("framez_inventory", JSON.stringify(inventory));
    localStorage.setItem("framez_inventory_requests", JSON.stringify(inventoryRequests));
    localStorage.setItem("framez_notifications", JSON.stringify(notifications));
  }, [activeRole, userEmail, bookingsList, hardwareList, crewLeads, chatMessages, auditLogs, isCalendarSynced, testimonialsList, locations, inventory, inventoryRequests, notifications]);

  // Database mutations helpers with Firestore persistence
  const handleNewBooking = async (newBooking: Booking) => {
    try {
      // 1. Write booking to Firestore
      await setDoc(doc(db, "bookings", newBooking.id), newBooking);
      
      // 2. Add an audit log in Firestore
      await addFirestoreAuditLog(
        "Client User",
        `Initiated Pre-Booking slot on ${newBooking.date} with ${newBooking.packageName}`,
        "info"
      );

      // 3. Create a notification for OWNER only
      const notifId = "notif_order_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const newNotif: SystemNotification = {
        id: notifId,
        title: "🛍️ New Photo Booth Order!",
        message: `${newBooking.clientName} placed a new pre-booking for ${newBooking.packageName} on ${newBooking.date}. Amount: RM ${newBooking.totalPrice}.`,
        recipientRole: "OWNER",
        targetRole: "OWNER",
        sender: "System Booking Engine",
        timestamp: new Date().toISOString(),
        isReadBy: [],
        type: "INFO"
      };
      await setDoc(doc(db, "notifications", notifId), newNotif);
    } catch (err) {
      console.error("Failed to add new booking to Firestore:", err);
    }
  };

  const handleApproveReceipt = async (bookingId: string) => {
    const booking = bookingsList.find((b) => b.id === bookingId);
    if (!booking) return;
    const updated = { ...booking, status: "BOOKED" as const, receiptApproved: true, rejectionReason: undefined };
    try {
      await setDoc(doc(db, "bookings", bookingId), updated);
      await addFirestoreAuditLog(
        "Irfan (Co-Founder)",
        `Approved payment receipt for booking reference ${bookingId}.`,
        "info"
      );
    } catch (err) {
      console.error("Failed to approve receipt in Firestore:", err);
    }
  };

  const handleRejectReceipt = async (bookingId: string, reason: string) => {
    const booking = bookingsList.find((b) => b.id === bookingId);
    if (!booking) return;
    const updated = { ...booking, status: "REJECTED" as const, receiptApproved: false, rejectionReason: reason };
    try {
      await setDoc(doc(db, "bookings", bookingId), updated);
      await addFirestoreAuditLog(
        "Irfan (Co-Founder)",
        `Rejected payment receipt for booking reference ${bookingId}. Reason: ${reason}`,
        "warning"
      );
    } catch (err) {
      console.error("Failed to reject receipt in Firestore:", err);
    }
  };

  const handleAssignCrew = async (bookingId: string, crewId: string, isSecond?: boolean) => {
    const booking = bookingsList.find((b) => b.id === bookingId);
    if (!booking) return;
    const updated = { ...booking, [isSecond ? "crewLeadId2" : "crewLeadId"]: crewId };
    try {
      await setDoc(doc(db, "bookings", bookingId), updated);
      
      const crewName = crewLeads.find((c) => c.id === crewId)?.name || "Unassigned";
      await addFirestoreAuditLog(
        "Irfan (Co-Founder)",
        `Assigned Crew Coordinator ${crewName} as Person In-charge ${isSecond ? "2" : "1"} to booking reference ${bookingId}.`,
        "info"
      );

      if (crewId) {
        const notifId = "notif_assign_" + Math.random().toString(36).substring(2, 9);
        const newNotif: SystemNotification = {
          id: notifId,
          title: "📋 New Event Assigned!",
          message: `You have been assigned as Person In-charge ${isSecond ? "2" : "1"} for ${booking.clientName}'s ${booking.packageName} event on ${booking.date}. Venue: ${booking.locationAddress || "Specified venue"}.`,
          recipientRole: "PERSONAL_CREW",
          targetCrewId: crewId,
          sender: "System Coordinator",
          timestamp: new Date().toISOString(),
          isReadBy: [],
          type: "TASK"
        };
        await setDoc(doc(db, "notifications", notifId), newNotif);
      }
    } catch (err) {
      console.error("Failed to assign crew in Firestore:", err);
    }
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

  // Reset database state in Firestore and local
  const handleResetDatabase = async () => {
    try {
      localStorage.clear();
      
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      for (const d of bookingsSnap.docs) {
        await deleteDoc(doc(db, "bookings", d.id));
      }
      for (const b of DEFAULT_BOOKINGS) {
        await setDoc(doc(db, "bookings", b.id), b);
      }

      const notificationsSnap = await getDocs(collection(db, "notifications"));
      for (const d of notificationsSnap.docs) {
        await deleteDoc(doc(db, "notifications", d.id));
      }
      for (const n of DEFAULT_NOTIFICATIONS) {
        await setDoc(doc(db, "notifications", n.id), n);
      }

      setHardwareList(DEFAULT_HARDWARE);
      setCrewLeads(DEFAULT_CREW);
      setChatMessages(DEFAULT_CHATS);
      setAuditLogs(DEFAULT_AUDIT_LOGS);
      setActiveRole("GUEST");
      setUserEmail("guest@framez.my");
      alert("System database and default collections have been successfully refreshed.");
    } catch (err) {
      console.error("Failed to reset database:", err);
      alert("Failed to reset database: " + err);
    }
  };

  // State update interceptors for dashboards
  const handleUpdateBookings = async (
    updater: React.SetStateAction<Booking[]>
  ) => {
    let newList: Booking[] = [];
    if (typeof updater === "function") {
      newList = (updater as any)(bookingsList);
    } else {
      newList = updater;
    }

    try {
      // Find deleted ones
      for (const b of bookingsList) {
        const stillExists = newList.find(item => item.id === b.id);
        if (!stillExists) {
          await deleteDoc(doc(db, "bookings", b.id));
        }
      }
      // Find added or modified ones
      for (const b of newList) {
        const existing = bookingsList.find(item => item.id === b.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(b)) {
          await setDoc(doc(db, "bookings", b.id), b);
        }
      }
    } catch (err) {
      console.error("Error saving booking to Firestore:", err);
    }
  };

  const handleUpdateNotifications = async (
    updater: React.SetStateAction<SystemNotification[]>
  ) => {
    let newList: SystemNotification[] = [];
    if (typeof updater === "function") {
      newList = (updater as any)(notifications);
    } else {
      newList = updater;
    }

    try {
      for (const n of newList) {
        const existing = notifications.find(item => item.id === n.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(n)) {
          await setDoc(doc(db, "notifications", n.id), n);
        }
      }
    } catch (err) {
      console.error("Error saving notification to Firestore:", err);
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

  if (loadingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative p-6 font-sans">
        {/* Subtle background overlay */}
        <div className="absolute inset-0 bg-[#070708] z-0 pointer-events-none" />
        
        {/* Decorative ambient background blur */}
        <div 
          className="absolute w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 z-0"
          style={{
            background: "linear-gradient(135deg, #799351 0%, #a1c398 100%)"
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Stylized custom security badge */}
          <div className="p-4 bg-neutral-900/60 border border-white/10 rounded-full mb-6 relative animate-pulse shadow-2xl">
            <ShieldCheck className="w-8 h-8 text-[#a1c398]" />
            {/* Spinning radar arc */}
            <div className="absolute -inset-1 rounded-full border border-[#799351]/30 animate-ping pointer-events-none" />
          </div>

          <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#a1c398] uppercase mb-2">
            Securing Session Boundary
          </span>
          
          <h2 className="text-lg font-bold font-display text-white tracking-tight mb-2">
            Verifying identity credentials...
          </h2>
          
          <p className="text-[11px] text-gray-500 font-light leading-relaxed max-w-xs mb-6">
            Evaluating active cryptographic tokens and establishing an encrypted database connection handshake.
          </p>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 border border-white/5 rounded-full text-[9px] font-mono text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a1c398]" />
            <span>Establishing secure state listener...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-hidden p-6 md:p-8 lg:p-12 max-w-[1920px] mx-auto bg-black">
      
      {/* Absolute background video & interactive radial cursor-glow tracking */}
      <BackgroundVideo />

      {/* Header Navigation */}
      <NavigationHeader
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onOpenLogin={async () => {
          if (activeRole !== "GUEST") {
            try {
              await signOut(auth);
              addAuditLog("System", "User logged out of active workspace.", "info");
            } catch (err) {
              console.error("Logout failed:", err);
            }
          } else {
            setLoginOpen(true);
          }
        }}
        onNavigateSection={setCurrentSection}
        currentSection={currentSection}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
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
                testimonialsList={testimonialsList}
                isCalendarSynced={isCalendarSynced}
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
                          else if (r === "DEVELOPER") setUserEmail("nexcraftsystems@gmail.com");
                          
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
                onUpdateBooking={(updated) => {
                  handleUpdateBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
                }}
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
                locations={locations}
                onUpdateLocations={setLocations}
                inventory={inventory}
                onUpdateInventory={setInventory}
                inventoryRequests={inventoryRequests}
                onUpdateRequests={setInventoryRequests}
                notifications={notifications}
                onUpdateNotifications={handleUpdateNotifications}
              />
            )}

            {(activeRole === "OWNER" || activeRole === "DEVELOPER") && (
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
                isCalendarSynced={isCalendarSynced}
                onToggleCalendarSync={() => setIsCalendarSynced(!isCalendarSynced)}
                testimonialsList={testimonialsList}
                onUpdateTestimonials={setTestimonialsList}
                locations={locations}
                onUpdateLocations={setLocations}
                inventory={inventory}
                onUpdateInventory={setInventory}
                inventoryRequests={inventoryRequests}
                onUpdateRequests={setInventoryRequests}
                notifications={notifications}
                onUpdateNotifications={handleUpdateNotifications}
                onUpdateBookings={handleUpdateBookings}
              />
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
          onRegisterRedirect={() => {
            setLoginOpen(false);
            setCurrentSection("calendar");
          }}
        />
      )}

    </div>
  );
}
