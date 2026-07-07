import React, { useState, useEffect } from "react";
import { Booking, HardwareItem, CrewLead, ChatMessage, SystemAuditLog, Role, Testimonial, InventoryLocation, InventoryItem, InventoryRequest, SystemNotification } from "../types";
import PrintableReceipt from "./PrintableReceipt";
import InventoryManager from "./InventoryManager";
import NotificationManager from "./NotificationManager";
import { 
  MessageSquare, 
  ShieldCheck, 
  Clipboard, 
  Send, 
  Sparkles, 
  Check, 
  X, 
  ShieldAlert, 
  Award, 
  FileText, 
  BarChart3, 
  HelpCircle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Database, 
  Terminal,
  Calendar as CalendarIcon,
  Download,
  UserPlus,
  Shield,
  Key,
  Layers,
  Search,
  Lock,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bell,
  Package,
  QrCode
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  BarChart,
  Bar
} from "recharts";
import { PACKAGES } from "../data";

interface OwnerDashboardProps {
  bookingsList: Booking[];
  hardwareList: HardwareItem[];
  crewLeads: CrewLead[];
  chatMessages: ChatMessage[];
  auditLogs: SystemAuditLog[];
  onApproveReceipt: (id: string) => void;
  onRejectReceipt: (bookingId: string, reason: string) => void;
  onAssignCrew: (bookingId: string, crewId: string, isSecond?: boolean) => void;
  onSendMessage: (clientId: string, text: string, sender: "OWNER" | "CREW") => void;
  onAddAuditLog: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  role: Role;
  onResetDatabase?: () => void;
  onSimulateInboundInquiry?: () => void;
  isCalendarSynced?: boolean;
  onToggleCalendarSync?: () => void;
  testimonialsList?: Testimonial[];
  onUpdateTestimonials?: (testimonials: Testimonial[]) => void;
  
  // New Inventory state
  locations: InventoryLocation[];
  onUpdateLocations: React.Dispatch<React.SetStateAction<InventoryLocation[]>>;
  inventory: InventoryItem[];
  onUpdateInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  inventoryRequests: InventoryRequest[];
  onUpdateRequests: React.Dispatch<React.SetStateAction<InventoryRequest[]>>;
  
  // New Notifications state
  notifications: SystemNotification[];
  onUpdateNotifications: React.Dispatch<React.SetStateAction<SystemNotification[]>>;
  onUpdateBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
}

// Google Easy-Access Accounts representation (synced with localStorage)
interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  role: Role;
  accessStatus: "ACTIVE_VERIFIED" | "SUSPENDED" | "PENDING_INVITE";
  clientBookingIds: string[];
}

export default function OwnerDashboard({
  bookingsList,
  hardwareList,
  crewLeads,
  chatMessages,
  auditLogs,
  onApproveReceipt,
  onRejectReceipt,
  onAssignCrew,
  onSendMessage,
  onAddAuditLog,
  role,
  onResetDatabase,
  onSimulateInboundInquiry,
  isCalendarSynced = true,
  onToggleCalendarSync = () => {},
  testimonialsList = [],
  onUpdateTestimonials = () => {},
  locations,
  onUpdateLocations,
  inventory,
  onUpdateInventory,
  inventoryRequests,
  onUpdateRequests,
  notifications,
  onUpdateNotifications,
  onUpdateBookings,
}: OwnerDashboardProps) {
  // Shared Active View Tabs for Owner & Developer
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "spreadsheet" | "calendar" | "crm" | "accounts" | "performance" | "receipts" | "inventory" | "notifications" | "bankConfig">("dashboard");
  const [selectedReceiptBookingId, setSelectedReceiptBookingId] = useState<string>(() => {
    return bookingsList.length > 0 ? bookingsList[0].id : "";
  });
  const selectedReceiptBooking = bookingsList.find(b => b.id === selectedReceiptBookingId);
  const [calendarRegion, setCalendarRegion] = useState<string>("ALL");

  const [activeChatClientId, setActiveChatClientId] = useState<string>("b3"); // Default to Zulkifli
  const [typedMessage, setTypedMessage] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Developer Bank Config states
  const [bankNameEdit, setBankNameEdit] = useState(() => localStorage.getItem("framez_bank_name") || "Maybank (Malayan Banking Berhad)");
  const [bankAccNameEdit, setBankAccNameEdit] = useState(() => localStorage.getItem("framez_bank_acc_name") || "Framez Photobooth Enterprise");
  const [bankAccNoEdit, setBankAccNoEdit] = useState(() => localStorage.getItem("framez_bank_acc_no") || "5140-1234-5678");
  const [bankQrUrlEdit, setBankQrUrlEdit] = useState(() => localStorage.getItem("framez_bank_qr_url") || "");
  const [pushSuccessMsg, setPushSuccessMsg] = useState<string | null>(null);

  // Accounts Management state (Developer only)
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>(() => {
    const saved = localStorage.getItem("framez_gsso_accounts");
    if (saved) return JSON.parse(saved);
    
    // Default mock accounts
    return [
      { id: "acc_1", email: "nexcraftsystems@gmail.com", name: "Siti Aminah", role: "CLIENT", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: ["b1"] },
      { id: "acc_2", email: "crew@framez.my", name: "Zack Crew lead", role: "CREW", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
      { id: "acc_3", email: "irfan@framez.my", name: "Irfan (Co-Founder)", role: "OWNER", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
      { id: "acc_4", email: "dev@framez.my", name: "Developer Superuser", role: "DEVELOPER", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
      { id: "acc_5", email: "zack@framez.my", name: "Zack Coordinator", role: "CREW", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
    ];
  });

  // Account creation state
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccRole, setNewAccRole] = useState<Role>("CLIENT");
  const [selectedAccessBooking, setSelectedAccessBooking] = useState<string>("");

  // Testimonials custom builder state
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testiLogo, setTestiLogo] = useState("");
  const [testiQuote, setTestiQuote] = useState("");
  const [testiAuthor, setTestiAuthor] = useState("");
  const [testiImageUrl, setTestiImageUrl] = useState("");

  useEffect(() => {
    localStorage.setItem("framez_gsso_accounts", JSON.stringify(googleAccounts));
  }, [googleAccounts]);

  // Executive Sales & Revenue calculations
  const approvedBookings = bookingsList.filter((b) => b.status === "BOOKED");
  const pendingBookings = bookingsList.filter((b) => b.status === "PREBOOKED");

  const totalSalesRevenue = approvedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingSalesVolume = pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalBookingsCount = bookingsList.length;
  const averageOrderValue = approvedBookings.length > 0 
    ? Math.round(totalSalesRevenue / approvedBookings.length) 
    : 649;

  // Active chat details
  const activeChats = chatMessages.filter((m) => m.clientId === activeChatClientId);
  const currentClientBooking = bookingsList.find((b) => b.id === activeChatClientId);

  // Group WhatsApp chat clients
  const uniqueClients = Array.from(new Set(chatMessages.map((c) => c.clientId))).map((id) => {
    const lastChat = chatMessages.filter((m) => m.clientId === id).slice(-1)[0];
    return {
      id,
      clientName: bookingsList.find((b) => b.id === id)?.clientName || lastChat?.clientName || "Client Inquiry",
      lastMessage: lastChat?.text || "",
      timestamp: lastChat?.timestamp || "",
    };
  });

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    onSendMessage(activeChatClientId, typedMessage, "OWNER");
    onAddAuditLog(
      "Irfan (Owner)",
      `Replied to ${currentClientBooking?.clientName || "Client"} via WhatsApp CRM`,
      "info"
    );
    setTypedMessage("");
    setAiGeneratedText("");
  };

  // Simulated AI response via server route or mock fallback
  const triggerAiResponseGenerator = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/gemini/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientMessage: activeChats.slice(-1)[0]?.text || "No prior texts.",
          clientName: currentClientBooking?.clientName || "Siti",
          packageSelected: currentClientBooking?.packageName || "Platinum Royal"
        })
      });

      const data = await response.json();
      if (data.text) {
        setAiGeneratedText(data.text);
        setTypedMessage(data.text);
      } else {
        // High quality fallback
        const draft = `Hello ${currentClientBooking?.clientName || "Client"}, hope you are well! I have reviewed your receipt for the ${currentClientBooking?.packageName || "photobooth package"} on date ${currentClientBooking?.date || "July"}. All verification details look excellent. We've locked your slot! - Irfan`;
        setAiGeneratedText(draft);
        setTypedMessage(draft);
      }
    } catch (err) {
      const draft = `Hello ${currentClientBooking?.clientName || "Client"}, thank you for uploading your proof of deposit bank slip! We have locked this July 2026 slot for you in our master database. Let's arrange backdrop preferences next. - Irfan`;
      setAiGeneratedText(draft);
      setTypedMessage(draft);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApprove = (bookingId: string) => {
    onApproveReceipt(bookingId);
    onAddAuditLog(
      "Irsalina (Co-Founder)",
      `Verified bank transfer slip and APPROVED booking reference ${bookingId}.`,
      "info"
    );
    alert(`🏦 Deposit Verified & Approved! Master calendar date is now LOCKED GREEN for reference ${bookingId}.`);
  };

  const handlePushNotificationToCrew = (bookingId: string, crewId: string, isSecond?: boolean) => {
    if (!crewId) return;
    const crewMember = crewLeads.find(c => c.id === crewId);
    if (!crewMember) return;
    const booking = bookingsList.find(b => b.id === bookingId);
    if (!booking) return;

    const newNotif: SystemNotification = {
      id: "notif_push_" + Math.random().toString(36).substring(2, 9),
      title: "⚡ Urgent Crew Alert!",
      message: `Owner/Developer sent a priority alert for ${booking.clientName}'s ${booking.packageName} event. Please check schedules & confirm equipment preparedness immediately.`,
      recipientRole: "PERSONAL_CREW",
      targetCrewId: crewId,
      sender: "System Coordinator",
      timestamp: new Date().toISOString(),
      isRead: false,
      type: "TASK"
    };

    if (onUpdateNotifications) {
      onUpdateNotifications(prev => [newNotif, ...prev]);
    }
    onAddAuditLog("Owner Dashboard", `Dispatched manual push-alert notification to coordinator ${crewMember.name} (PIC ${isSecond ? "2" : "1"}) for event ${bookingId}.`, "warning");
    
    setPushSuccessMsg(`Push Notification successfully dispatched to coordinator ${crewMember.name}!`);
    setTimeout(() => {
      setPushSuccessMsg(null);
    }, 4000);
  };

  // EXCEL SPREADSHEET EXPORT ENGINE (CSV standard with BOM header for Microsoft Excel compat)
  const handleExportSpreadsheetToExcel = () => {
    // Columns: Client Name, Package Order, Location, Person In-Charge, Assigned Hours, Package Price, Approval Status
    const headers = [
      "Client Name",
      "Package Order",
      "Location Address",
      "Person In-Charge (Crew)",
      "Assigned Hours",
      "Package Price (RM)",
      "Approval Progress"
    ];

    const rows = bookingsList.map((b) => {
      const assignedCrew = crewLeads.find((c) => c.id === b.crewLeadId)?.name || "Unassigned";
      const hours = PACKAGES.find((p) => p.name.toLowerCase() === b.packageName.toLowerCase())?.durationHrs || 3;
      const progress = b.status === "BOOKED" ? "APPROVED (LOCKED)" : "PENDING (DEPOSIT CHECK)";
      
      return [
        `"${b.clientName.replace(/"/g, '""')}"`,
        `"${b.packageName.replace(/"/g, '""')}"`,
        `"${(b.locationAddress || "Not Defined").replace(/"/g, '""')}"`,
        `"${assignedCrew.replace(/"/g, '""')}"`,
        `${hours}`,
        `${b.totalPrice}`,
        `"${progress}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(","))
    ].join("\n");

    // Add BOM for proper excel formatting representation
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `framez_coordination_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onAddAuditLog(
      role === "DEVELOPER" ? "Developer Admin" : "Irfan (Co-Founder)",
      "Exported Client Progress Table to Microsoft Excel compatibility format (.CSV)",
      "info"
    );
  };

  // Developer Only: Create GSSO Account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccEmail || !newAccName) {
      alert("Please provide both Account Name and Verified Google Email.");
      return;
    }

    const newAcc: GoogleAccount = {
      id: "acc_" + Math.random().toString(36).substr(2, 9),
      email: newAccEmail.trim().toLowerCase(),
      name: newAccName.trim(),
      role: newAccRole,
      accessStatus: "ACTIVE_VERIFIED",
      clientBookingIds: selectedAccessBooking ? [selectedAccessBooking] : []
    };

    setGoogleAccounts((prev) => [newAcc, ...prev]);
    onAddAuditLog(
      "Developer",
      `Created verified Google Easy-Access account: ${newAcc.email} with Role: ${newAcc.role}.`,
      "alert"
    );

    // reset fields
    setNewAccEmail("");
    setNewAccName("");
    setNewAccRole("CLIENT");
    setSelectedAccessBooking("");
    alert(`🔑 Registered ${newAcc.name} successfully. Account can now login securely via Google SSO!`);
  };

  // Developer Only: Modify account permission roles
  const handleUpdateAccountRole = (accId: string, targetRole: Role) => {
    setGoogleAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accId) {
          onAddAuditLog(
            "Developer",
            `Upgraded permission role for ${acc.email} from ${acc.role} to ${targetRole}.`,
            "alert"
          );
          return { ...acc, role: targetRole };
        }
        return acc;
      })
    );
  };

  // Developer Only: Testimonials customizers
  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testiLogo || !testiQuote || !testiAuthor || !testiImageUrl) {
      alert("Please fill in all testimonial fields.");
      return;
    }

    if (editingTestimonialId) {
      const updated = testimonialsList.map(t => 
        t.id === editingTestimonialId 
          ? { ...t, logo: testiLogo, quote: testiQuote, author: testiAuthor, imageUrl: testiImageUrl }
          : t
      );
      onUpdateTestimonials(updated);
      onAddAuditLog("Developer", `Edited testimonial card ID: ${editingTestimonialId}`, "info");
      setEditingTestimonialId(null);
    } else {
      const newTesti: Testimonial = {
        id: "testi_" + Math.random().toString(36).substr(2, 9),
        logo: testiLogo,
        quote: testiQuote,
        author: testiAuthor,
        imageUrl: testiImageUrl
      };
      onUpdateTestimonials([...testimonialsList, newTesti]);
      onAddAuditLog("Developer", `Added new testimonial memory card by ${testiAuthor}`, "alert");
    }

    setTestiLogo("");
    setTestiQuote("");
    setTestiAuthor("");
    setTestiImageUrl("");
  };

  const handleEditTestimonialClick = (t: Testimonial) => {
    setEditingTestimonialId(t.id);
    setTestiLogo(t.logo);
    setTestiQuote(t.quote);
    setTestiAuthor(t.author);
    setTestiImageUrl(t.imageUrl);
  };

  const handleDeleteTestimonial = (id: string) => {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      const filtered = testimonialsList.filter(t => t.id !== id);
      onUpdateTestimonials(filtered);
      onAddAuditLog("Developer", `Deleted testimonial card ID: ${id}`, "alert");
    }
  };

  // Developer Only: Edit Client Access
  const handleToggleBookingAccess = (accId: string, bookingId: string) => {
    setGoogleAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accId) {
          const alreadyHas = acc.clientBookingIds.includes(bookingId);
          const updated = alreadyHas
            ? acc.clientBookingIds.filter(id => id !== bookingId)
            : [...acc.clientBookingIds, bookingId];
          return { ...acc, clientBookingIds: updated };
        }
        return acc;
      })
    );
  };

  // Search filter for progress table
  const filteredBookings = bookingsList.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(q) ||
      b.packageName.toLowerCase().includes(q) ||
      (b.locationAddress || "").toLowerCase().includes(q)
    );
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative z-10 text-white items-start w-full">
      {/* COLLAPSIBLE LEFT SIDEBAR */}
      <div 
        className={`bg-neutral-900/60 border border-white/10 rounded-[2rem] p-5 backdrop-blur-md flex flex-col justify-between transition-all duration-300 shrink-0 w-full lg:w-auto ${
          sidebarCollapsed ? "lg:w-[78px]" : "lg:w-[245px]"
        }`}
      >
        <div className="space-y-6">
          {/* Header Profile Identity */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#799351]/20 border border-[#a1c398] flex items-center justify-center text-[#a1c398] font-bold shrink-0">
              {role === "DEVELOPER" ? "DEV" : "OWN"}
            </div>
            {(!sidebarCollapsed || window.innerWidth < 1024) && (
              <div className="truncate">
                <h4 className="text-xs font-bold text-white block uppercase tracking-wide">
                  {role === "DEVELOPER" ? "Dev Superuser" : "Irfan & Irsalina"}
                </h4>
                <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase">
                  {role} Portal
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Tabs */}
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Executive Metrics", icon: BarChart3 },
              { id: "spreadsheet", label: "Clients Progress", icon: FileText },
              { id: "calendar", label: "Master Calendar", icon: CalendarIcon },
              { id: "crm", label: "AI WhatsApp CRM", icon: MessageSquare },
              { id: "receipts", label: "Receipt Invoices", icon: Clipboard },
              { id: "performance", label: "Crew Performance", icon: Award },
              { id: "inventory", label: "Central Inventory", icon: Package },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((menu) => {
              const isSelected = activeMenu === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveMenu(menu.id as any)}
                  title={sidebarCollapsed ? menu.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isSelected
                      ? "bg-[#799351] text-white shadow-lg shadow-[#799351]/20 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  } ${sidebarCollapsed ? "lg:justify-center" : ""}`}
                >
                  <menu.icon className="w-5 h-5 shrink-0" />
                  {(!sidebarCollapsed || window.innerWidth < 1024) && <span>{menu.label}</span>}
                </button>
              );
            })}

            {/* Developer Access Controller Option */}
            {role === "DEVELOPER" && (
              <button
                onClick={() => setActiveMenu("accounts")}
                title={sidebarCollapsed ? "GSSO Access Control" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeMenu === "accounts"
                    ? "bg-amber-950/60 border-amber-500/40 text-amber-400 shadow-lg"
                    : "text-amber-500/75 border-transparent hover:bg-amber-950/20 hover:text-amber-400"
                } ${sidebarCollapsed ? "lg:justify-center" : ""}`}
              >
                <Key className="w-5 h-5 shrink-0" />
                {(!sidebarCollapsed || window.innerWidth < 1024) && <span>GSSO Control</span>}
              </button>
            )}

            {role === "DEVELOPER" && (
              <button
                onClick={() => setActiveMenu("bankConfig" as any)}
                title={sidebarCollapsed ? "Bank Account Config" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeMenu === "bankConfig"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-lg"
                    : "text-emerald-500/75 border-transparent hover:bg-emerald-950/20 hover:text-emerald-400"
                } ${sidebarCollapsed ? "lg:justify-center" : ""}`}
              >
                <QrCode className="w-5 h-5 shrink-0 text-emerald-400" />
                {(!sidebarCollapsed || window.innerWidth < 1024) && <span>Bank Config</span>}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Trigger toggle button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex w-full mt-8 p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 text-gray-400 hover:text-white text-xs font-mono uppercase items-center gap-2 justify-center transition-all"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Hide Sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* RIGHT MAIN WORKSPACE CONTENT CONTAINER */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Workspace Quick Header Info */}
        <div className="flex items-center justify-between gap-4 bg-neutral-900/60 p-4 px-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
          <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
            {activeMenu === "dashboard" && "Executive Analytics Dashboard"}
            {activeMenu === "spreadsheet" && "Client Coordination Progress Spreadsheet"}
            {activeMenu === "calendar" && "Master Booking Scheduler Calendar"}
            {activeMenu === "crm" && "AI WhatsApp CRM Coordination Terminal"}
            {activeMenu === "receipts" && "Master Invoice & Receipt Coordination Hub"}
            {activeMenu === "accounts" && "GSSO Security Credentials & Access Control"}
            {activeMenu === "performance" && "Crew Leads & Performance directory Tracker"}
            {activeMenu === "inventory" && "Central Inventory & Asset Tracker"}
            {activeMenu === "notifications" && "System & Crew Broadcast Notifications Hub"}
          </h3>
          <div className="flex items-center gap-2 px-3.5 py-1 bg-[#799351]/10 rounded-full border border-[#799351]/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-[#a1c398] uppercase">
              {role} SESSION ACTIVE
            </span>
          </div>
        </div>

      {/* 2. CONDITIONAL TAB RENDERING */}
      
      {activeMenu === "dashboard" && (
        <div className="space-y-6">
          {/* Executive metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 relative group">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Realized Revenue</span>
              <h4 className="text-2xl font-light font-display mt-2 text-white">
                RM {totalSalesRevenue.toLocaleString()}
              </h4>
              <span className="text-[9px] text-[#a1c398] block mt-1.5">Approved Locked slots</span>
            </div>

            <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 relative group">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Pending Approval</span>
              <h4 className="text-2xl font-light font-display mt-2 text-white">
                RM {pendingSalesVolume.toLocaleString()}
              </h4>
              <span className="text-[9px] text-amber-500 block mt-1.5">{pendingBookings.length} deposits to check</span>
            </div>

            <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 relative group">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Master Bookings</span>
              <h4 className="text-2xl font-light font-display mt-2 text-white">
                {totalBookingsCount} Events
              </h4>
              <span className="text-[9px] text-gray-500 block mt-1.5">Total July 2026</span>
            </div>

            <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 relative group">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Average Order Value</span>
              <h4 className="text-2xl font-light font-display mt-2 text-white">
                RM {averageOrderValue}
              </h4>
              <span className="text-[9px] text-gray-500 block mt-1.5">Including custom add-ons</span>
            </div>
          </div>

          {/* Lower dual panels (Receipt verification, audit logs, inventory alert) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Receipt Verification Queue (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                    🏦 Receipt Checking Queue ({pendingBookings.length})
                  </h3>
                  <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    AWAITING OWNER SIGN-OFF
                  </span>
                </div>

                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {pendingBookings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs font-light">
                      All deposit receipts verified! Master calendar is fully locked.
                    </div>
                  ) : (
                    pendingBookings.map((b) => (
                      <div key={b.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-white">{b.clientName}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Date: {b.date} • {b.packageName}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#a1c398]">RM {b.totalPrice}</span>
                        </div>

                        {b.receiptUrl && (
                          <div className="p-2 bg-neutral-900 border border-white/10 rounded-lg flex items-center justify-between text-[10px]">
                            <span className="text-gray-400 truncate max-w-[150px]">📁 client_receipt_deposit.pdf</span>
                            <a
                              href={b.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a1c398] hover:underline"
                            >
                              Inspect Slip
                            </a>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(b.id)}
                            className="flex-1 py-1.5 bg-[#799351] hover:bg-[#5f743e] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                          >
                            Verify & Approve Lock
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Operational Line Chart (7 columns) */}
            <div className="lg:col-span-7 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1 border-b border-white/5 pb-3">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                    📈 Operational Growth Trends
                  </h3>
                  <span className="text-[9px] font-mono text-[#a1c398] bg-[#799351]/10 px-2.5 py-0.5 rounded border border-[#799351]/20 font-bold">
                    MONTHLY SALES & LOCKS
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-light mt-1 mb-6 font-sans leading-relaxed">
                  Real-time visualization of photo booth order quantity (left) vs total sales revenue in RM (right) from Q1/Q2 to active July bookings.
                </p>
              </div>

              <div className="h-[280px] w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { month: "Jan", orders: 12, sales: 8400 },
                      { month: "Feb", orders: 18, sales: 12200 },
                      { month: "Mar", orders: 15, sales: 10500 },
                      { month: "Apr", orders: 22, sales: 15800 },
                      { month: "May", orders: 28, sales: 19400 },
                      { month: "Jun", orders: 35, sales: 24800 },
                      { month: "Jul", orders: bookingsList.filter(b => b.status === "BOOKED").length + 5, sales: totalSalesRevenue + 3500 },
                    ]}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                    <YAxis yAxisId="left" stroke="#a1c398" fontSize={9} width={25} />
                    <YAxis yAxisId="right" orientation="right" stroke="#799351" fontSize={9} width={35} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px" }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      name="Total Orders"
                      stroke="#a1c398"
                      activeDot={{ r: 6 }}
                      strokeWidth={2.5}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sales"
                      name="Sales (RM)"
                      stroke="#799351"
                      strokeWidth={2.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SPREADSHEET PROGRESS TABLE VIEW */}
      {activeMenu === "spreadsheet" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                📋 Client Progress spreadsheet
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-light">
                Monitor live photobooth coordination progress, assigned crew, venue logistic details, and invoice price approvals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter client or package..."
                  className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-[#799351] outline-none w-[200px]"
                />
              </div>

              <button
                onClick={handleExportSpreadsheetToExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>

          {/* Feedback message banner */}
          {pushSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{pushSuccessMsg}</span>
              </div>
              <button onClick={() => setPushSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold text-sm px-1">×</button>
            </div>
          )}

          {/* TABLE 1: ACTIVE / PENDING COORDINATION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Pending & Active Event Bookings ({filteredBookings.filter(b => b.status !== "BOOKED").length})</span>
            </h4>
            
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-black/50 border-b border-white/10 text-gray-400 font-mono">
                    <th className="p-2.5">Client Name</th>
                    <th className="p-2.5">Package Order</th>
                    <th className="p-2.5">Location Venue</th>
                    <th className="p-2.5">Person In-charge 1</th>
                    <th className="p-2.5">Person In-charge 2</th>
                    <th className="p-2.5 text-center">Duration</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.filter(b => b.status !== "BOOKED").length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500 font-light">
                        No pending coordinates at this time. All active items approved below.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.filter(b => b.status !== "BOOKED").map((b) => {
                      const hours = PACKAGES.find((p) => p.name.toLowerCase() === b.packageName.toLowerCase())?.durationHrs || 3;
                      return (
                        <tr key={b.id} className="hover:bg-white/5 transition-all">
                          <td className="p-2.5 font-semibold text-white">{b.clientName}</td>
                          <td className="p-2.5 text-gray-300 font-normal">{b.packageName}</td>
                          <td className="p-2.5 text-gray-400 max-w-[150px] truncate" title={b.locationAddress}>
                            {b.locationAddress || "Selangor Area"}
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <select
                                value={b.crewLeadId || ""}
                                onChange={(e) => onAssignCrew(b.id, e.target.value, false)}
                                className="bg-black text-gray-300 border border-white/10 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-[#799351]"
                              >
                                <option value="">Choose Crew</option>
                                {crewLeads.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              {b.crewLeadId && (
                                <button
                                  onClick={() => handlePushNotificationToCrew(b.id, b.crewLeadId!, false)}
                                  title="Send push alert to crew 1"
                                  className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-mono font-bold"
                                >
                                  Push
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <select
                                value={b.crewLeadId2 || ""}
                                onChange={(e) => onAssignCrew(b.id, e.target.value, true)}
                                className="bg-black text-gray-300 border border-white/10 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-[#799351]"
                              >
                                <option value="">Choose Crew</option>
                                {crewLeads.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              {b.crewLeadId2 && (
                                <button
                                  onClick={() => handlePushNotificationToCrew(b.id, b.crewLeadId2!, true)}
                                  title="Send push alert to crew 2"
                                  className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-mono font-bold"
                                >
                                  Push
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-mono text-gray-400">{hours} Hrs</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#a1c398]">RM {b.totalPrice}</td>
                          <td className="p-2.5">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleApprove(b.id)}
                                className="flex items-center gap-1 text-[9px] bg-amber-950/50 hover:bg-amber-950 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono transition-colors"
                              >
                                <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                                <span>Verify Deposit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: APPROVED / CONFIRMED BOOKINGS */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Approved & Confirmed Bookings ({filteredBookings.filter(b => b.status === "BOOKED").length})</span>
            </h4>
            
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-black/50 border-b border-white/10 text-gray-400 font-mono">
                    <th className="p-2.5">Client Name</th>
                    <th className="p-2.5">Package Order</th>
                    <th className="p-2.5">Location Venue</th>
                    <th className="p-2.5">Person In-charge 1</th>
                    <th className="p-2.5">Person In-charge 2</th>
                    <th className="p-2.5 text-center">Duration</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-center font-mono">Status</th>
                    <th className="p-2.5 text-center font-mono">2nd Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.filter(b => b.status === "BOOKED").length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-gray-500 font-light">
                        No approved bookings yet. Verify client deposit slips above.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.filter(b => b.status === "BOOKED").map((b) => {
                      const hours = PACKAGES.find((p) => p.name.toLowerCase() === b.packageName.toLowerCase())?.durationHrs || 3;
                      return (
                        <tr key={b.id} className="hover:bg-white/5 transition-all opacity-90">
                          <td className="p-2.5 font-semibold text-white">{b.clientName}</td>
                          <td className="p-2.5 text-gray-300 font-normal">{b.packageName}</td>
                          <td className="p-2.5 text-gray-400 max-w-[150px] truncate" title={b.locationAddress}>
                            {b.locationAddress || "Selangor Area"}
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <select
                                value={b.crewLeadId || ""}
                                onChange={(e) => onAssignCrew(b.id, e.target.value, false)}
                                className="bg-black text-gray-300 border border-white/10 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-[#799351]"
                              >
                                <option value="">Choose Crew</option>
                                {crewLeads.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              {b.crewLeadId && (
                                <button
                                  onClick={() => handlePushNotificationToCrew(b.id, b.crewLeadId!, false)}
                                  title="Send push alert to crew 1"
                                  className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-mono font-bold"
                                >
                                  Push
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <select
                                value={b.crewLeadId2 || ""}
                                onChange={(e) => onAssignCrew(b.id, e.target.value, true)}
                                className="bg-black text-gray-300 border border-white/10 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-[#799351]"
                              >
                                <option value="">Choose Crew</option>
                                {crewLeads.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              {b.crewLeadId2 && (
                                <button
                                  onClick={() => handlePushNotificationToCrew(b.id, b.crewLeadId2!, true)}
                                  title="Send push alert to crew 2"
                                  className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-mono font-bold"
                                >
                                  Push
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-mono text-gray-400">{hours} Hrs</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#a1c398]">RM {b.totalPrice}</td>
                          <td className="p-2.5 text-center">
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Approved</span>
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-col items-center gap-1">
                              {b.paymentType !== "Booking Fees" ? (
                                <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 rounded font-mono text-[9px] font-bold uppercase">
                                  Full Prepaid
                                </span>
                              ) : b.secondPaymentApproved ? (
                                <span className="px-2 py-0.5 bg-emerald-950/60 text-[#a1c398] border border-emerald-500/20 rounded font-mono text-[9px] font-bold uppercase">
                                  ✓ Paid & Verified
                                </span>
                              ) : b.secondReceiptUrl ? (
                                <div className="flex flex-col items-center gap-1 bg-amber-950/20 p-1 border border-amber-500/20 rounded">
                                  <span className="text-[8px] text-amber-400 font-mono font-bold uppercase animate-pulse">Awaiting Review</span>
                                  <div className="flex gap-1 justify-center">
                                    <a
                                      href={b.secondReceiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-1.5 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[8px] font-mono rounded border border-white/5"
                                    >
                                      Slip ↗
                                    </a>
                                    <button
                                      onClick={() => {
                                        if (onUpdateBookings) {
                                          onUpdateBookings((prev) =>
                                            prev.map((item) =>
                                              item.id === b.id
                                                ? { ...item, secondPaymentApproved: true, secondPaymentRejected: false }
                                                : item
                                            )
                                          );
                                          onAddAuditLog(
                                            role === "DEVELOPER" ? "Developer Admin" : "Irfan (Owner)",
                                            `Approved the 2nd & final payment receipt for ${b.clientName}'s event on ${b.date}.`,
                                            "info"
                                          );
                                          
                                          // Also send a system-wide notification to crew leads & client
                                          if (onUpdateNotifications) {
                                            const newNotif = {
                                              id: "n_approved_" + Date.now(),
                                              title: `2nd Payment Approved for ${b.clientName}`,
                                              message: `Final balance of RM ${(b.totalPrice - 150).toFixed(2)} has been successfully verified. Event status is fully finalized.`,
                                              timestamp: new Date().toLocaleTimeString(),
                                              type: "booking" as const,
                                              severity: "info" as const,
                                              isRead: false
                                            };
                                            onUpdateNotifications(prev => [newNotif, ...prev]);
                                          }
                                          alert(`🏦 Approved 2nd & final payment for ${b.clientName}!`);
                                        }
                                      }}
                                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-neutral-950 text-[8px] font-mono rounded font-bold"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt("Enter 2nd payment rejection reason:") || "Receipt scan is illegible.";
                                        if (reason && onUpdateBookings) {
                                          onUpdateBookings((prev) =>
                                            prev.map((item) =>
                                              item.id === b.id
                                                ? {
                                                    ...item,
                                                    secondPaymentRejected: true,
                                                    secondPaymentRejectionReason: reason,
                                                    secondReceiptUrl: undefined,
                                                  }
                                                : item
                                            )
                                          );
                                          onAddAuditLog(
                                            role === "DEVELOPER" ? "Developer Admin" : "Irfan (Owner)",
                                            `Rejected the 2nd payment receipt for ${b.clientName}'s event. Reason: ${reason}`,
                                            "warning"
                                          );
                                          
                                          if (onUpdateNotifications) {
                                            const newNotif = {
                                              id: "n_rejected_" + Date.now(),
                                              title: `2nd Payment REJECTED for ${b.clientName}`,
                                              message: `Rejection reason: ${reason}. Requested re-upload of transaction proof.`,
                                              timestamp: new Date().toLocaleTimeString(),
                                              type: "booking" as const,
                                              severity: "warning" as const,
                                              isRead: false
                                            };
                                            onUpdateNotifications(prev => [newNotif, ...prev]);
                                          }
                                          alert(`❌ Rejected 2nd payment receipt for ${b.clientName}.`);
                                        }
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[8px] font-mono rounded font-bold"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ) : b.secondPaymentRejected ? (
                                <span className="px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-500/10 rounded font-mono text-[9px] font-bold uppercase">
                                  Rejected (Re-upload pending)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-neutral-900 text-gray-500 border border-white/5 rounded font-mono text-[9px] font-bold uppercase">
                                  Unpaid (Balance Due)
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EVENT master CALENDAR VIEW */}
      {activeMenu === "calendar" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                📆 Master Booking Scheduler
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Visualizing busy photobooth setup days across regional event spaces.
              </p>
            </div>

            {/* Region Filtering Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono font-bold uppercase shrink-0">Filter Area:</span>
              <select
                value={calendarRegion}
                onChange={(e) => setCalendarRegion(e.target.value)}
                className="text-xs p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-white outline-none focus:border-[#799351] min-w-[190px]"
              >
                <option value="ALL">All Regions (Master Calendar)</option>
                <option value="selangor">Selangor Area</option>
                <option value="johor">Johor Area</option>
                <option value="melaka">Melaka Area</option>
                <option value="negeri sembilan">Negeri Sembilan Area</option>
                <option value="pahang">Pahang Area</option>
                <option value="OPEN_CALENDAR">Open Calendar (Other Regions)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Day name labels */}
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div key={day} className="text-center text-xs font-mono font-bold text-gray-500 py-1.5 border-b border-white/5">
                {day}
              </div>
            ))}

            {/* Offset slots */}
            <div className="bg-transparent" />
            <div className="bg-transparent" />

            {/* Days list */}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const dateStr = `2026-07-${day < 10 ? "0" + day : day}`;
              let bookedEvents = bookingsList.filter((b) => b.date === dateStr);
              
              if (calendarRegion !== "ALL") {
                if (calendarRegion === "OPEN_CALENDAR") {
                  const states = ["selangor", "johor", "melaka", "negeri sembilan", "pahang", "negeri_sembilan"];
                  bookedEvents = bookedEvents.filter(b => !states.includes(b.state.toLowerCase()));
                } else {
                  bookedEvents = bookedEvents.filter(b => b.state.toLowerCase() === calendarRegion.toLowerCase() || (calendarRegion === "negeri sembilan" && b.state.toLowerCase() === "negeri_sembilan"));
                }
              }

              const isLocked = bookedEvents.some(b => b.status === "BOOKED");

              return (
                <div
                  key={day}
                  className={`min-h-[75px] p-2 border rounded-xl flex flex-col justify-between text-left transition-all ${
                    isLocked
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-sm"
                      : bookedEvents.length > 0
                      ? "bg-amber-950/25 border-amber-500/30 text-amber-400"
                      : "bg-neutral-950/40 border-white/5 hover:border-[#799351]/30 text-gray-500"
                  }`}
                >
                  <span className="text-xs font-bold font-mono">{day}</span>
                  {bookedEvents.map((evt) => (
                    <span key={evt.id} className="text-[7px] font-bold tracking-tight truncate block uppercase bg-black/30 px-1 py-0.5 rounded text-white mt-1">
                      {evt.clientName.split(" ")[0]} ({evt.packageName.split(" ")[0]})
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          {/* AREA BOOKINGS & SALES ANALYTICS SECTION */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                📊 Regional Sales & Booking Performance
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Breakdown of total reserved events and cumulative booking values for each region.
              </p>
            </div>

            <div className="h-64 bg-black/20 border border-white/5 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  const statesList = [
                    { id: "selangor", name: "Selangor" },
                    { id: "johor", name: "Johor" },
                    { id: "melaka", name: "Melaka" },
                    { id: "negeri_sembilan", name: "N. Sembilan" },
                    { id: "pahang", name: "Pahang" },
                    { id: "other", name: "Open Calendar" }
                  ];

                  const standardStates = ["selangor", "johor", "melaka", "negeri sembilan", "pahang", "negeri_sembilan"];

                  return statesList.map(st => {
                    let areaBookings = [];
                    if (st.id === "other") {
                      areaBookings = bookingsList.filter(b => !standardStates.includes(b.state.toLowerCase()));
                    } else if (st.id === "negeri_sembilan") {
                      areaBookings = bookingsList.filter(b => b.state.toLowerCase() === "negeri sembilan" || b.state.toLowerCase() === "negeri_sembilan");
                    } else {
                      areaBookings = bookingsList.filter(b => b.state.toLowerCase() === st.id);
                    }

                    const count = areaBookings.length;
                    const sales = areaBookings
                      .filter(b => b.status === "BOOKED" || b.status === "PREBOOKED")
                      .reduce((sum, b) => sum + b.totalPrice, 0);

                    return {
                      name: st.name,
                      "Total Bookings": count,
                      "Sales Value (RM)": sales
                    };
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#a1c398" fontSize={10} tickLine={false} label={{ value: "Bookings Count", angle: -90, position: "insideLeft", fill: "#a1c398", style: { fontSize: "10px" } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#799351" fontSize={10} tickLine={false} label={{ value: "Sales Value (RM)", angle: 90, position: "insideRight", fill: "#799351", style: { fontSize: "10px" } }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0b0b0b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "10px" }} />
                  <Bar yAxisId="left" dataKey="Total Bookings" fill="#a1c398" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Sales Value (RM)" fill="#799351" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CRM TERMINAL */}
      {activeMenu === "crm" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[520px] backdrop-blur-md">
          <div className="bg-[#799351]/10 p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#a1c398]" />
              <div>
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                  WhatsApp CRM Coordination Hub
                </h3>
                <span className="text-[10px] text-gray-400 block font-mono">Founders Terminal Line</span>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold bg-[#799351]/10 px-2 py-0.5 rounded text-[#a1c398] border border-[#799351]/20">
              BRIDGE STATUS: SYNCED
            </span>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Left Clients list */}
            <div className="w-[30%] border-r border-white/5 overflow-y-auto bg-black/20">
              {uniqueClients.map((client) => {
                const isActive = client.id === activeChatClientId;
                return (
                  <button
                    key={client.id}
                    onClick={() => setActiveChatClientId(client.id)}
                    className={`w-full p-3.5 text-left border-b border-white/5 transition-all flex flex-col gap-1 ${
                      isActive ? "bg-[#799351]/15 text-[#a1c398]" : "hover:bg-neutral-900/30"
                    }`}
                  >
                    <span className="text-xs font-bold truncate block text-white">{client.clientName}</span>
                    <span className="text-[10px] text-gray-400 truncate block font-light">{client.lastMessage}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Chat panel */}
            <div className="w-[70%] flex flex-col justify-between bg-black/40">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeChats.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                    Select a client chat sequence.
                  </div>
                ) : (
                  activeChats.map((m) => {
                    const isClient = m.sender === "CLIENT";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[85%] ${isClient ? "mr-auto items-start" : "ml-auto items-end"}`}
                      >
                        <span className="text-[8px] font-mono text-gray-500 mb-0.5">
                          {isClient ? m.clientName : "IRFAN (CO-FOUNDER)"}
                        </span>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isClient
                              ? "bg-neutral-800 text-white rounded-tl-none"
                              : "bg-[#799351] text-white rounded-tr-none"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat action box with Gemini AI reply suggestion */}
              <div className="p-4 border-t border-white/5 bg-black/20 space-y-3">
                {currentClientBooking && (
                  <div className="flex items-center justify-between p-2 bg-[#799351]/10 border border-[#799351]/25 rounded-xl">
                    <span className="text-[10px] font-semibold text-[#a1c398] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini AI reply suggestions active</span>
                    </span>

                    <button
                      onClick={triggerAiResponseGenerator}
                      disabled={isAiLoading}
                      className="px-3 py-1 bg-[#799351] hover:bg-[#5f743e] text-white text-[9px] font-bold font-mono rounded-lg transition-all"
                    >
                      {isAiLoading ? "Processing..." : "Suggest Reply"}
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessageSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder="Type coordinating reply here..."
                    className="flex-1 text-xs p-3 bg-neutral-950 border border-white/10 rounded-xl outline-none focus:border-[#799351] text-white"
                  />
                  <button type="submit" className="p-3 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl shadow-md">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER ACCESS CONTROLS TABS */}
      {activeMenu === "accounts" && role === "DEVELOPER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create new GSSO accounts (5 columns) */}
          <div className="lg:col-span-5 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4">
              🔑 Register verified GSSO Account
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Account Full Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. Siti Aminah"
                  className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Google Easy-Access Email</label>
                <input
                  type="email"
                  required
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  placeholder="e.g. sitiaminah@gmail.com"
                  className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Access Role</label>
                  <select
                    value={newAccRole}
                    onChange={(e) => setNewAccRole(e.target.value as Role)}
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="CLIENT">CLIENT</option>
                    <option value="CREW">CREW / FIELD STAFF</option>
                    <option value="OWNER">CO-FOUNDER / OWNER</option>
                    <option value="DEVELOPER">DEVELOPER SUPERUSER</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Client Access Slot</label>
                  <select
                    value={selectedAccessBooking}
                    onChange={(e) => setSelectedAccessBooking(e.target.value)}
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value="">No specific booking</option>
                    {bookingsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.clientName} ({b.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-950 hover:bg-amber-900 border border-amber-500 text-amber-400 font-semibold rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                Register Google Session Token
              </button>
            </form>
          </div>

          {/* Accounts list (7 columns) */}
          <div className="lg:col-span-7 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4">
              🛡️ verified GSSO Active Credentials ({googleAccounts.length})
            </h3>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {googleAccounts.map((acc) => (
                <div key={acc.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-white block">{acc.name}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">{acc.email}</span>
                    </div>

                    <span className="text-[8px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase">
                      verified Google token
                    </span>
                  </div>

                  {/* Role modification & access control */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-[10px]">Permission Role:</span>
                      <select
                        value={acc.role}
                        onChange={(e) => handleUpdateAccountRole(acc.id, e.target.value as Role)}
                        className="bg-neutral-950 text-white border border-white/10 rounded px-2 py-0.5 text-[11px] outline-none"
                      >
                        <option value="CLIENT">CLIENT</option>
                        <option value="CREW">CREW</option>
                        <option value="OWNER">OWNER</option>
                        <option value="DEVELOPER">DEVELOPER</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/10 text-[10px] text-amber-400 font-mono">
                      <span>Accessible Bookings:</span>
                      <strong>{acc.clientBookingIds.length > 0 ? acc.clientBookingIds.join(", ") : "All"}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developer Setting section: Calendar Sync & Testimonials customizer */}
          <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 pt-8 border-t border-white/5">
            {/* Calendar Synchronization Toggle (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
                <span>🗓️ Master Calendar Synchronization</span>
              </h3>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed">
                If <strong>Enabled</strong>, bookings in any region block that date nationwide. If <strong>Disabled</strong>, each region has its own independent availability.
              </p>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Nationwide Sync Status</span>
                  <span className="text-[10px] font-mono text-[#a1c398] font-bold uppercase">
                    {isCalendarSynced ? "🟢 Fully Synchronized" : "🟡 Region-Dependent"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onToggleCalendarSync}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                    isCalendarSynced
                      ? "bg-[#799351]/20 border-[#799351] text-[#a1c398] hover:bg-[#799351]/30"
                      : "bg-neutral-900 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {isCalendarSynced ? "Disable Sync" : "Enable Sync"}
                </button>
              </div>
            </div>

            {/* Testimonials Manager (7 cols) */}
            <div className="lg:col-span-7 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                  ✍️ Memories Testimonials builder ({testimonialsList.length})
                </h3>
                {editingTestimonialId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTestimonialId(null);
                      setTestiLogo("");
                      setTestiQuote("");
                      setTestiAuthor("");
                      setTestiImageUrl("");
                    }}
                    className="text-[10px] font-mono font-bold text-amber-500 underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Form to Create/Edit */}
              <form onSubmit={handleSaveTestimonial} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Client/Agency Logo Text</label>
                  <input
                    type="text"
                    required
                    value={testiLogo}
                    onChange={(e) => setTestiLogo(e.target.value)}
                    placeholder="e.g. LOGOIPSUM"
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Author & Role</label>
                  <input
                    type="text"
                    required
                    value={testiAuthor}
                    onChange={(e) => setTestiAuthor(e.target.value)}
                    placeholder="e.g. - Siti & Amri, Selangor"
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Testimonial Quote</label>
                  <textarea
                    required
                    rows={2}
                    value={testiQuote}
                    onChange={(e) => setTestiQuote(e.target.value)}
                    placeholder="Provide pristine agency words..."
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] resize-none"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Portrait / Memory Photo URL</label>
                  <input
                    type="url"
                    required
                    value={testiImageUrl}
                    onChange={(e) => setTestiImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                  />
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white font-semibold rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  {editingTestimonialId ? "Update Testimonial Card" : "Publish Testimonial Memory"}
                </button>
              </form>

              {/* Active testimonial list */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {testimonialsList.map((t) => (
                  <div key={t.id} className="p-3.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.imageUrl}
                        alt="souvenir"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{t.logo}</span>
                        <span className="text-[10px] text-gray-400 font-mono block truncate">{t.author}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditTestimonialClick(t)}
                        className="text-[10px] font-mono bg-neutral-800 text-gray-300 hover:bg-neutral-700 px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="text-[10px] font-mono bg-red-950/40 text-red-400 hover:bg-red-900/40 px-2 py-1 rounded border border-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CREW PERFORMANCE TRACKING VIEW */}
      {activeMenu === "performance" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                🏅 Crew Performance Directory Tracker
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Monitor field coordinators’ ratings, job completion history, and quick-pay bank details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crewLeads.map((crew) => {
              // Calculate real assigned / past counts from the live bookings list
              const assigned = bookingsList.filter(b => b.crewLeadId === crew.id);
              const pastJobs = assigned.filter(b => {
                const isPast = b.id.includes("past") || b.date < "2026-07-06";
                return isPast && b.status === "BOOKED";
              });
              const pendingJobs = assigned.filter(b => {
                const isPast = b.id.includes("past") || b.date < "2026-07-06";
                return !isPast && (b.status === "BOOKED" || b.status === "PREBOOKED");
              });

              // Pull user reviews for this crew lead from the bookings database
              const crewReviews = bookingsList.filter(b => b.crewLeadId === crew.id && b.reviewRating);

              return (
                <div key={crew.id} className="p-6 bg-black/30 border border-white/5 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#799351]/20 border border-[#799351]/30 flex items-center justify-center font-bold font-display text-[#a1c398] text-lg">
                        {crew.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{crew.name}</h4>
                        <p className="text-xs text-gray-400 font-mono">{crew.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#799351]/10 text-[#a1c398] font-mono px-2.5 py-1 rounded border border-[#799351]/20 font-bold uppercase">
                      ID: {crew.id}
                    </span>
                  </div>

                  {/* Performance stats layout */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-900/50 p-3 rounded-xl text-center border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Job Rating</span>
                      <span className="text-sm font-bold text-white block mt-1">⭐️ {crew.rating || 4.8}</span>
                    </div>
                    <div className="bg-neutral-900/50 p-3 rounded-xl text-center border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Completed</span>
                      <span className="text-sm font-bold text-[#a1c398] block mt-1">{(crew.completedJobsCount || 0) + pastJobs.length} Jobs</span>
                    </div>
                    <div className="bg-neutral-900/50 p-3 rounded-xl text-center border border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase block font-mono">Promptness</span>
                      <span className="text-sm font-bold text-amber-400 block mt-1">{crew.promptnessRating || 95}%</span>
                    </div>
                  </div>

                  {/* Bank payout coordinates */}
                  <div className="p-4 bg-neutral-950/40 border border-white/5 rounded-xl space-y-2">
                    <span className="text-[10px] text-[#a1c398] font-bold font-mono uppercase block">🏦 Bank Coordinates (Direct Payout)</span>
                    {crew.bankName ? (
                      <div className="text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bank Name:</span>
                          <span className="text-gray-200 font-bold">{crew.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account No:</span>
                          <span className="text-gray-200 font-bold font-mono bg-black px-1.5 py-0.5 rounded">{crew.bankAccountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account Name:</span>
                          <span className="text-gray-200 font-mono text-[10px] truncate">{crew.bankAccountHolder}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-light italic">No coordinates entered by this coordinator yet.</span>
                    )}
                  </div>

                  {/* Customer Review logs */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">💬 Real Customer Reviews</span>
                    {crewReviews.length === 0 ? (
                      <span className="text-[10px] text-gray-500 font-light italic block">No reviews logged yet in active session.</span>
                    ) : (
                      <div className="space-y-2 max-h-[120px] overflow-y-auto">
                        {crewReviews.map(r => (
                          <div key={r.id} className="p-2.5 bg-black/20 border border-white/5 rounded-lg text-xs">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-[#a1c398] font-bold">{r.clientName}</span>
                              <span className="text-amber-500 font-mono">{"⭐️".repeat(r.reviewRating || 5)}</span>
                            </div>
                            <p className="text-gray-400 font-light leading-relaxed text-[11px] italic">"{r.reviewText}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MASTER INVOICES & RECEIPTS HUB FOR OWNER & DEVELOPER */}
      {activeMenu === "receipts" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                📂 Master Invoice & Receipt Hub
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Search and select any active client event to render, print, or download their itemized tax invoice.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Side: Booking selector list */}
            <div className="md:col-span-4 space-y-3 bg-black/30 p-4 border border-white/5 rounded-2xl max-h-[600px] overflow-y-auto">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold mb-2">
                Client Booking Ledger ({bookingsList.length} total)
              </span>
              
              {bookingsList.length === 0 ? (
                <div className="text-xs text-gray-500 italic p-4 text-center">No bookings registered in the master database.</div>
              ) : (
                bookingsList.map((b) => {
                  const isSelected = selectedReceiptBookingId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedReceiptBookingId(b.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-[#799351]/15 border-[#799351] text-[#a1c398]"
                          : "bg-neutral-950/40 border-white/5 text-gray-400 hover:border-[#799351]/20 hover:text-white"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-white">
                        <span className="truncate max-w-[120px]">{b.clientName}</span>
                        <span className="font-mono text-[10px] text-[#a1c398] shrink-0">RM {b.totalPrice}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono">
                        <span>ID: {b.id.toUpperCase().substring(0, 8)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          b.status === "BOOKED" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/10" : "bg-amber-950/40 text-amber-400 border border-amber-500/10"
                        }`}>
                          {b.status === "BOOKED" ? "PAID" : "PENDING"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Side: PrintableReceipt container */}
            <div className="md:col-span-8">
              {selectedReceiptBooking ? (
                <PrintableReceipt booking={selectedReceiptBooking} />
              ) : (
                <div className="p-12 bg-black/20 border border-white/5 rounded-[2rem] text-center space-y-4">
                  <Clipboard className="w-12 h-12 text-[#a1c398]/40 mx-auto animate-pulse" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Invoice Selected</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Click any client booking on the ledger left panel to generate their printable financial tax receipt.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeMenu === "inventory" && (
        <InventoryManager
          locations={locations}
          inventory={inventory}
          inventoryRequests={inventoryRequests}
          onUpdateInventory={onUpdateInventory}
          onUpdateLocations={onUpdateLocations}
          onUpdateRequests={onUpdateRequests}
          onAddAuditLog={onAddAuditLog}
          role={role}
          userName={role === "DEVELOPER" ? "Developer Admin" : "Irfan (Owner)"}
        />
      )}

      {activeMenu === "notifications" && (
        <NotificationManager
          notifications={notifications}
          onUpdateNotifications={onUpdateNotifications}
          role={role}
          userEmail={role === "DEVELOPER" ? "dev@framez.my" : "irfan@framez.my"}
          onAddAuditLog={onAddAuditLog}
        />
      )}

      {activeMenu === "bankConfig" && role === "DEVELOPER" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span>Bank Settings & DuitNow QR Configuration</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Developer Superuser console: Update the bank account credentials and upload payment QR photos displayed during client checkout.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            localStorage.setItem("framez_bank_name", bankNameEdit);
            localStorage.setItem("framez_bank_acc_name", bankAccNameEdit);
            localStorage.setItem("framez_bank_acc_no", bankAccNoEdit);
            localStorage.setItem("framez_bank_qr_url", bankQrUrlEdit);
            onAddAuditLog("Developer Admin", `Updated corporate checkout bank account to ${bankAccNoEdit} and customized the DuitNow QR image.`, "alert");
            alert("🏦 Core Bank credentials & QR configurations updated successfully across all client booking portals!");
          }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Bank Institution Name</label>
              <input
                type="text"
                required
                value={bankNameEdit}
                onChange={(e) => setBankNameEdit(e.target.value)}
                placeholder="e.g. Maybank (Malayan Banking Berhad)"
                className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Corporate Account Name</label>
              <input
                type="text"
                required
                value={bankAccNameEdit}
                onChange={(e) => setBankAccNameEdit(e.target.value)}
                placeholder="e.g. Framez Photobooth Enterprise"
                className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Corporate Account Number</label>
              <input
                type="text"
                required
                value={bankAccNoEdit}
                onChange={(e) => setBankAccNoEdit(e.target.value)}
                placeholder="e.g. 5140-1234-5678"
                className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono text-gray-400 uppercase">DuitNow QR Image URL / Photo Source</label>
              <input
                type="url"
                value={bankQrUrlEdit}
                onChange={(e) => setBankQrUrlEdit(e.target.value)}
                placeholder="Paste an image URL, e.g. https://images.unsplash.com/photo-qr..."
                className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 bg-white p-1 rounded-xl flex items-center justify-center shrink-0">
                {bankQrUrlEdit ? (
                  <img src={bankQrUrlEdit} alt="DuitNow Custom QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full border-2 border-black flex flex-col justify-between p-1">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-black" />
                      <div className="w-3 h-3 bg-black" />
                    </div>
                    <div className="w-4 h-4 border border-dashed border-black mx-auto" />
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-black" />
                      <div className="w-3 h-2 bg-black self-end" />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center sm:text-left text-white">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Live QR Preview</span>
                <p className="text-xs text-gray-300 font-light">
                  If left empty, client checkouts will automatically fall back to the clean simulated DuitNow QR box. Setting a custom URL will instantly display your uploaded QR photo.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="md:col-span-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md font-sans"
            >
              Save Bank Configuration Coordinates
            </button>
          </form>
        </div>
      )}

      </div>
    </div>
  );
}
