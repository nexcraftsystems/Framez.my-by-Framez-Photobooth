import React, { useState, useRef } from "react";
import { Booking, CrewLead, HardwareItem, ChatMessage, SystemAuditLog, InventoryLocation, InventoryItem, InventoryRequest, SystemNotification, Role } from "../types";
import InventoryManager from "./InventoryManager";
import NotificationManager from "./NotificationManager";
import CrewProfileView from "./CrewProfileView";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  PenTool, 
  Shield, 
  MapPin, 
  User, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  DollarSign, 
  Award, 
  MessageSquare, 
  Users, 
  CreditCard, 
  Send, 
  Star, 
  Search, 
  Check,
  Bell,
  Package
} from "lucide-react";

interface CrewDashboardProps {
  userEmail: string;
  bookingsList: Booking[];
  hardwareList: HardwareItem[];
  crewLeads: CrewLead[];
  onAddAuditLog: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  onUpdateHardwareStock: (id: string, count: number) => void;
  onUpdateCrewLeads: React.Dispatch<React.SetStateAction<CrewLead[]>>;
  chatMessages: ChatMessage[];
  onSendMessage: (clientId: string, text: string, sender: "CLIENT" | "CREW" | "OWNER") => void;
  
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
}

export default function CrewDashboard({
  userEmail,
  bookingsList,
  hardwareList,
  crewLeads,
  onAddAuditLog,
  onUpdateHardwareStock,
  onUpdateCrewLeads,
  chatMessages,
  onSendMessage,
  locations,
  onUpdateLocations,
  inventory,
  onUpdateInventory,
  inventoryRequests,
  onUpdateRequests,
  notifications,
  onUpdateNotifications,
}: CrewDashboardProps) {
  // Find crew lead profile based on email
  const nameFromEmail = userEmail.includes("zack") ? "Zack" : userEmail.includes("maya") ? "Maya" : "Zack";
  const crewProfile = crewLeads.find((c) => c.name.toLowerCase() === nameFromEmail.toLowerCase()) || crewLeads[0];

  // UI state variables
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "chat" | "referred" | "hardware" | "inventory" | "notifications" | "profile">("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Hardware/Maintenance sub-states
  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>(hardwareList[0]?.id || "");

  // Bank Info form states (pre-populated)
  const [bankName, setBankName] = useState(crewProfile.bankName || "Maybank");
  const [bankAccountNumber, setBankAccountNumber] = useState(crewProfile.bankAccountNumber || "");
  const [bankAccountHolder, setBankAccountHolder] = useState(crewProfile.bankAccountHolder || crewProfile.name);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Chat-related states
  const [activeChatBookingId, setActiveChatBookingId] = useState<string>("");
  const [typedMessage, setTypedMessage] = useState("");

  // Search filter query for clients
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Determine standard referral code based on ID
  const crewReferralCode = crewProfile.id === "c1" ? "CREW-ZACK-01" : crewProfile.id === "c2" ? "CREW-MAYA-02" : `CREW-${crewProfile.name.toUpperCase()}-03`;

  // 1. FILTER BOOKINGS ASSOCIATED WITH THIS CREW MEMBER
  const assignedBookings = bookingsList.filter((b) => b.crewLeadId === crewProfile.id);

  // Split into past and pending jobs
  const pastJobs = assignedBookings.filter((b) => {
    const isPastDate = b.date < "2026-07-06" || b.id.includes("past");
    return isPastDate && b.status === "BOOKED";
  });

  const pendingJobs = assignedBookings.filter((b) => {
    const isPastDate = b.date < "2026-07-06" || b.id.includes("past");
    return !isPastDate && (b.status === "BOOKED" || b.status === "PREBOOKED");
  });

  // Calculate earnings payout: 20% of package value for completed past jobs
  const jobEarnings = pastJobs.reduce((sum, b) => sum + (b.totalPrice * 0.2), 0);

  // 2. FIND REFERRED CLIENTS (referralCode matches their referral pattern)
  const referredClients = bookingsList.filter((b) => {
    const code = (b.referralCode || "").trim().toUpperCase();
    return (
      code === crewProfile.id.toUpperCase() ||
      code === crewReferralCode.toUpperCase() ||
      code === crewProfile.name.toUpperCase()
    );
  });

  // Filter referred clients with search query
  const filteredReferredClients = referredClients.filter((b) => {
    const query = clientSearchQuery.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(query) ||
      b.packageName.toLowerCase().includes(query) ||
      b.state.toLowerCase().includes(query)
    );
  });

  // Referral payouts: RM50 flat fee per referred booking
  const referralEarnings = referredClients.length * 50;
  const totalEarnings = jobEarnings + referralEarnings;

  // Active chat filtered to selected booking
  const chatRooms = assignedBookings;
  const activeChatRoom = chatRooms.find((c) => c.id === activeChatBookingId) || chatRooms[0];
  const activeChats = chatMessages.filter((m) => m.clientId === activeChatBookingId);

  // Handlers
  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);

    setTimeout(() => {
      onUpdateCrewLeads((prev) =>
        prev.map((c) =>
          c.id === crewProfile.id
            ? { ...c, bankName, bankAccountNumber, bankAccountHolder }
            : c
        )
      );
      onAddAuditLog(
        `${crewProfile.name} (Crew)`,
        `Updated bank coordinates: ${bankName} (${bankAccountNumber})`,
        "info"
      );
      setIsSavingBank(false);
      alert("🏦 Bank details synchronized successfully with Irfan's owner database.");
    }, 800);
  };

  const handleSendGroupChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChatBookingId) return;

    onSendMessage(activeChatBookingId, typedMessage, "CREW");
    setTypedMessage("");
  };

  const handleMaintenanceReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceNotes.trim()) return;

    const hwItem = hardwareList.find((h) => h.id === selectedHardwareId);
    onAddAuditLog(
      `${crewProfile.name} (Crew Lead)`,
      `Submitted maintenance report for ${hwItem?.name || "Equipment"}: "${maintenanceNotes}"`,
      "info"
    );
    alert(`🛠 Defect report logged for ${hwItem?.name}. Maintenance pipeline updated.`);
    setMaintenanceNotes("");
  };

  const handleEquipmentSignout = (itemId: string) => {
    const hwItem = hardwareList.find((h) => h.id === itemId);
    if (!hwItem) return;
    if (hwItem.stockCount <= 0) {
      alert("Error: No stock remaining for this item!");
      return;
    }
    
    onUpdateHardwareStock(itemId, hwItem.stockCount - 1);
    onAddAuditLog(
      `${crewProfile.name} (Crew Lead)`,
      `Signed out 1 unit of ${hwItem.name} for field event.`,
      "info"
    );
    alert(`📦 ${hwItem.name} signed out for event setup.`);
  };

  const handleEquipmentReturn = (itemId: string) => {
    const hwItem = hardwareList.find((h) => h.id === itemId);
    if (!hwItem) return;

    onUpdateHardwareStock(itemId, hwItem.stockCount + 1);
    onAddAuditLog(
      `${crewProfile.name} (Crew Lead)`,
      `Returned 1 unit of ${hwItem.name} to central hardware store.`,
      "info"
    );
    alert(`✅ ${hwItem.name} safely returned to operational inventory.`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative z-10 text-white items-start w-full">
      
      {/* COLLAPSIBLE SIDEBAR ON THE LEFT */}
      <div 
        className={`bg-neutral-900/60 border border-white/10 rounded-[2rem] p-5 backdrop-blur-md flex flex-col justify-between transition-all duration-300 shrink-0 w-full lg:w-auto ${
          sidebarCollapsed ? "lg:w-[78px]" : "lg:w-[245px]"
        }`}
      >
        <div className="space-y-6">
          {/* Identity Info */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#799351]/20 border border-[#a1c398] flex items-center justify-center text-[#a1c398] font-bold shrink-0 text-base font-display">
              {crewProfile.name[0]}
            </div>
            {(!sidebarCollapsed || window.innerWidth < 1024) && (
              <div className="truncate">
                <h4 className="text-xs font-bold text-white block uppercase tracking-wide">
                  {crewProfile.name}
                </h4>
                <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase">
                  {crewProfile.role}
                </span>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "My Shift Summary", icon: User },
              { id: "jobs", label: "Jobs History", icon: Clock },
              { id: "chat", label: "WhatsApp Chat", icon: MessageSquare },
              { id: "referred", label: "Referred Clients", icon: Users },
              { id: "hardware", label: "Central Hardware", icon: Shield },
              { id: "inventory", label: "Inventory", icon: Package },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "profile", label: "Profile", icon: User },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  title={sidebarCollapsed ? tab.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isSelected
                      ? "bg-[#799351] text-white shadow-lg shadow-[#799351]/20 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  } ${sidebarCollapsed ? "lg:justify-center" : ""}`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  {(!sidebarCollapsed || window.innerWidth < 1024) && <span>{tab.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hide Sidebar Trigger Button */}
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

      {/* RIGHT MAIN PORTAL WORKSPACE CONTAINER */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Workspace Quick Header Info */}
        <div className="flex items-center justify-between gap-4 bg-neutral-900/60 p-4 px-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
          <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider">
            {activeTab === "dashboard" && "Field Coordinator Overview & Performance Profile"}
            {activeTab === "jobs" && "Assigned Job Scheduler & Payout Spreadsheet"}
            {activeTab === "chat" && "Coordinating Multi-Party Shared WhatsApp chat room"}
            {activeTab === "referred" && "Crew Referral Tracker & Affiliate Sales List"}
            {activeTab === "hardware" && "Central Hardware Sign-out & defection logger"}
            {activeTab === "inventory" && "Central Inventory Location Directory"}
            {activeTab === "notifications" && "System Alerts & Broadcasting Messages"}
            {activeTab === "profile" && "Personal Crew Coordinator Profile & Bank Coordinates"}
          </h3>
          <div className="flex items-center gap-2 px-3.5 py-1 bg-[#799351]/10 rounded-full border border-[#799351]/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-[#a1c398] uppercase">
              CREW PORTAL ACTIVE
            </span>
          </div>
        </div>

        {/* 2. TAB RENDERING CONTENT */}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Main Welcome Message banner */}
            <div className="p-6 bg-gradient-to-r from-neutral-900/80 to-neutral-950 border border-white/10 rounded-[2rem] relative overflow-hidden backdrop-blur-md">
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-bold font-mono text-[#a1c398] uppercase tracking-widest bg-[#799351]/10 px-2.5 py-1 rounded">
                  Shift Active
                </span>
                <h3 className="text-xl font-bold text-white font-display">
                  Welcome back, {crewProfile.name}!
                </h3>
                <p className="text-xs text-gray-400 font-light max-w-xl leading-relaxed">
                  Your performance coordinates are synchronizing perfectly. Update your bank coordinates below to receive automatic direct payouts for completed photobooth assignments.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Side: Financial Earnings & Performance Summary */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Financial overview stats card */}
                <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
                  <h4 className="text-xs font-bold font-display uppercase tracking-widest text-[#a1c398]">
                    💰 Earnings & payout Dashboard
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-black/30 p-4 border border-white/5 rounded-2xl">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block">Total Income</span>
                      <span className="text-base font-bold text-white block mt-1">RM {totalEarnings.toFixed(2)}</span>
                    </div>
                    <div className="bg-black/30 p-4 border border-white/5 rounded-2xl">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block">Job Payouts</span>
                      <span className="text-base font-bold text-white block mt-1">RM {jobEarnings.toFixed(2)}</span>
                    </div>
                    <div className="bg-black/30 p-4 border border-white/5 rounded-2xl">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block">Referral Fees</span>
                      <span className="text-base font-bold text-[#a1c398] block mt-1">RM {referralEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    * Job payouts are calculated as a <strong>20% share</strong> of each package price upon successful event completion.
                  </div>
                </div>

                {/* Bank Account Coordinates configuration */}
                <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
                  <div>
                    <h4 className="text-xs font-bold font-display uppercase tracking-widest text-white">
                      🏦 Bank Account coordinates
                    </h4>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Provide details for secure bank transfer settlements.
                    </span>
                  </div>

                  <form onSubmit={handleSaveBankDetails} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Bank Name</label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Maybank, CIMB"
                          className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Account Number</label>
                        <input
                          type="text"
                          required
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="e.g. 164155123456"
                          className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        value={bankAccountHolder}
                        onChange={(e) => setBankAccountHolder(e.target.value)}
                        placeholder="e.g. Zack Coordinator"
                        className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingBank}
                      className="px-5 py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                    >
                      {isSavingBank ? "Saving..." : "Save Payout Coordinates"}
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Side: Performance appraisal coordinates */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-5">
                  <h4 className="text-xs font-bold font-display uppercase tracking-widest text-[#a1c398]">
                    🎖 Performance Appraisal
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-mono">Job Rating</span>
                        <span className="text-white font-bold">⭐️ {crewProfile.rating || "4.8"} / 5.0</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(crewProfile.rating || 4.8) * 20}%` }} />
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-mono">Promptness Rate</span>
                        <span className="text-white font-bold">{crewProfile.promptnessRating || "95"}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#799351] h-full rounded-full" style={{ width: `${crewProfile.promptnessRating || 95}%` }} />
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-mono">Customer Satisfaction</span>
                        <span className="text-white font-bold">⭐️ {crewProfile.customerSatisfaction || "4.9"} / 5.0</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#a1c398] h-full rounded-full" style={{ width: `${(crewProfile.customerSatisfaction || 4.9) * 20}%` }} />
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                      <span className="text-[10px] text-gray-500 font-mono uppercase block">Referral Code to Share</span>
                      <div className="flex items-center justify-between mt-2 p-2 bg-neutral-950 border border-white/10 rounded-xl">
                        <span className="text-xs font-mono font-bold text-[#a1c398]">{crewReferralCode}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-mono px-2 py-0.5 bg-neutral-900 border border-white/5 rounded-md">
                          RM50 payout / referral
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* JOBS HISTORY TAB */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            
            {/* Pending jobs Table */}
            <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold font-display uppercase tracking-wider text-white">
                    ⏳ Pending & Active Jobs Assigned
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Bookings recently synchronized and assigned by Irfan.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 bg-amber-950/40 border border-amber-500/20 text-amber-400 rounded-md">
                  {pendingJobs.length} PENDING
                </span>
              </div>

              {pendingJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs italic bg-black/30 border border-white/5 rounded-2xl">
                  No pending assignments right now. Keep an eye out for updates.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Region Space</th>
                        <th className="py-3 px-4">Event Package</th>
                        <th className="py-3 px-4">Estimated Share</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingJobs.map((b) => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-3 px-4 font-mono font-bold text-gray-400">{b.id}</td>
                          <td className="py-3 px-4 font-bold text-white">{b.clientName}</td>
                          <td className="py-3 px-4 font-mono text-amber-400">{b.date}</td>
                          <td className="py-3 px-4 font-mono text-gray-300 uppercase">{b.state}</td>
                          <td className="py-3 px-4 text-gray-400 font-light">{b.packageName}</td>
                          <td className="py-3 px-4 font-bold text-white">RM {(b.totalPrice * 0.2).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800/30 font-mono text-[9px] rounded font-bold uppercase">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Past completed jobs Table */}
            <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold font-display uppercase tracking-wider text-[#a1c398]">
                    ✅ Past & Completed Jobs
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Your completed work history and paid earnings summary.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 bg-[#799351]/10 border border-[#799351]/20 text-[#a1c398] rounded-md">
                  {pastJobs.length} COMPLETED
                </span>
              </div>

              {pastJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs italic bg-black/30 border border-white/5 rounded-2xl">
                  No historical jobs recorded yet in this workspace.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Region Space</th>
                        <th className="py-3 px-4">Event Package</th>
                        <th className="py-3 px-4">Earning Share (20%)</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastJobs.map((b) => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-3 px-4 font-mono font-bold text-gray-400">{b.id}</td>
                          <td className="py-3 px-4 font-bold text-white">{b.clientName}</td>
                          <td className="py-3 px-4 font-mono text-gray-300">{b.date}</td>
                          <td className="py-3 px-4 font-mono text-gray-300 uppercase">{b.state}</td>
                          <td className="py-3 px-4 text-gray-400 font-light">{b.packageName}</td>
                          <td className="py-3 px-4 font-bold text-[#a1c398]">RM {(b.totalPrice * 0.2).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 font-mono text-[9px] rounded font-bold uppercase">
                              COMPLETED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SHARED CHAT ROOM TAB */}
        {activeTab === "chat" && (
          <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[520px] backdrop-blur-md">
            
            <div className="bg-[#799351]/10 p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#a1c398]" />
                <div>
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                    Multi-Party Client Group chat
                  </h3>
                  <span className="text-[10px] text-gray-400 block font-mono">Shared Coordinator Channel</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold bg-[#799351]/10 px-2.5 py-0.5 rounded text-[#a1c398] border border-[#799351]/20">
                OWNER & CREW TUNNEL ACTIVE
              </span>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Left sidebar listing of assigned bookings for chat selection */}
              <div className="w-[30%] border-r border-white/5 overflow-y-auto bg-black/20">
                {chatRooms.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-gray-500">No active bookings for chat.</div>
                ) : (
                  chatRooms.map((b) => {
                    const isActive = b.id === activeChatBookingId;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setActiveChatBookingId(b.id)}
                        className={`w-full p-3.5 text-left border-b border-white/5 transition-all flex flex-col gap-1 ${
                          isActive ? "bg-[#799351]/15 text-[#a1c398]" : "hover:bg-neutral-900/30"
                        }`}
                      >
                        <span className="text-xs font-bold truncate block text-white">{b.clientName}</span>
                        <span className="text-[9px] text-gray-400 truncate block font-mono">{b.date} • {b.id}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right chat logs sequence panel */}
              <div className="w-[70%] flex flex-col justify-between bg-black/40">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {!activeChatBookingId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs space-y-1">
                      <span>Select an assigned client booking room.</span>
                      <span className="text-[10px] text-gray-600 font-mono">You share this thread with Irfan & client.</span>
                    </div>
                  ) : (
                    <>
                      {/* Initial placeholder message if thread is empty */}
                      {activeChats.length === 0 && (
                        <div className="p-3 text-center text-gray-600 text-[10px] italic">
                          Beginning secure coordinator connection for {activeChatRoom?.clientName}.
                        </div>
                      )}
                      {activeChats.map((m) => {
                        const isCrew = m.sender === "CREW";
                        const isOwner = m.sender === "OWNER";
                        const isClient = m.sender === "CLIENT";

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col max-w-[85%] ${isCrew ? "ml-auto items-end" : "mr-auto items-start"}`}
                          >
                            <span className="text-[8px] font-mono text-gray-500 mb-0.5">
                              {isCrew ? `${crewProfile.name.toUpperCase()} (CREW)` : isOwner ? "IRFAN (CO-FOUNDER)" : m.clientName.toUpperCase()}
                            </span>
                            <div
                              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isCrew
                                  ? "bg-[#799351] text-white rounded-tr-none"
                                  : isOwner
                                  ? "bg-neutral-800 text-white rounded-tl-none border border-white/5"
                                  : "bg-neutral-900 text-white rounded-tl-none border border-[#799351]/20"
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Input box */}
                <form onSubmit={handleSendGroupChat} className="p-4 border-t border-white/5 bg-black/20 flex gap-2">
                  <input
                    type="text"
                    disabled={!activeChatBookingId}
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder={activeChatBookingId ? "Draft a group response..." : "Select room first..."}
                    className="flex-1 text-xs p-3 bg-neutral-950 border border-white/10 rounded-xl outline-none focus:border-[#799351] text-white disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={!activeChatBookingId || !typedMessage.trim()}
                    className="p-3 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            </div>

          </div>
        )}

        {/* REFERRED CLIENTS TAB */}
        {activeTab === "referred" && (
          <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h4 className="text-base font-bold font-display uppercase tracking-wider text-white">
                  👥 Crew Affiliate & Referred Clients
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Look up and coordinate clients who reserved using your personal referral code.
                </p>
              </div>

              {/* Referral code banner */}
              <div className="bg-[#799351]/10 border border-[#799351]/20 px-4 py-2.5 rounded-xl text-left flex flex-col shrink-0">
                <span className="text-[8px] font-mono text-gray-400 uppercase tracking-wider">My Referral Code</span>
                <span className="text-sm font-mono font-bold text-[#a1c398]">{crewReferralCode}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/30 p-4 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-gray-500 font-mono uppercase block">Total Referrals</span>
                <span className="text-xl font-bold text-white block mt-1">{referredClients.length} Clients</span>
              </div>
              <div className="bg-black/30 p-4 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-gray-500 font-mono uppercase block">Referral Rate</span>
                <span className="text-xl font-bold text-[#a1c398] block mt-1">RM 50.00 / client</span>
              </div>
              <div className="bg-black/30 p-4 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-gray-500 font-mono uppercase block">Cumulative Bonus</span>
                <span className="text-xl font-bold text-amber-400 block mt-1">RM {referralEarnings.toFixed(2)}</span>
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="text"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Find referred client by name, package or state..."
                className="w-full text-xs pl-9 p-3 bg-neutral-950 border border-white/10 rounded-xl text-white outline-none focus:border-[#799351] placeholder-gray-600"
              />
            </div>

            {/* Referred client database list */}
            {filteredReferredClients.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs italic bg-black/30 border border-white/5 rounded-2xl">
                No matching referred clients found for query or code.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4">Event Date</th>
                      <th className="py-3 px-4">Package Select</th>
                      <th className="py-3 px-4">Referral Code Used</th>
                      <th className="py-3 px-4 text-right">Bonus Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferredClients.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="py-3 px-4 font-mono font-bold text-gray-500">{b.id}</td>
                        <td className="py-3 px-4 font-bold text-white">{b.clientName}</td>
                        <td className="py-3 px-4 font-mono text-gray-300 uppercase">{b.state}</td>
                        <td className="py-3 px-4 font-mono text-amber-500">{b.date}</td>
                        <td className="py-3 px-4 text-gray-400 font-light">{b.packageName}</td>
                        <td className="py-3 px-4 font-mono text-[#a1c398] font-bold">{b.referralCode}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">RM 50.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* EQUIPMENT checkout TAB (preserved) */}
        {activeTab === "hardware" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Hardware Status checkout / Mobile Equipment portal (7 cols) */}
            <div className="lg:col-span-7 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-display uppercase tracking-wider text-white">
                    📦 Hardware Checkout & Logs
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Sign out hardware rigs prior to shifting, and return post-event.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#a1c398] bg-[#799351]/10 px-2 py-0.5 rounded-full border border-[#799351]/20">
                  INVENTORY SECURE
                </span>
              </div>

              <div className="space-y-3">
                {hardwareList.map((hw) => {
                  const isLow = hw.stockCount <= hw.threshold;
                  return (
                    <div
                      key={hw.id}
                      className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between transition-all hover:border-[#799351]/20"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-semibold text-white truncate">{hw.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-gray-500 font-mono uppercase">{hw.category}</span>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                            isLow ? "bg-amber-950 text-amber-400 border border-amber-800/10" : "bg-[#799351]/10 text-[#a1c398]"
                          }`}>
                            Stock count: {hw.stockCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEquipmentSignout(hw.id)}
                          disabled={hw.stockCount <= 0}
                          className="px-3.5 py-2 bg-neutral-950 hover:bg-[#799351]/20 hover:text-[#a1c398] text-xs font-bold rounded-xl border border-white/10 transition-all disabled:opacity-50"
                        >
                          Out
                        </button>
                        <button
                          onClick={() => handleEquipmentReturn(hw.id)}
                          className="px-3.5 py-2 bg-neutral-950 hover:bg-[#799351]/20 hover:text-[#a1c398] text-xs font-bold rounded-xl border border-white/10 transition-all"
                        >
                          In
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Defection and Issue Log (5 cols) */}
            <div className="lg:col-span-5 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#a1c398]" />
                <h3 className="text-base font-bold font-display uppercase tracking-wider text-white">
                  🛠 Log Issue / defect
                </h3>
              </div>

              <form onSubmit={handleMaintenanceReport} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1 uppercase">Target Equipment:</label>
                  <select
                    value={selectedHardwareId}
                    onChange={(e) => setSelectedHardwareId(e.target.value)}
                    className="w-full text-xs p-3 bg-neutral-950 border border-white/10 rounded-xl text-white outline-none focus:border-[#799351]"
                  >
                    {hardwareList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-gray-400 block mb-1 uppercase">Defect / Log Details:</label>
                  <textarea
                    value={maintenanceNotes}
                    onChange={(e) => setMaintenanceNotes(e.target.value)}
                    placeholder="e.g. Dye-sub photopaper roll replaced or calibrating custom flash brackets."
                    rows={4}
                    className="w-full text-xs p-3 bg-neutral-950 border border-white/10 rounded-xl text-white outline-none focus:border-[#799351] placeholder-gray-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  File Defect Report
                </button>
              </form>
            </div>

          </div>
        )}

        {activeTab === "inventory" && (
          <InventoryManager
            locations={locations}
            inventory={inventory}
            inventoryRequests={inventoryRequests}
            onUpdateInventory={onUpdateInventory}
            onUpdateLocations={onUpdateLocations}
            onUpdateRequests={onUpdateRequests}
            onAddAuditLog={onAddAuditLog}
            role="CREW"
            userName={crewProfile.name}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationManager
            notifications={notifications}
            onUpdateNotifications={onUpdateNotifications}
            role="CREW"
            userEmail={userEmail}
            onAddAuditLog={onAddAuditLog}
            targetCrewId={crewProfile?.id}
          />
        )}

        {activeTab === "profile" && (
          <CrewProfileView
            profile={crewProfile}
            onUpdateCrewLeads={onUpdateCrewLeads}
            role="CREW"
            onAddAuditLog={onAddAuditLog}
            allCrewList={crewLeads}
          />
        )}

      </div>
    </div>
  );
}
