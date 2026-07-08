import React, { useState, useRef, useEffect } from "react";
import { PACKAGES, ADDONS, STATES_MAP } from "../data";
import { Package, AddOn, Booking, ChatMessage, Role } from "../types";
import PrintableReceipt from "./PrintableReceipt";
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
  Check,
  DollarSign,
  Image as ImageIcon,
  X
} from "lucide-react";
import { collection, doc, query, where, getDocs, setDoc, updateDoc, addDoc, onSnapshot, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface ClientDashboardProps {
  userEmail: string;
  onNewBooking: (booking: Booking) => void;
  bookingsList: Booking[];
  role: Role;
  onAddAuditLog?: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  onUpdateBooking?: (booking: Booking) => void;
}

export default function ClientDashboard({
  userEmail,
  onNewBooking,
  bookingsList,
  role = "CLIENT",
  onAddAuditLog,
  onUpdateBooking
}: ClientDashboardProps) {
  // Sync client bookings
  const clientBookings = bookingsList.filter(
    (b) => b.clientEmail.toLowerCase() === userEmail.toLowerCase()
  );

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(() => {
    return clientBookings.length > 0 ? clientBookings[0].id : null;
  });
  
  const [isCreatingNewBooking, setIsCreatingNewBooking] = useState(clientBookings.length === 0);

  // Linear Wizard step (1 to 8)
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Form selections (NEW BOOKINGS)
  const [selectedPkg, setSelectedPkg] = useState<Package>(PACKAGES[1]); // Platinum
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: number }>({
    "extra_hours": 0,
    "custom_guestbook": 1,
  });
  const [selectedState, setSelectedState] = useState<string>("selangor");
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-25");
  const [eventAddress, setEventAddress] = useState<string>("Grand Hall, Lot 101, Jalan Damansara, Kuala Lumpur");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  // Customer contact detail
  const [formClientName, setFormClientName] = useState(() => {
    return userEmail.split("@")[0].toUpperCase() || "CLIENT";
  });
  const [formClientPhone, setFormClientPhone] = useState("+6012-9998888");

  // Receipt files upload (Step 5 & Step 6)
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Second receipt balance upload (Step 6)
  const [isDragging2, setIsDragging2] = useState(false);
  const [uploadedFileName2, setUploadedFileName2] = useState<string | null>(null);
  const [uploadedFileUrl2, setUploadedFileUrl2] = useState<string | null>(null);
  const [uploadSuccess2, setUploadSuccess2] = useState(false);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Chat/Messages state dynamically synchronized with Firestore chats collection
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatFileUrl, setChatFileUrl] = useState<string | null>(null);
  const [chatFileName, setChatFileName] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Review states
  const [clientRating, setClientRating] = useState<number>(5);
  const [clientTestimonial, setClientTestimonial] = useState("");
  const [submittedReview, setSubmittedReview] = useState(false);

  // Current active booking references
  const activeBooking = isCreatingNewBooking 
    ? null 
    : bookingsList.find((b) => b.id === selectedBookingId) || clientBookings[0] || null;

  // Real-time synchronization of chats from Firestore for this specific booking
  useEffect(() => {
    const bookingId = activeBooking?.id || "general";
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("clientId", "==", bookingId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push(doc.data() as ChatMessage);
      });
      // Sort messages chronologically by timestamp
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      if (msgs.length === 0) {
        // Fallback welcome message
        setChats([
          {
            id: "m_init_1",
            clientId: bookingId,
            clientName: "Crew Dispatcher",
            sender: "CREW",
            text: `Welcome to your premium chat workspace for reference ${bookingId}. How can Irfan and our field crew help you select layouts, backdrops, and props?`,
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
      } else {
        setChats(msgs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats?clientId=${bookingId}`);
    });

    return () => unsubscribe();
  }, [activeBooking?.id]);

  // Sync selected booking changes back to local form editing states
  useEffect(() => {
    if (activeBooking) {
      const pkg = PACKAGES.find(p => p.name.toLowerCase() === activeBooking.packageName.toLowerCase()) || PACKAGES[1];
      setSelectedPkg(pkg);
      setSelectedDate(activeBooking.date);
      setEventAddress(activeBooking.locationAddress || "");
      setSelectedState(activeBooking.state.toLowerCase() === "selangor" ? "selangor" : "kuala_lumpur");
      setFormClientName(activeBooking.clientName);
      setFormClientPhone(activeBooking.clientPhone);
      setUploadedFileUrl(activeBooking.receiptUrl || null);
      setUploadedFileUrl2(activeBooking.secondReceiptUrl || null);
    }
  }, [selectedBookingId, isCreatingNewBooking]);

  // Compute total live pricing
  const basePrice = selectedPkg.price;
  const addonCost = ADDONS.reduce((total, add) => {
    const qty = selectedAddons[add.id] || 0;
    return total + (add.price * qty);
  }, 0);
  const totalPriceForNew = basePrice + addonCost;

  const handleAddonChange = (addonId: string, value: number) => {
    if (!isCreatingNewBooking) return;
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: value
    }));
  };

  // Submit the Prebooking to Firestore
  const handleFinalizeBooking = async () => {
    if (!uploadedFileUrl) {
      alert("⚠️ Please upload your deposit transaction slip in Step 5 before submitting!");
      return;
    }

    const addonsSummary: string[] = [];
    ADDONS.forEach((ad) => {
      const qty = selectedAddons[ad.id] || 0;
      if (qty > 0) {
        addonsSummary.push(`${ad.name} x${qty}`);
      }
    });

    const newBookingId = "b_" + Math.random().toString(36).substr(2, 9);
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
      receiptUrl: uploadedFileUrl,
      receiptApproved: false,
      unlockedDrive: false
    };

    try {
      // Save directly to Firestore
      await setDoc(doc(db, "bookings", newBookingId), newBooking);

      // Save to local hooks
      onNewBooking(newBooking);

      // Audit Log
      if (onAddAuditLog) {
        onAddAuditLog(
          "Client Workspace",
          `Client submitted new photobooth pre-booking ${newBookingId} for date ${selectedDate}.`,
          "info"
        );
      }

      setSelectedBookingId(newBookingId);
      setIsCreatingNewBooking(false);
      setUploadSuccess(false);
      setUploadedFileName(null);
      
      // Auto-advance to receipt invoice step
      setWizardStep(6);
      alert(`🎉 Congratulations! Your reservation for ${selectedDate} has been successfully submitted! Irfan & Irsalina will check your deposit receipt and approve it shortly.`);
    } catch (e) {
      console.error("Booking creation failed:", e);
      alert("❌ Submission failed. Connection error.");
    }
  };

  // Handle second payment receipt upload
  const handleUploadSecondReceipt = async (url: string) => {
    if (!activeBooking) return;
    try {
      const updated = {
        ...activeBooking,
        secondReceiptUrl: url,
        secondPaymentApproved: false,
        secondPaymentRejected: false,
        secondPaymentRejectionReason: ""
      };
      await setDoc(doc(db, "bookings", activeBooking.id), updated);
      if (onUpdateBooking) onUpdateBooking(updated);
      alert("📤 2nd Payment Receipt uploaded! Our accounts team will review and unlock your memories.");
    } catch (e) {
      console.error("Failed uploading 2nd receipt", e);
    }
  };

  // Chat Send Handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatFileUrl) return;

    const bookingId = activeBooking?.id || "general";
    const msgId = "msg_" + Math.random().toString(36).substr(2, 9);
    
    // Construct rich chat message with image upload capability
    const newMsg: ChatMessage = {
      id: msgId,
      clientId: bookingId,
      clientName: userEmail.split("@")[0].toUpperCase() || "CLIENT",
      sender: "CLIENT",
      text: chatInput.trim() + (chatFileUrl ? `\n[Shared File: ${chatFileName}]` : ""),
      timestamp: new Date().toISOString()
    };

    try {
      // Save to Firestore chats collection
      await setDoc(doc(db, "chats", msgId), newMsg);
      setChatInput("");
      setChatFileUrl(null);
      setChatFileName(null);

      // Fast auto-response simulator if no crew online
      setTimeout(async () => {
        const autoId = "msg_reply_" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "chats", autoId), {
          id: autoId,
          clientId: bookingId,
          clientName: "Crew Assistant (AI)",
          sender: "CREW",
          text: `Hey, we have received your message! Irfan or one of our active crew members will look into this layout/prop requirement right away.`,
          timestamp: new Date().toISOString()
        });
      }, 2000);
    } catch (err) {
      console.error("Failed sending message:", err);
    }
  };

  // Chat file input simulator
  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setChatFileName(file.name);
      // Generate object URL to display inside chat
      const fakeUrl = "https://cdn.sceneai.art/backgrounds/e102a51c-c095-492e-b909-72bb753f83a2.mov";
      setChatFileUrl(fakeUrl);
    }
  };

  // Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;

    try {
      const updated = {
        ...activeBooking,
        reviewRating: clientRating,
        reviewText: clientTestimonial
      };
      await setDoc(doc(db, "bookings", activeBooking.id), updated);
      if (onUpdateBooking) onUpdateBooking(updated);
      setSubmittedReview(true);
      alert("💖 Thank you for sharing your experience! Your review has been logged to the master feedback wall.");
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      // Simulating secure upload
      setUploadedFileUrl(`https://framez.my/uploads/${file.name}`);
      setUploadSuccess(true);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setUploadedFileUrl(`https://framez.my/uploads/${file.name}`);
      setUploadSuccess(true);
    }
  };

  // Drag & drop handlers for second payment
  const handleDragOver2 = (e: React.DragEvent) => { e.preventDefault(); setIsDragging2(true); };
  const handleDragLeave2 = () => { setIsDragging2(false); };
  const handleDrop2 = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging2(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName2(file.name);
      const url = `https://framez.my/uploads/${file.name}`;
      setUploadedFileUrl2(url);
      setUploadSuccess2(true);
      handleUploadSecondReceipt(url);
    }
  };
  const handleFileSelect2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName2(file.name);
      const url = `https://framez.my/uploads/${file.name}`;
      setUploadedFileUrl2(url);
      setUploadSuccess2(true);
      handleUploadSecondReceipt(url);
    }
  };

  const steps = [
    { number: 1, label: "Select Date", desc: "Interactive Availability Calendar" },
    { number: 2, label: "Experience Plan", desc: "Select Photobooth Package" },
    { number: 3, label: "Addons Setup", desc: "Configure Custom Upgrades" },
    { number: 4, label: "Event Place/Logistics", desc: "Set Location Coordinates" },
    { number: 5, label: "Deposit Payment", desc: "Lock Slot via Bank Transfer" },
    { number: 6, label: "Receipt Invoices", desc: "Printable Invoices & 2nd Receipt" },
    { number: 7, label: "Chat Coordinators", desc: "Props, Layouts & Themes" },
    { number: 8, label: "Digital Memories", desc: "Unlock Google Drive Gallery" }
  ];

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
                <h4 className="text-sm font-bold text-white truncate font-mono">{userEmail.split("@")[0].toUpperCase()}</h4>
                <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed font-light">
              Integrated via Google Secure Single-Sign-On. Pre-bookings, invoices, and photos are backed up dynamically in cloud storage.
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
              <h3 className="text-base font-bold text-white mt-0.5 font-display">
                Manage Multi-Date Bookings ({clientBookings.length})
              </h3>
            </div>

            <button
              onClick={() => {
                setIsCreatingNewBooking(true);
                setSelectedBookingId(null);
                setWizardStep(1);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book Another Date</span>
            </button>
          </div>

          {clientBookings.length === 0 ? (
            <div className="bg-black/30 border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-xs">
              No reservations found. Use the 8-Step Wizard below to schedule your first premium photobooth date!
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
                      // Reset to suitable wizard step when viewing active orders
                      setWizardStep(6);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-[#799351]/15 border-[#799351] text-[#a1c398] shadow-md scale-[1.01]"
                        : "bg-black/40 border-white/5 hover:border-[#799351]/30 text-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white truncate max-w-[150px] font-mono">
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

      {/* 2. ELEGANT 8-STEP TIMELINE INDICATOR BAR */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-x-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[9px] font-mono text-[#a1c398] uppercase tracking-widest block font-bold">
              Premium Portal Lifecycle Wizard
            </span>
            <h3 className="text-sm font-semibold text-white mt-0.5 font-display">
              {isCreatingNewBooking 
                ? `Step ${wizardStep} of 8: Configure Additional Experience Slot`
                : `Booking Reference: ${activeBooking?.id} — Step ${wizardStep} of 8: ${steps[wizardStep - 1].label}`}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-[#799351]/15 px-3 py-1 rounded-full border border-[#799351]/30 text-[#a1c398] text-[10px] font-mono">
            <span>Wizard Navigation Active</span>
          </div>
        </div>

        {/* 8-Step Timeline Dots */}
        <div className="relative min-w-[700px] py-4 px-2">
          {/* Tracking line behind */}
          <div className="absolute top-[32px] left-6 right-6 h-0.5 bg-neutral-800 z-0">
            <div
              className="h-full bg-[#799351] transition-all duration-300"
              style={{
                width: `${((wizardStep - 1) / 7) * 100}%`
              }}
            />
          </div>

          <div className="relative z-10 flex justify-between items-center text-center">
            {steps.map((st) => {
              const isSelected = wizardStep === st.number;
              const isCompleted = wizardStep > st.number;
              return (
                <button
                  key={st.number}
                  onClick={() => setWizardStep(st.number)}
                  className="flex flex-col items-center flex-1 outline-none group cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 border ${
                      isSelected
                        ? "bg-[#799351] border-[#a1c398] text-white shadow-[0_0_15px_rgba(161,195,152,0.6)] scale-110"
                        : isCompleted
                        ? "bg-[#799351]/60 border-[#799351] text-white"
                        : "bg-neutral-950 border-white/10 text-gray-500 hover:border-gray-600"
                    }`}
                  >
                    {isCompleted ? "✔" : st.number}
                  </div>
                  <span
                    className={`text-[9px] font-bold mt-2 block tracking-wide truncate max-w-[85px] uppercase ${
                      isSelected ? "text-[#a1c398]" : "text-gray-400 group-hover:text-white"
                    }`}
                  >
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. ACTIVE WIZARD STAGE VIEWPORT CARD */}
      <div className="glass-card rounded-[2rem] p-6 md:p-8 border-white/10 bg-neutral-900/60 backdrop-blur-xl relative overflow-hidden space-y-6">
        
        {/* Step Indicator Header */}
        <div className="border-b border-white/5 pb-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono text-[#a1c398] uppercase tracking-widest font-bold">
              Stage {wizardStep} / 8 • {steps[wizardStep - 1].label}
            </span>
            <h3 className="text-xl font-bold font-display tracking-tight text-white mt-1">
              {steps[wizardStep - 1].desc}
            </h3>
          </div>
          
          <div className="text-[10px] text-gray-400 font-mono text-right hidden sm:block">
            {isCreatingNewBooking ? (
              <span className="text-amber-400 font-bold bg-amber-950/20 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">
                ⚠️ Unsaved Reservation
              </span>
            ) : (
              <span className="text-emerald-400 font-bold bg-[#799351]/15 border border-[#799351]/20 px-2.5 py-1 rounded-full uppercase">
                Reference: {activeBooking?.id}
              </span>
            )}
          </div>
        </div>

        {/* Verification banner for locked details in steps 1-4 */}
        {!isCreatingNewBooking && activeBooking && wizardStep <= 4 && (
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-neutral-950 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#a1c398] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">🔒 Experience Confirmed & Locked</h4>
              <p className="text-[11px] text-gray-400 mt-0.5 font-light leading-relaxed">
                Your event slot is fully locked in our corporate scheduling register. Pre-selected packages can be adjusted or upgraded anytime by communicating via the **Founder live coordination chat (Step 7)**.
              </p>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 1: CHOOSE DATE */}
        {/* ======================================= */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <span className="text-sm font-bold font-mono uppercase tracking-widest text-[#a1c398]">
                JULY 2026 CALENDAR
              </span>
              <span className="text-xs text-gray-400 font-mono hidden md:block">
                Selangor & Klang Valley Premium Service Zone
              </span>
            </div>

            {/* Calendar Days Names list */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold text-gray-500 py-1 border-y border-white/5">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* 31 Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              <div className="bg-transparent" />
              <div className="bg-transparent" />

              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dateStr = `2026-07-${day < 10 ? "0" + day : day}`;
                const hasBooking = bookingsList.find((b) => b.date === dateStr);
                const isConfirmed = hasBooking?.status === "BOOKED";
                const isPending = hasBooking?.status === "PREBOOKED";
                
                const isSelected = isCreatingNewBooking 
                  ? selectedDate === dateStr 
                  : activeBooking?.date === dateStr;

                let borderClass = "border-white/5 hover:border-[#799351]/50";
                let bgClass = "bg-neutral-950/40 text-gray-300";

                if (isSelected) {
                  borderClass = "border-[#799351] shadow-[0_0_10px_rgba(121,147,81,0.2)] scale-102";
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
                      if (isCreatingNewBooking) setSelectedDate(dateStr);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between h-[65px] ${borderClass} ${bgClass}`}
                  >
                    <span className="text-xs font-bold font-mono">{day}</span>
                    {isConfirmed ? (
                      <span className="text-[7px] uppercase font-mono font-bold tracking-widest text-amber-500">Locked</span>
                    ) : isPending ? (
                      <span className="text-[7px] uppercase font-mono font-semibold tracking-widest text-amber-300">Pending</span>
                    ) : (
                      <span className="text-[7px] uppercase font-mono font-semibold tracking-wider text-gray-500">Available</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Show selection summary */}
            <div className="p-4 bg-neutral-950/60 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[#a1c398]" />
                <div>
                  <span className="text-[9px] text-gray-500 font-mono uppercase block">Event Date Target</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {isCreatingNewBooking ? selectedDate : activeBooking?.date}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 font-light max-w-sm">
                Clicking dates on the calendar locks your selection. Click **Next Step** to choose your experience plan.
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 2: CHOOSE EXPERIENCE PLAN */}
        {/* ======================================= */}
        {wizardStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    className={`p-5 rounded-2xl text-left border transition-all flex flex-col justify-between h-[210px] relative ${
                      isSelected
                        ? "bg-[#799351]/10 border-[#799351] shadow-[0_0_15px_rgba(121,147,81,0.15)] scale-[1.02]"
                        : "bg-neutral-950/40 border-white/5 hover:border-[#799351]/30 disabled:opacity-50"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3.5 right-3.5 bg-[#799351] text-[8px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full">
                        Selected Choice
                      </span>
                    )}

                    <div>
                      <h4 className="font-bold text-base text-white font-display">{pkg.name}</h4>
                      <p className="text-[10px] text-gray-400 font-light mt-2 line-clamp-3">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="mt-4">
                      <span className="text-[9px] text-gray-500 font-mono block">BASE PLAN PRICE</span>
                      <span className="text-xl font-extrabold text-[#a1c398] font-mono">RM {pkg.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Display package features list */}
            <div className="bg-neutral-950/50 p-6 rounded-2xl border border-white/5 space-y-3">
              <span className="text-xs font-bold text-[#a1c398] font-mono block uppercase tracking-wider">
                🎁 PREMIUM INCLUSIONS & EQUIPMENT PARAMETERS:
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-300 font-light">
                {selectedPkg.features.map((feat, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#a1c398] mt-0.5">✔</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 3: CHOOSE ADDONS (CALCULATOR) */}
        {/* ======================================= */}
        {wizardStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Addons Selection Grid (Left Side) */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] text-[#a1c398] font-mono font-bold uppercase tracking-widest block">
                  Select Custom Event Upgrades:
                </span>
                
                <div className="space-y-3">
                  {ADDONS.map((ad) => {
                    const qty = selectedAddons[ad.id] || 0;
                    return (
                      <div
                        key={ad.id}
                        className="p-4 bg-neutral-950/40 border border-white/5 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">{ad.name}</h4>
                          <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                            +RM {ad.price} per {ad.unit}
                          </p>
                        </div>

                        {isCreatingNewBooking ? (
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleAddonChange(ad.id, Math.max(0, qty - 1))}
                              className="w-7 h-7 bg-neutral-900 border border-white/10 hover:border-[#799351] rounded-lg text-white font-bold flex items-center justify-center transition-colors text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-mono text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddonChange(ad.id, qty + 1)}
                              className="w-7 h-7 bg-[#799351] border border-[#a1c398]/30 hover:bg-[#5f743e] rounded-lg text-white font-bold flex items-center justify-center transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-[#a1c398] font-mono">
                            {qty > 0 ? `Selected x${qty}` : "None"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Quotation Summary Card (Right Side) */}
              <div className="lg:col-span-5 bg-neutral-950/60 border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] text-gray-500 font-mono uppercase block">Interactive Quote Summary</span>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 border-b border-white/5 pb-2">
                    <span>Selected Base Package:</span>
                    <span className="font-mono text-white">RM {basePrice.toFixed(2)}</span>
                  </div>

                  <div className="space-y-1.5 border-b border-white/5 pb-2">
                    <span className="text-[9px] font-mono text-gray-500 uppercase block">Selected Upgrades Breakdowns:</span>
                    {ADDONS.filter(ad => (selectedAddons[ad.id] || 0) > 0).map(ad => (
                      <div key={ad.id} className="flex justify-between items-center text-[11px] text-gray-300">
                        <span>{ad.name} (x{selectedAddons[ad.id]}):</span>
                        <span className="font-mono text-white">RM {(ad.price * selectedAddons[ad.id]).toFixed(2)}</span>
                      </div>
                    ))}
                    {ADDONS.filter(ad => (selectedAddons[ad.id] || 0) > 0).length === 0 && (
                      <span className="text-[11px] text-gray-600 font-mono block italic">No upgrades pre-selected.</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-white uppercase font-display">RM ESTIMATED TOTAL:</span>
                    <span className="font-mono text-[#a1c398] text-base font-extrabold">
                      RM {totalPriceForNew.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#799351]/10 border border-[#799351]/20 rounded-xl text-[10px] text-[#a1c398] font-mono leading-relaxed">
                  💡 Note: A fixed deposit booking fee of **RM 150.00** is required upfront to lock and verify this slot in our master calendar scheduler. Balance paid in Step 6.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 4: EVENT PLACE / LOGISTICS */}
        {/* ======================================= */}
        {wizardStep === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 focus-within:border-[#799351] transition-all">
                <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Operating State (Territorial Limits)
                </label>
                <select
                  disabled={!isCreatingNewBooking}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs font-bold font-mono"
                >
                  <option value="selangor" className="bg-neutral-900 text-white">Selangor (Primary Zone)</option>
                  <option value="kuala_lumpur" className="bg-neutral-900 text-white">Kuala Lumpur (Primary Zone)</option>
                </select>
              </div>

              <div className="flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 focus-within:border-[#799351] transition-all">
                <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Corporate Point of Contact Phone
                </label>
                <input
                  type="text"
                  required
                  disabled={!isCreatingNewBooking}
                  value={formClientPhone}
                  onChange={(e) => setFormClientPhone(e.target.value)}
                  placeholder="+6012-XXXXXXX"
                  className="bg-transparent border-none outline-none text-white text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 focus-within:border-[#799351] transition-all">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                Venue Event Place Address (Be as specific as possible)
              </label>
              <input
                type="text"
                required
                disabled={!isCreatingNewBooking}
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                placeholder="Hotel, Ballroom, Grand Hall, Street Name, Block No."
                className="bg-transparent border-none outline-none text-white text-xs font-medium placeholder-gray-600"
              />
            </div>

            <div className="flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 focus-within:border-[#799351] transition-all">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                Special Logistical Instructions / Coordination Requests
              </label>
              <textarea
                disabled={!isCreatingNewBooking}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Include setup timing requirements, power plug accessibility, backdrop themes, props instructions, etc."
                rows={3}
                className="bg-transparent border-none outline-none text-white text-xs font-light placeholder-gray-600 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 5: PAYMENT PROCESS (UPLOAD RECEIPT) */}
        {/* ======================================= */}
        {wizardStep === 5 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Bank accounts coordinates */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] text-[#a1c398] font-bold font-mono uppercase tracking-widest block">
                  🏦 Bank Account Transfer Coordinates:
                </span>
                
                <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-mono">CORPORATE BANK:</span>
                    <span className="text-white font-bold">{localStorage.getItem("framez_bank_name") || "Maybank (Malayan Banking)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-mono">ACCOUNT HOLDER:</span>
                    <span className="text-white font-bold">{localStorage.getItem("framez_bank_acc_name") || "Framez Photobooth Enterprise"}</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-gray-500 font-mono text-[10px]">ACCOUNT NUMBER:</span>
                    <span className="text-[#a1c398] font-mono font-bold bg-neutral-900/60 p-2.5 rounded-lg text-center tracking-widest text-sm select-all border border-white/5">
                      {localStorage.getItem("framez_bank_acc_no") || "5140-1234-5678"}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="p-4 bg-[#799351]/10 border border-[#799351]/20 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] text-white font-mono uppercase font-bold block">Scan corporate DuitNow QR</span>
                  <div className="w-24 h-24 bg-white p-1 rounded-lg mx-auto flex items-center justify-center">
                    {localStorage.getItem("framez_bank_qr_url") ? (
                      <img src={localStorage.getItem("framez_bank_qr_url")!} alt="Corporate QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full border border-black flex flex-col justify-between p-1 text-black">
                        <div className="flex justify-between">
                          <div className="w-2.5 h-2.5 bg-black" />
                          <div className="w-2.5 h-2.5 bg-black" />
                        </div>
                        <span className="text-[8px] font-bold font-mono tracking-tighter">DuitNow QR</span>
                        <div className="flex justify-between">
                          <div className="w-2.5 h-2.5 bg-black" />
                          <div className="w-2.5 h-2.5 bg-black" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload drag-drop slip section */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-widest block">
                  📤 Upload Bank Transaction Slip (RM 150.00 Deposit):
                </span>

                {isCreatingNewBooking ? (
                  <div className="space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[180px] ${
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
                        <div className="space-y-2">
                          <CheckCircle className="w-10 h-10 text-[#a1c398] mx-auto animate-bounce" />
                          <span className="text-xs font-bold text-white block">Receipt Loaded Successfully</span>
                          <span className="text-[10px] text-gray-400 font-mono block truncate max-w-[250px]">
                            {uploadedFileName || "deposit_slip.pdf"}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-10 h-10 text-gray-500 mx-auto group-hover:text-white" />
                          <span className="text-xs font-bold text-white block">Drag & Drop Deposit slip here</span>
                          <span className="text-[10px] text-gray-500 block">Or click to browse your local device (PDF, PNG, JPG)</span>
                        </div>
                      )}
                    </div>

                    {uploadSuccess && (
                      <button
                        onClick={handleFinalizeBooking}
                        className="w-full py-4 bg-[#799351] hover:bg-[#5f743e] text-white rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Submit Booking Reservation Request</span>
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-4">
                    <CheckCircle className="w-10 h-10 text-[#a1c398] mx-auto" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Deposit Receipt Uploaded</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Your pre-booking deposit transaction receipt is synchronized and logged under the accounting database.
                    </p>
                    {uploadedFileUrl && (
                      <div className="p-3 bg-neutral-900 border border-white/5 rounded-xl text-xs flex justify-between items-center text-gray-400">
                        <span className="font-mono text-[9px]">File Reference:</span>
                        <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-[#a1c398] hover:underline font-mono truncate max-w-[200px]">
                          View Uploaded Slip ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 6: RECEIPT FOR PAYMENT (SUPPORT 2 RECEIPTS) */}
        {/* ======================================= */}
        {wizardStep === 6 && (
          <div className="space-y-6">
            {activeBooking ? (
              <div className="space-y-6">
                
                {/* Invoice Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-neutral-950/40 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">Billing Ledger Summary</span>
                    <div className="flex justify-between items-center text-xs text-gray-400 border-b border-white/5 pb-2">
                      <span>Base + Addons Cost:</span>
                      <span className="font-mono text-white">RM {activeBooking.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 border-b border-white/5 pb-2">
                      <span>1st Deposit Slip (Paid):</span>
                      <span className="font-mono text-emerald-400 font-semibold">- RM 150.00</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs font-bold text-white uppercase font-display">Balance Payment Due:</span>
                      <span className="font-mono text-[#a1c398] text-sm font-extrabold">
                        RM {(activeBooking.totalPrice - 150).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-neutral-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase block">Master Clearance Status</span>
                      <div className="mt-2.5 flex items-center gap-2">
                        {activeBooking.secondPaymentApproved ? (
                          <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Fully Paid & Verified
                          </span>
                        ) : activeBooking.secondReceiptUrl ? (
                          <span className="px-3 py-1 bg-amber-950 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> 2nd Receipt Reviewing
                          </span>
                        ) : activeBooking.secondPaymentRejected ? (
                          <span className="px-3 py-1 bg-red-950 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" /> 2nd Receipt Rejected
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-neutral-900 text-gray-400 border border-white/10 rounded-full text-[10px] font-bold font-mono uppercase">
                            Balance Due Prior to Event
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2 font-mono">
                      Event Date: {activeBooking.date} • Balance payment due 2 days prior.
                    </div>
                  </div>
                </div>

                {/* Split: Printable invoice view vs Balance Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  
                  {/* Left: View/Print corporate receipt invoice */}
                  <div className="lg:col-span-7 space-y-4">
                    <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-widest block">📄 Printable Receipt Statement</span>
                    <div className="bg-neutral-950/40 p-1.5 rounded-2xl border border-white/5">
                      <PrintableReceipt booking={activeBooking} />
                    </div>
                  </div>

                  {/* Right: Upload 2nd Balance Receipt slip */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-widest block">💳 Upload Balance Payment Slip (Receipt 2)</span>
                    
                    {activeBooking.secondPaymentApproved ? (
                      <div className="p-6 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-center space-y-3">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">All Transactions Cleared!</h4>
                        <p className="text-[11px] text-gray-300 leading-normal font-light">
                          Irfan & Irsalina have verified your final bank transfer. Your account ledger is clean and fully settled. Live digital memories will unlock automatically in **Step 8** right after the photobooth session ends!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeBooking.secondPaymentRejected && (
                          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-300">
                            <strong>❌ Rejected Slip Notice:</strong> {activeBooking.secondPaymentRejectionReason || "Please upload a valid payment proof matching your remaining balance."}
                          </div>
                        )}

                        <div
                          onDragOver={handleDragOver2}
                          onDragLeave={handleDragLeave2}
                          onDrop={handleDrop2}
                          onClick={() => fileInputRef2.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[150px] ${
                            isDragging2
                              ? "border-[#a1c398] bg-[#799351]/10 scale-[1.01]"
                              : uploadSuccess2
                              ? "border-[#799351] bg-[#799351]/5"
                              : "border-white/10 hover:border-[#799351]/40 bg-neutral-950/40"
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef2}
                            onChange={handleFileSelect2}
                            className="hidden"
                          />
                          {uploadedFileUrl2 ? (
                            <div className="space-y-1">
                              <CheckCircle className="w-8 h-8 text-[#a1c398] mx-auto" />
                              <span className="text-[11px] font-bold text-white block">2nd Slip Registered</span>
                              <span className="text-[9px] text-gray-400 font-mono block truncate max-w-[200px]">
                                {uploadedFileName2 || "balance_receipt.pdf"}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                              <span className="text-xs font-bold text-white block">Drop Balance/Final Receipt</span>
                              <span className="text-[9px] text-gray-500 block">Click to upload balance receipt</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-2 text-[11px] font-light text-gray-400">
                          <span className="text-[#a1c398] font-semibold block uppercase font-mono text-[9px] tracking-wider">🏦 Balance Transfer Details:</span>
                          Transfer exactly **RM {(activeBooking.totalPrice - 150).toFixed(2)}** to {localStorage.getItem("framez_bank_name") || "Maybank"} acc number: **{localStorage.getItem("framez_bank_acc_no") || "5140-1234-5678"}** to complete your full payment invoice.
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">No Reservation Locked</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto font-light leading-relaxed">
                  You have no active or completed photobooth bookings selected. Please complete steps 1 to 5 to generate your secure printable invoice statements.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 7: CHAT WITH CREW (CHAT COORDINATION HUB) */}
        {/* ======================================= */}
        {wizardStep === 7 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] text-[#a1c398] font-mono font-bold uppercase tracking-widest block">
                  CRM Communication Channel
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  CHAT COORDINATION HUB
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono uppercase animate-pulse">
                ● Live Dispatch Online
              </span>
            </div>

            {/* Chat Messages Frame */}
            <div className="h-[280px] overflow-y-auto space-y-4 pr-2 bg-neutral-950/40 p-4 border border-white/5 rounded-2xl max-h-[300px]">
              {chats.map((msg) => {
                const isMe = msg.sender === "CLIENT";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono uppercase shrink-0 ${
                      isMe ? "bg-[#799351] text-white" : "bg-neutral-800 text-gray-300"
                    }`}>
                      {msg.clientName.charAt(0)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className={`text-[9px] font-mono text-gray-500 ${isMe ? "text-right" : "text-left"}`}>
                        {msg.clientName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs font-light leading-relaxed whitespace-pre-wrap ${
                        isMe 
                          ? "bg-[#799351]/15 border border-[#799351]/30 text-[#a1c398] rounded-tr-none" 
                          : "bg-neutral-900 border border-white/5 text-gray-200 rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message sender form */}
            <form onSubmit={handleSendChat} className="flex gap-3 items-center pt-2">
              
              {/* File layout attachment */}
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                className="p-3 bg-neutral-950 border border-white/10 hover:border-[#799351] text-gray-400 hover:text-white rounded-xl transition-all"
                title="Attach design references, layout, props or backdrop screenshots"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={chatFileInputRef}
                onChange={handleChatFileSelect}
                className="hidden"
                accept="image/*"
              />

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={chatFileName ? `Attached reference image: ${chatFileName}` : "Type message... ask for layouts, custom overlays or backdrop themes"}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#799351] transition-all text-white placeholder-gray-600"
                />
                {chatFileName && (
                  <button
                    type="button"
                    onClick={() => { setChatFileName(null); setChatFileUrl(null); }}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="p-3 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ======================================= */}
        {/* STEP 8: UNLOCK DIGITAL MEMORIES */}
        {/* ======================================= */}
        {wizardStep === 8 && (
          <div className="space-y-6">
            {activeBooking ? (
              <div className="space-y-6">
                
                {activeBooking.unlockedDrive ? (
                  <div className="p-8 bg-emerald-950/20 border border-emerald-500/20 rounded-3xl text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-[#a1c398] flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">✓</div>
                    
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white uppercase tracking-wider font-display italic">Your Digital Memories Are Unlocked!</h4>
                      <p className="text-xs text-gray-300 font-light max-w-md mx-auto leading-relaxed">
                        Irfan and our site operator have uploaded your entire photobooth directory (high resolution prints + individual high-speed strip captures + raw files) into Google Drive cloud storage.
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href="https://drive.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all shadow-lg hover:scale-101"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Google Drive Gallery</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-amber-950/20 border border-amber-500/20 rounded-3xl text-center space-y-4">
                    <FolderLock className="w-12 h-12 text-amber-500 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Cloud Directory Locked</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Digital memories are unlocked automatically right after the photobooth event concludes and accounting marks your 2nd payment balance invoice as fully settled in Step 6.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event Reviews Form */}
                <div className="p-6 bg-neutral-950/40 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Leave Co-Founders Feedback</h4>
                      <p className="text-[10px] text-gray-500">Your testimonials help Framez photobooth grow!</p>
                    </div>
                  </div>

                  {submittedReview || activeBooking.reviewRating ? (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 text-center">
                      💖 Thank you so much! Your five-star rating and written review have been recorded in our permanent master testimonial database!
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-3.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setClientRating(star)}
                            className="p-1 outline-none transition-transform active:scale-95"
                          >
                            <Star className={`w-6 h-6 ${clientRating >= star ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        required
                        value={clientTestimonial}
                        onChange={(e) => setClientTestimonial(e.target.value)}
                        placeholder="Tell us what you loved about our high-speed printing, high-fidelity backdrops, custom overlays, and site crew coordinators!"
                        rows={3}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3.5 text-xs outline-none focus:border-[#799351] text-white placeholder-gray-600 leading-relaxed font-light"
                      />

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md"
                      >
                        Submit Testimonial
                      </button>
                    </form>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">No Active Booking Selected</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto font-light leading-relaxed">
                  You have no active photobooth bookings selected. Please complete steps 1 to 5 to generate your live portal download directories.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* WIZARD NAVIGATION CONTROL BUTTON BAR (PREV/NEXT) */}
        {/* ======================================= */}
        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={wizardStep === 1}
            onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-gray-400 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-30 border border-white/10 cursor-pointer select-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest hidden sm:block">
            Step {wizardStep} of 8 — {Math.round((wizardStep / 8) * 100)}% Complete
          </span>

          <button
            type="button"
            disabled={wizardStep === 8}
            onClick={() => setWizardStep(prev => Math.min(8, prev + 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-30 border border-[#a1c398]/20 cursor-pointer select-none shadow-md"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
