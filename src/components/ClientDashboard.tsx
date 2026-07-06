import React, { useState, useRef, useEffect } from "react";
import { PACKAGES, ADDONS, STATES_MAP } from "../data";
import { Package, AddOn, Booking, ChatMessage, Role } from "../types";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  MapPin,
  Download,
  CheckCircle,
  Upload,
  Star,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Calculator,
  FileText,
  Send,
  User,
  Heart,
  Lock,
  Unlock,
  AlertCircle,
  PlusCircle,
  FolderLock,
  Check
} from "lucide-react";

interface ClientDashboardProps {
  userEmail: string;
  onNewBooking: (booking: Booking) => void;
  bookingsList: Booking[];
  role: Role;
  onAddAuditLog?: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
}

export default function ClientDashboard({
  userEmail,
  onNewBooking,
  bookingsList,
  role = "CLIENT",
  onAddAuditLog
}: ClientDashboardProps) {
  // Filter bookings belonging to this client email (case insensitive)
  const clientBookings = bookingsList.filter(
    (b) => b.clientEmail.toLowerCase() === userEmail.toLowerCase()
  );

  // Switch between existing bookings, or switch to "NEW" mode
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(() => {
    return clientBookings.length > 0 ? clientBookings[0].id : null;
  });
  
  const [isCreatingNewBooking, setIsCreatingNewBooking] = useState(clientBookings.length === 0);

  // Sidebar Tab selection inside the active booking detail
  const [activeTab, setActiveTab] = useState<"calendar" | "choose_plan" | "calculator" | "address" | "unlock" | "chat">("calendar");

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Booking details configuration state (FOR NEW RESERVATIONS)
  const [selectedPkg, setSelectedPkg] = useState<Package>(PACKAGES[1]); // Platinum default
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: number }>({
    "extra_hours": 0,
    "custom_guestbook": 1,
  });
  const [selectedState, setSelectedState] = useState<string>("selangor");
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-25");
  const [eventAddress, setEventAddress] = useState<string>("Grand Hall, Lot 101, Jalan Damansara, Kuala Lumpur");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  // Booking Form Modal State (when confirming/launching booking)
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [formClientName, setFormClientName] = useState(() => {
    return userEmail.split("@")[0].toUpperCase() || "CLIENT";
  });
  const [formClientPhone, setFormClientPhone] = useState("+6012-9998888");

  // Upload receipts state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat/Messages state (simulated per booking room or global)
  const [localChats, setLocalChats] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "m_init_1",
        clientId: "client_room",
        clientName: "Support",
        sender: "OWNER",
        text: "Hi there! Welcome back to Framez portal. How can Irfan and Irsalina help you coordinate your upcoming event?",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  });
  const [chatInput, setChatInput] = useState("");

  // Reviews
  const [clientRating, setClientRating] = useState<number>(5);
  const [clientTestimonial, setClientTestimonial] = useState("");
  const [submittedReview, setSubmittedReview] = useState(false);

  // Sync selected booking to local display states when client toggles between booking portfolio items
  const activeBooking = isCreatingNewBooking 
    ? null 
    : bookingsList.find((b) => b.id === selectedBookingId) || clientBookings[0] || null;

  // Compute live price estimate for new bookings
  const basePrice = selectedPkg.price;
  const addonCost = ADDONS.reduce((total, add) => {
    const qty = selectedAddons[add.id] || 0;
    return total + (add.price * qty);
  }, 0);
  const totalPriceForNew = basePrice + addonCost;

  // Handlers for drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFileName(e.dataTransfer.files[0].name);
      setUploadSuccess(true);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
      setUploadSuccess(true);
    }
  };

  const handleAddonChange = (addonId: string, value: number) => {
    if (!isCreatingNewBooking) return; // Prevent edits if viewing locked booking
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: value
    }));
  };

  // Create & Register a new booking slot
  const handleFinalizeBooking = () => {
    const addonsSummary: string[] = [];
    ADDONS.forEach((ad) => {
      const qty = selectedAddons[ad.id] || 0;
      if (qty > 0) {
        addonsSummary.push(`${ad.name} x${qty}`);
      }
    });

    const newBookingId = "b_client_" + Math.random().toString(36).substr(2, 9);
    const newBooking: Booking = {
      id: newBookingId,
      date: selectedDate,
      state: STATES_MAP.find((s) => s.id === selectedState)?.name || "Selangor",
      packageName: selectedPkg.name,
      clientName: formClientName,
      clientEmail: userEmail,
      clientPhone: formClientPhone,
      totalPrice: totalPriceForNew,
      addOns: addonsSummary,
      status: "PREBOOKED",
      locationAddress: eventAddress,
      receiptUrl: uploadedFileName ? `https://framez.my/uploads/${uploadedFileName}` : undefined,
      receiptApproved: false
    };

    onNewBooking(newBooking);
    if (onAddAuditLog) {
      onAddAuditLog(
        "Client Workspace",
        `Created additional reservation ${newBookingId} for date ${selectedDate} (${newBooking.packageName}).`,
        "info"
      );
    }

    // Set as active selection
    setSelectedBookingId(newBookingId);
    setIsCreatingNewBooking(false);
    setBookingFormOpen(false);
    alert(`✨ Your reservation request for ${selectedDate} is successfully submitted! Irfan & Irsalina will check your deposit slip and approve.`);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      clientId: activeBooking?.id || "general",
      clientName: "Siti / Client",
      sender: "CLIENT",
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    setLocalChats((prev) => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const founderMsg: ChatMessage = {
        id: "msg_f_" + Math.random().toString(36).substr(2, 9),
        clientId: activeBooking?.id || "general",
        clientName: "Irfan (Co-Founder)",
        sender: "OWNER",
        text: `Hey, I received your message about reservation reference ${activeBooking?.id || "general"}. We have locked this slot in our system. Let me know if you need anything else!`,
        timestamp: new Date().toISOString()
      };
      setLocalChats((prev) => [...prev, founderMsg]);
    }, 1500);
  };

  // Compute live step based on active booking status
  const getProgressStep = (booking: Booking | null) => {
    if (!booking) return 1; // Step 1: Choosing details
    if (booking.status === "PREBOOKED" && !booking.receiptApproved) return 2; // Step 2: Verification pending
    if (booking.status === "BOOKED") {
      const today = new Date("2026-07-06");
      const eventDate = new Date(booking.date);
      if (eventDate < today) return 5; // Step 5: Post-event gallery unlock
      if (booking.date === "2026-07-06") return 4; // Step 4: Live Event setup
      return 3; // Step 3: Chat Coordination
    }
    return 1;
  };

  const currentProgressStep = getProgressStep(activeBooking);

  // Generate July 2026 days representation
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="w-full relative z-30 text-white space-y-6">
      
      {/* 1. SECURE GOOGLE EASY ACCESS CLIENT PROFILE HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-[#799351]/30 p-5 rounded-[2rem] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#a1c398] bg-[#799351]/15 px-2.5 py-1 rounded-full border border-[#799351]/20 uppercase">
                🔒 Google Workspace Verified
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#799351] to-[#a1c398] flex items-center justify-center font-display text-lg font-bold text-neutral-950 shadow-md">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{userEmail.split("@")[0].toUpperCase()}</h4>
                <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed font-light">
              Your account is integrated via Google Secure Single-Sign-On. Pre-bookings and files are synchronized directly.
            </p>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between text-[10px] font-mono text-[#a1c398]">
            <span>Secured Session ID</span>
            <span>GSSO-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
          </div>
        </div>

        {/* Multi-Order Portfolio Selector Card */}
        <div className="lg:col-span-8 bg-neutral-900/60 border border-white/10 p-5 rounded-[2rem] backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-gray-400 uppercase">
                My Reservation Portfolio
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Manage Multi-Date Bookings ({clientBookings.length})
              </h3>
            </div>

            <button
              onClick={() => {
                setIsCreatingNewBooking(true);
                setSelectedBookingId(null);
                setActiveTab("calendar");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book Another Date</span>
            </button>
          </div>

          {clientBookings.length === 0 ? (
            <div className="bg-black/30 border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-xs">
              No reservations found. Click "Book Another Date" to submit your first photobooth experience slot!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[140px] overflow-y-auto pr-1">
              {clientBookings.map((b) => {
                const isSelected = selectedBookingId === b.id && !isCreatingNewBooking;
                const isConfirmed = b.status === "BOOKED";
                
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBookingId(b.id);
                      setIsCreatingNewBooking(false);
                      // default back to calendar or stay
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-[#799351]/15 border-[#799351] text-[#a1c398] shadow-md"
                        : "bg-black/40 border-white/5 hover:border-[#799351]/30 text-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        📅 {b.date}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed 
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-950 text-amber-400 border border-amber-500/20"
                      }`}>
                        {b.status === "BOOKED" ? "LOCKED & SECURED" : "PENDING VERIFICATION"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                        {b.packageName}
                      </span>
                      <span className="text-xs font-bold font-mono text-[#a1c398]">
                        RM {b.totalPrice}
                      </span>
                    </div>

                    {isConfirmed && (
                      <Lock className="w-3 h-3 text-emerald-400 absolute bottom-3.5 right-3.5 opacity-50" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 2. ORDER MILESTONE PROGRESS PIPELINE */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] font-mono text-[#a1c398] uppercase tracking-widest block">
              Reservation Status Tracking
            </span>
            <h3 className="text-sm font-semibold text-white mt-0.5">
              {isCreatingNewBooking 
                ? "Configure your additional booking using the tabs below"
                : `Booking Reference ID: ${activeBooking?.id} (${activeBooking?.packageName})`}
            </h3>
          </div>
          {activeBooking && (
            <div className="flex items-center gap-1.5 bg-[#799351]/15 px-3 py-1 rounded-full border border-[#799351]/30 text-[#a1c398] text-[10px] font-mono">
              {activeBooking.status === "BOOKED" ? (
                <>
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Verified & Locked</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span>Awaiting Co-founder Verification</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* The beautiful Progress milestones timeline */}
        <div className="relative w-full py-4 px-2">
          {/* Connecting Track Line */}
          <div className="absolute top-[34px] left-8 right-8 h-1 bg-neutral-800 z-0">
            <div
              className="h-full bg-gradient-to-r from-[#799351] to-[#a1c398] transition-all duration-500"
              style={{
                width: `${isCreatingNewBooking ? 0 : ((currentProgressStep - 1) / 4) * 100}%`
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative z-10 flex justify-between items-center text-center">
            {[
              { id: 1, name: "Configure Booking", desc: "Select Date & Package" },
              { id: 2, name: "Bank Verification", desc: "Verifying Deposit Receipt" },
              { id: 3, name: "Chat Coordination", desc: "Props & Backdrop selection" },
              { id: 4, name: "Event Setup", desc: "Live Print Day!" },
              { id: 5, name: "Post Event", desc: "Unlock Google Drive Gallery" }
            ].map((step) => {
              const isActive = !isCreatingNewBooking && step.id === currentProgressStep;
              const isCompleted = !isCreatingNewBooking && step.id < currentProgressStep;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Circle Dot */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
                      isActive
                        ? "bg-[#799351] border-[#a1c398] text-white shadow-[0_0_15px_rgba(161,195,152,0.6)] scale-110"
                        : isCompleted
                        ? "bg-[#799351]/80 border-[#799351] text-white"
                        : "bg-neutral-950 border-white/10 text-gray-500"
                    }`}
                  >
                    {isCompleted ? "✔" : step.id}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-[10px] font-semibold mt-2.5 block tracking-wide ${
                      isActive ? "text-[#a1c398]" : "text-gray-400"
                    }`}
                  >
                    {step.name}
                  </span>
                  <span className="text-[8px] text-gray-500 hidden md:block max-w-[120px] mx-auto mt-0.5">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. COLLAPSIBLE SIDEBAR WORKSPACE CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* Left Sidebar Menu Rail */}
        <div 
          className={`flex flex-col gap-2.5 transition-all duration-300 shrink-0 w-full lg:w-auto ${
            sidebarCollapsed ? "lg:w-[78px]" : "lg:w-[245px]"
          }`}
        >
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block px-1.5 mb-1">
            {sidebarCollapsed ? "Menu" : "Portal Menubar"}
          </span>

          {[
            { id: "calendar", label: "Interactive Calendar", icon: CalendarIcon, badge: isCreatingNewBooking ? "PICK DATE" : activeBooking?.date },
            { id: "choose_plan", label: "Choose Photobooth Plan", icon: Sparkles, badge: isCreatingNewBooking ? "SELECT" : activeBooking?.packageName.split(" ")[0] },
            { id: "calculator", label: "Price Quote Calculator", icon: Calculator, badge: "RM " + (isCreatingNewBooking ? totalPriceForNew : activeBooking?.totalPrice) },
            { id: "address", label: "Event Place Address", icon: MapPin, badge: null },
            {
              id: "unlock",
              label: "Unlock Digital Memories",
              icon: activeBooking?.status === "BOOKED" ? Unlock : Lock,
              badge: activeBooking?.status === "BOOKED" ? "UNLOCKED" : "LOCKED"
            },
            { id: "chat", label: "Founder Live Chat", icon: MessageSquare, badge: "WhatsApp" }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                title={sidebarCollapsed ? tab.label : undefined}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all group ${
                  isSelected
                    ? "bg-[#799351]/15 border-[#799351] text-[#a1c398]"
                    : "bg-neutral-900/40 border-white/5 text-gray-400 hover:border-[#799351]/20 hover:text-white"
                } ${sidebarCollapsed ? "lg:justify-center" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-4 h-4 transition-all ${isSelected ? "text-[#a1c398]" : "text-gray-400 group-hover:text-white"}`} />
                  {!sidebarCollapsed && <span className="text-xs font-semibold">{tab.label}</span>}
                </div>
                {!sidebarCollapsed && tab.badge && (
                  <span className="text-[8px] font-mono font-bold bg-[#799351]/10 px-1.5 py-0.5 rounded text-[#a1c398] truncate max-w-[80px]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Sidebar Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-full mt-4 p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 text-gray-400 hover:text-white text-xs font-mono uppercase items-center gap-2 justify-center transition-all"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Hide Menu</span>
              </>
            )}
          </button>
        </div>

        {/* Right Content View Pane */}
        <div className="flex-1 min-w-0 w-full">
          
          {/* Active Banner for LOCKED states */}
          {!isCreatingNewBooking && activeBooking && (activeTab === "calendar" || activeTab === "choose_plan" || activeTab === "calculator") && (
            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-950/40 to-neutral-950 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#a1c398] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">🔒 Reservation Date & Package Secured</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 font-light">
                  This experience is verified and locked in our master calendar on <strong className="text-[#a1c398]">{activeBooking.date}</strong> using <strong className="text-[#a1c398]">{activeBooking.packageName}</strong>. To make adjustments, please use the Founder Chat coordinator line.
                </p>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="glass-card rounded-[2rem] p-6 border-white/10 bg-neutral-900/60 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                    📅 Interactive Availability Calendar
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-light">
                    Select a date in July 2026. Confirmed bookings lock dates instantly.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#799351]" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Selected / Pending</span>
                  </div>
                </div>
              </div>

              {/* Month Header Representation */}
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-semibold font-mono uppercase tracking-widest text-[#a1c398]">
                  JULY 2026
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  Selangor & West Malaysia Coverage Area
                </span>
              </div>

              {/* Day names list */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold text-gray-500 py-1 border-y border-white/5">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* 31 Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* 3 Offset blocks to start July 2026 on a Wednesday */}
                <div className="bg-transparent" />
                <div className="bg-transparent" />

                {calendarDays.map((day) => {
                  const dateStr = `2026-07-${day < 10 ? "0" + day : day}`;
                  
                  // Check if this date has any confirmed/pending bookings
                  const hasBooking = bookingsList.find((b) => b.date === dateStr);
                  const isPending = hasBooking?.status === "PREBOOKED";
                  const isConfirmed = hasBooking?.status === "BOOKED";
                  
                  // Highlight the selected date
                  const isSelected = isCreatingNewBooking 
                    ? selectedDate === dateStr 
                    : activeBooking?.date === dateStr;

                  let borderClass = "border-white/5 hover:border-[#799351]/50";
                  let bgClass = "bg-neutral-950/40 text-gray-300";

                  if (isSelected) {
                    borderClass = "border-[#799351] shadow-[0_0_10px_rgba(121,147,81,0.2)]";
                    bgClass = "bg-[#799351]/20 text-[#a1c398]";
                  } else if (isConfirmed) {
                    borderClass = "border-amber-500/20";
                    bgClass = "bg-amber-950/20 text-amber-500 opacity-60 cursor-not-allowed";
                  } else if (isPending) {
                    borderClass = "border-amber-400/40";
                    bgClass = "bg-amber-950/30 text-amber-300";
                  } else {
                    bgClass = "bg-[#799351]/5 text-gray-200 hover:bg-[#799351]/10";
                  }

                  return (
                    <button
                      key={day}
                      disabled={!isCreatingNewBooking || (isConfirmed && !isSelected)}
                      onClick={() => {
                        if (isCreatingNewBooking) {
                          setSelectedDate(dateStr);
                        }
                      }}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between h-[60px] ${borderClass} ${bgClass}`}
                    >
                      <span className="text-xs font-bold font-mono">{day}</span>
                      {isConfirmed ? (
                        <span className="text-[7px] uppercase font-mono font-bold tracking-widest text-amber-500">
                          Locked
                        </span>
                      ) : isPending ? (
                        <span className="text-[7px] uppercase font-mono font-semibold tracking-widest text-amber-300">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[7px] uppercase font-mono font-semibold tracking-wider text-gray-500">
                          Avail
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Show selected date panel action */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#a1c398]" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">
                      {isCreatingNewBooking ? "Selected Target Date" : "Your Event Target Date"}
                    </span>
                    <span className="text-sm font-semibold text-white font-mono">
                      {isCreatingNewBooking ? selectedDate : activeBooking?.date}
                    </span>
                  </div>
                </div>

                {isCreatingNewBooking ? (
                  <button
                    onClick={() => setBookingFormOpen(true)}
                    className="px-5 py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md"
                  >
                    Configure Plan details
                  </button>
                ) : (
                  <span className="text-xs font-mono font-bold text-[#a1c398] bg-[#799351]/15 px-3 py-1 rounded-lg border border-[#799351]/20">
                    🔒 Locked Experience
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "choose_plan" && (
            <div className="glass-card rounded-[2rem] p-6 border-white/10 bg-neutral-900/60 backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                  💎 Choose Your Unlimited Photobooth Plan
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-light">
                  Select premium unlimited print configurations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACKAGES.map((pkg) => {
                  const isSelected = isCreatingNewBooking
                    ? selectedPkg.id === pkg.id
                    : activeBooking?.packageName.toLowerCase() === pkg.name.toLowerCase();

                  return (
                    <button
                      key={pkg.id}
                      disabled={!isCreatingNewBooking}
                      onClick={() => {
                        if (isCreatingNewBooking) setSelectedPkg(pkg);
                      }}
                      className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between h-[180px] relative ${
                        isSelected
                          ? "bg-[#799351]/10 border-[#799351] shadow-[0_0_15px_rgba(121,147,81,0.15)] scale-[1.02]"
                          : "bg-neutral-950/40 border-white/5 hover:border-[#799351]/30 disabled:opacity-50"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 bg-[#799351] text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}

                      <div>
                        <h4 className="font-bold text-sm text-white">{pkg.name}</h4>
                        <p className="text-[9px] text-gray-400 font-light mt-1.5 line-clamp-3">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="mt-4">
                        <span className="text-[9px] text-gray-500 font-mono block">BASE VALUE</span>
                        <span className="text-lg font-bold text-[#a1c398]">RM {pkg.price}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Show details for selected package */}
              <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-[#a1c398] font-mono block mb-2 uppercase">
                  Included in selected Plan:
                </span>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-300 font-light">
                  {(isCreatingNewBooking ? selectedPkg : PACKAGES.find(p => p.name.toLowerCase() === activeBooking?.packageName.toLowerCase()) || PACKAGES[1]).features.map((feat, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-[#a1c398] mt-0.5">✔</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "calculator" && (
            <div className="glass-card rounded-[2rem] p-6 border-white/10 bg-neutral-900/60 backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                  🧮 Dynamic Price Quote Calculator
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-light">
                  Invoices are compiled based on customized hours and premium print configurations.
                </p>
              </div>

              <div className="space-y-4">
                {/* Package Base selection */}
                <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase font-mono">Core Package Selected</span>
                    <span className="text-xs font-semibold text-white">
                      {isCreatingNewBooking ? selectedPkg.name : activeBooking?.packageName}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#a1c398]">
                    RM {isCreatingNewBooking ? basePrice : (PACKAGES.find(p => p.name.toLowerCase() === activeBooking?.packageName.toLowerCase())?.price || 699)}
                  </span>
                </div>

                {/* Add-ons iteration list */}
                {isCreatingNewBooking ? (
                  ADDONS.map((addon) => {
                    const qty = selectedAddons[addon.id] || 0;
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between p-3.5 bg-neutral-950/40 border border-white/5 rounded-xl"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white block">{addon.name}</span>
                          <span className="text-[10px] text-amber-500 font-mono font-medium block">
                            +RM {addon.price} {addon.unit === "hour" ? "/ hour" : ""}
                          </span>
                        </div>

                        {addon.unit === "hour" ? (
                          <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                            <button
                              onClick={() => handleAddonChange(addon.id, Math.max(0, qty - 1))}
                              className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono px-1">{qty} hrs</span>
                            <button
                              onClick={() => handleAddonChange(addon.id, qty + 1)}
                              className="w-6 h-6 rounded bg-neutral-800 hover:bg-[#5f743e] text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddonChange(addon.id, qty === 1 ? 0 : 1)}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-all font-semibold ${
                              qty === 1
                                ? "bg-[#799351] text-white"
                                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                            }`}
                          >
                            {qty === 1 ? "Selected" : "Add"}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Registered Add-ons:</span>
                    {activeBooking?.addOns && activeBooking.addOns.length > 0 ? (
                      activeBooking.addOns.map((add, i) => (
                        <div key={i} className="p-3 bg-neutral-950/50 border border-white/5 rounded-xl text-xs text-gray-300">
                          ✔ {add}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-neutral-950/50 border border-white/5 rounded-xl text-xs text-gray-500 font-light">
                        No additional upgrades requested.
                      </div>
                    )}
                  </div>
                )}

                {/* Total Invoice estimate */}
                <div className="p-5 bg-[#799351]/10 rounded-xl border border-[#799351]/30 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">Total Booking Value</span>
                    <span className="text-xs text-gray-300 font-light mt-0.5">Complimentary shipping in West Malaysia</span>
                  </div>
                  <span className="text-2xl font-bold font-display text-[#a1c398]">
                    RM {isCreatingNewBooking ? totalPriceForNew : activeBooking?.totalPrice}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="glass-card rounded-[2rem] p-6 border-white/10 bg-neutral-900/60 backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                  📍 Event Location Place & Logistics
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-light">
                  Define the exact venue coords. Transit is free in Selangor, Negeri Sembilan, Johor, and Pahang.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase">
                    Full Venue Address
                  </label>
                  <input
                    type="text"
                    disabled={!isCreatingNewBooking && activeBooking?.status === "BOOKED"}
                    value={isCreatingNewBooking ? eventAddress : activeBooking?.locationAddress || "Mandarin Oriental Grand Ballroom, KL"}
                    onChange={(e) => {
                      if (isCreatingNewBooking) setEventAddress(e.target.value);
                    }}
                    placeholder="e.g. Grand Ballroom, Level 2, Mandarin Oriental Hotel, Kuala Lumpur"
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase">
                      Select Covered Logistics State
                    </label>
                    <select
                      disabled={!isCreatingNewBooking}
                      value={isCreatingNewBooking ? selectedState : "selangor"}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] disabled:opacity-60"
                    >
                      {STATES_MAP.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase">
                      Complementary shipping surcharge
                    </label>
                    <div className="p-3 bg-neutral-950/60 border border-white/5 text-[#a1c398] text-xs font-mono rounded-xl font-bold">
                      RM 0 / Free Delivery Transit
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase">
                    Photographer On-site Setup Notes
                  </label>
                  <textarea
                    disabled={!isCreatingNewBooking && activeBooking?.status === "BOOKED"}
                    value={isCreatingNewBooking ? specialInstructions : "Please setup near stage power outlet."}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                    placeholder="e.g. Stage power outlets are on the left wall."
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] disabled:opacity-60"
                  />
                </div>

                {isCreatingNewBooking && (
                  <button
                    onClick={() => alert("📍 Event address and logistics instructions pre-configured. Complete payment registration next.")}
                    className="w-full py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white font-semibold rounded-lg text-xs uppercase tracking-wider transition-all"
                  >
                    Confirm Venue Coordinates
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "unlock" && (
            <div className="glass-card rounded-[2rem] p-6 border-white/10 bg-neutral-900/60 backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-3">
                <FolderLock className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                    🔐 Unlock Digital Memories (Google Drive Access)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-light">
                    Your softcopies are uploaded directly to Google Drive after your event has finished.
                  </p>
                </div>
              </div>

              {activeBooking ? (
                <>
                  <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed">
                    <span className="text-[10px] text-[#a1c398] font-bold font-mono block mb-1 uppercase">
                      Reservation context:
                    </span>
                    Booking ID: {activeBooking.id} • Target Date: {activeBooking.date} • Status: {activeBooking.status}
                  </div>

                  {activeBooking.status === "BOOKED" ? (
                    submittedReview ? (
                      <div className="bg-[#799351]/10 border border-[#799351]/20 p-6 rounded-xl text-center space-y-4">
                        <CheckCircle className="w-10 h-10 text-[#a1c398] mx-auto" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          SECURE TOKEN GENERATED - GALLERY UNLOCKED!
                        </h4>
                        <p className="text-xs text-gray-300 font-light max-w-md mx-auto">
                          Thank you for your rating! Your custom Google Drive folder has been verified and synchronized.
                        </p>

                        <a
                          href="https://drive.google.com/drive/folders/framez-client-gallery-2026"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-semibold rounded-lg shadow-md uppercase font-mono tracking-wider"
                        >
                          Launch Google Drive Folder ↗
                        </a>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setSubmittedReview(true);
                        }}
                        className="space-y-4"
                      >
                        <div className="bg-amber-950/20 border border-amber-500/10 p-4 rounded-xl text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong>Verification rules:</strong> Softcopies are unlocked immediately post-event. To instantly generate the secure folder token for testing in the portal, submit a quick star review feedback.
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 py-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setClientRating(star)}
                              className="p-1 focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= clientRating ? "text-amber-400 fill-amber-400" : "text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={clientTestimonial}
                          onChange={(e) => setClientTestimonial(e.target.value)}
                          placeholder="How was the photographer, custom templates, and physical props experience?"
                          rows={3}
                          className="w-full text-xs p-3 bg-neutral-950 border border-white/10 rounded-xl focus:border-[#799351] outline-none text-white placeholder-gray-500"
                        />

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-neutral-900 border border-white/10 hover:border-[#799351] text-xs font-semibold rounded-lg tracking-wider text-[#a1c398] hover:bg-[#799351]/10 transition-all uppercase"
                        >
                          Submit Feedback to Unlock Link
                        </button>
                      </form>
                    )
                  ) : (
                    <div className="bg-black/40 p-8 rounded-xl border border-white/5 text-center space-y-4">
                      <Lock className="w-12 h-12 text-gray-600 mx-auto" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Gallery is Locked
                      </h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Your deposit transaction has not been verified yet. Google Drive uploads will initialize automatically as soon as your booking status changes to "BOOKED".
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-black/30 p-8 rounded-xl border border-white/5 text-center space-y-4">
                  <Lock className="w-12 h-12 text-gray-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    No Active Booking Found
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Please configure and select a valid reservation to inspect softcopies.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="glass-card rounded-[2rem] p-6 border-white/10 bg-neutral-900/60 backdrop-blur-xl flex flex-col h-[480px] justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#a1c398]" />
                  <div>
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider">
                      Co-Founder Chat Coordination Line
                    </h3>
                    <p className="text-[10px] text-gray-500">Irfan & Irsalina are active</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold bg-[#799351]/10 border border-[#799351]/20 px-2 py-0.5 rounded text-[#a1c398]">
                  WhatsApp Bridge: CONNECTED
                </span>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 max-h-[300px]">
                {localChats.map((m, idx) => {
                  const isUser = m.sender !== "OWNER";
                  return (
                    <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] ${
                          isUser
                            ? "bg-[#799351] text-white rounded-tr-none shadow-md"
                            : "bg-neutral-800 text-white rounded-tl-none"
                        }`}
                      >
                        {m.text}
                        <span className="text-[8px] text-gray-300 block mt-1 text-right">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2 border-t border-white/5 pt-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a coordination question for the founders..."
                  className="flex-1 text-xs p-3 bg-neutral-950 border border-white/10 rounded-xl outline-none focus:border-[#799351] text-white"
                />
                <button
                  type="submit"
                  className="p-3 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* 4. BOOKING DETAILS CONFIRMATION MODAL FOR NEW RESERVATIONS */}
      {bookingFormOpen && (
        <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-white/10 rounded-[2rem] p-6 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div>
              <span className="text-[10px] font-mono text-[#a1c398] uppercase tracking-widest block">
                Secure July 2026 Reservation Lock
              </span>
              <h3 className="text-xl font-display text-white mt-1">
                📅 Booking Date: {selectedDate}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Client Name</label>
                  <input
                    type="text"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Contact Phone</label>
                  <input
                    type="tel"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                  />
                </div>
              </div>

              {/* Package Summary */}
              <div className="p-3 bg-black/30 rounded-xl border border-white/5 text-xs">
                <div className="flex justify-between items-center text-[#a1c398] font-bold">
                  <span>Selected: {selectedPkg.name}</span>
                  <span>RM {selectedPkg.price}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Includes {selectedPkg.durationHrs} hours on-site unlimited live photo printing.
                </div>
              </div>

              {/* Receipt uploader */}
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-gray-400 block uppercase">
                  Upload Payment Slips / PDF Receipt Proof:
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[#a1c398] bg-[#799351]/10 scale-[1.01]"
                      : uploadSuccess
                      ? "border-[#799351] bg-[#799351]/5"
                      : "border-white/10 hover:border-[#799351]/40 bg-neutral-950/40"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploadSuccess ? (
                    <div className="space-y-1">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                      <span className="text-xs text-white font-mono block truncate max-w-[200px]">
                        {uploadedFileName || "slip.pdf"}
                      </span>
                      <span className="text-[9px] text-[#a1c398] font-mono block">READY TO REGISTER</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                      <span className="text-xs text-gray-300 block">Drag receipt here or click to browse</span>
                      <span className="text-[9px] text-gray-500 block">Maybank/CIMB/DuitNow transfer screenshots allowed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingFormOpen(false)}
                  className="py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeBooking}
                  className="py-2 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md"
                >
                  Lock Pre-Booking
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
