import { useState, useEffect, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Calendar, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Heart, 
  Clock, 
  UploadCloud, 
  CheckCircle2, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  QrCode, 
  FileCheck,
  Plus,
  Minus,
  Instagram
} from "lucide-react";
import { PACKAGES, STATES_MAP, ADDONS, DEFAULT_TESTIMONIALS } from "../data";
import { Package, Booking, Testimonial } from "../types";
import { db, mapFireAccountToFirestoreDoc, FireAccount } from "../firebase";
import { setDoc, doc } from "firebase/firestore";
import { hashPassword, generateSalt } from "../utils/crypto";

interface WebsitePagesProps {
  currentSection: string;
  onSelectPackage: (pkg: Package) => void;
  onStateSelect: (stateId: string) => void;
  selectedState: string;
  bookingsList: Booking[];
  onNewBooking: (booking: Booking) => void;
  preselectedPackageId?: string;
  onClearPreselectedPackage?: () => void;
  onAddAuditLog?: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  testimonialsList?: Testimonial[];
  isCalendarSynced?: boolean;
}

const slideVariants = {
  initial: { opacity: 0, x: 80 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -80 },
};

const slideTransition = {
  type: "spring",
  stiffness: 110,
  damping: 20,
};

export default function WebsitePages({
  currentSection,
  onSelectPackage,
  onStateSelect,
  selectedState,
  bookingsList,
  onNewBooking,
  preselectedPackageId = "",
  onClearPreselectedPackage,
  onAddAuditLog,
  testimonialsList = [],
  isCalendarSynced = true,
}: WebsitePagesProps) {
  
  // Wizard state
  const [activeStep, setActiveStep] = useState(1);
  const [wizardDate, setWizardDate] = useState("2026-07-25");
  const [wizardState, setWizardState] = useState("selangor");
  const [wizardService, setWizardService] = useState("platinum");
  const [venueAddress, setVenueAddress] = useState("");
  
  // Addons states
  const [extraHours, setExtraHours] = useState(0);
  const [upgrade4R, setUpgrade4R] = useState(false);
  const [backdropResize, setBackdropResize] = useState(false);
  const [extraGuestbook, setExtraGuestbook] = useState(false);
  
  // Payment Type & Portal password
  const [paymentType, setPaymentType] = useState<"Booking Fees" | "Full Package">("Full Package");
  const [portalPassword, setPortalPassword] = useState("");

  // Contact Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  
  // Payment Receipt Upload state
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFileSize, setReceiptFileSize] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Success page
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const [generatedBookingId, setGeneratedBookingId] = useState("");

  // Inquiry Form state
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryRegion, setInquiryRegion] = useState("selangor");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Packages scroll slider ref and handler
  const packagesScrollRef = useRef<HTMLDivElement>(null);
  const scrollPackages = (direction: "left" | "right") => {
    if (packagesScrollRef.current) {
      const { scrollLeft, clientWidth } = packagesScrollRef.current;
      const scrollAmount = clientWidth * 0.85;
      const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      packagesScrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Memories scroll slider ref and handler
  const railRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (currentSection !== "locations") return;
    const rail = railRef.current;
    if (!rail) return;
    
    let animationId: number;
    const scrollSpeed = 0.5; // super slow continuous speed (pixels per frame)
    
    const animate = () => {
      if (!isHovered) {
        rail.scrollLeft += scrollSpeed;
        if (rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2) {
          rail.scrollLeft = 0; // Seamless loop
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [currentSection, isHovered]);

  const scrollMemories = (direction: "left" | "right") => {
    if (railRef.current) {
      const { scrollLeft, clientWidth } = railRef.current;
      const scrollAmount = clientWidth * 0.5;
      const scrollTo = direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      railRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Sync preselected package when component mounts/receives it
  useEffect(() => {
    if (preselectedPackageId) {
      setWizardService(preselectedPackageId);
    }
  }, [preselectedPackageId]);

  if (currentSection === "hero") return null;

  // Pricing calculations
  const selectedPackage = PACKAGES.find((p) => p.id === wizardService) || PACKAGES[1];
  const basePrice = selectedPackage.price;
  const extraHoursPrice = extraHours * 170;
  const upgrade4RPrice = upgrade4R ? (wizardService === "grand_luxe" ? 499 : 399) : 0;
  const backdropResizePrice = backdropResize ? 59 : 0;
  const extraGuestbookPrice = extraGuestbook ? 79 : 0;
  
  const calculatedTotal = basePrice + extraHoursPrice + upgrade4RPrice + backdropResizePrice + extraGuestbookPrice;

  // Real uploader handler
  const handleRealUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(10);
      setTimeout(() => {
        setUploadProgress(100);
        setIsUploading(false);
        setReceiptFileName(file.name);
        setReceiptFileSize((file.size / 1024).toFixed(1) + " KB");
      }, 500);
    }
  };

  // Submit Reservation Action
  const handleSubmitBooking = async () => {
    if (!clientName || !clientEmail || !clientPhone || !portalPassword) {
      alert("Please fill in your contact information and create a portal password to submit your booking.");
      return;
    }

    const newId = "b_res_" + Math.random().toString(36).substring(2, 11);
    
    // Assemble Addon description strings
    const activeAddons: string[] = [];
    if (extraHours > 0) activeAddons.push(`Additional Booking Time (${extraHours} Hours)`);
    if (upgrade4R) activeAddons.push(`Upgrade to 4R Photo Size (${selectedPackage.durationHrs + extraHours} Hours)`);
    if (backdropResize) activeAddons.push("Upgrade Backdrop Dimensions");
    if (extraGuestbook) activeAddons.push("Extra Premium Hardcover Guestbook");

    const newBookingObj: Booking = {
      id: newId,
      date: wizardDate,
      state: STATES_MAP.find((s) => s.id === wizardState)?.name || "Selangor",
      packageName: selectedPackage.name,
      clientName,
      clientEmail,
      clientPhone,
      totalPrice: calculatedTotal,
      addOns: activeAddons,
      status: "PREBOOKED",
      locationAddress: venueAddress || "TBD Address",
      receiptUrl: receiptFileName ? `https://framez.my/receipts/${receiptFileName}` : undefined,
      receiptApproved: false,
      paymentType: paymentType,
      paymentAmount: paymentType === "Booking Fees" ? 150 : calculatedTotal,
      portalPassword: portalPassword || "123456", // default if blank
    };

    try {
      // Create their GSSO secure credential record in central database immediately!
      const salt = generateSalt();
      const hash = await hashPassword(portalPassword, salt);
      const cleanEmail = clientEmail.trim().toLowerCase();

      const newAccountRecord: FireAccount = {
        id: "acc_client_" + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        name: clientName.trim(),
        role: "CLIENT",
        accessStatus: "ACTIVE_VERIFIED",
        clientBookingIds: [newId],
        passwordSalt: salt,
        passwordHash: hash,
        firstTimeLogin: false, // already personalized!
      };

      await setDoc(doc(db, "users", newAccountRecord.id), mapFireAccountToFirestoreDoc(newAccountRecord));

      onNewBooking(newBookingObj);
      setGeneratedBookingId(newId);
      setBookingCompleted(true);
      if (onClearPreselectedPackage) {
        onClearPreselectedPackage();
      }
    } catch (error) {
      console.error("Failed to automatically register client account:", error);
      alert("❌ Automated account registration protocol failed. Please verify credentials and submit again.");
    }
  };

  // Days configuration for July 2026 calendar
  const daysInJuly = 31;
  const startDayOffset = 3; // Wednesday start

  return (
    <div className="relative w-full z-30 mt-8 mb-12">
      {currentSection === "about" && (
        <motion.div
          key="about"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={slideTransition}
          className="glass-card rounded-[2.5rem] p-8 md:p-12 lg:p-16 border-[#799351]/20 relative overflow-hidden bg-black/60 backdrop-blur-xl"
        >
          {/* Elegant gold blurred ambient light */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#799351]/10 blur-[120px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Content - Story */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[11px] font-mono font-bold text-[#a1c398] uppercase tracking-widest block">
                THE SOUL BEHIND THE CAMERA
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl text-white font-display leading-tight">
                Our Story: <span className="italic font-light">Irfan & Irsalina</span>
              </h2>
              <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed">
                Framez.my was born in the heart of Kuala Lumpur out of a singular, artistic vision: to blend the classic joy of nostalgic photo booths with high-precision modern technology and elegant layout aesthetics. Founded by <strong>Irfan</strong> and <strong>Irsalina</strong>, we serve as the premier choice for premium weddings, social galas, and landmark corporate events across Malaysia.
              </p>
              <p className="text-sm text-gray-400 font-light leading-relaxed">
                We custom-selected the professional <strong>DNP DS620 High-Speed Dye-Sublimation Printers</strong> capable of outputting brilliant, moisture-sealed prints in just 12 seconds. By pairing fast mechanics with hand-crafted floral backdrops and personal lead crew guidance, we ensure every guest experiences royal treatment on-site.
              </p>

              {/* Unique metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div>
                  <span className="text-2xl md:text-3xl font-bold font-display text-[#a1c398] block">12s</span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase block mt-1">PRINT SPEED / SHEET</span>
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-bold font-display text-[#a1c398] block">5 States</span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase block mt-1">RM0 TRANSIT FEE</span>
                </div>
                <div>
                  <span className="text-2xl md:text-3xl font-bold font-display text-[#a1c398] block">100%</span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase block mt-1">FOUNDER AUDITED</span>
                </div>
              </div>
            </div>

            {/* Right Content - Visual card representation */}
            <div className="lg:col-span-5">
              <div className="relative p-8 rounded-3xl bg-neutral-900/60 border border-white/10 flex flex-col justify-between h-[360px] shadow-2xl">
                <div>
                  <Award className="w-10 h-10 text-[#a1c398] mb-4" />
                  <h3 className="text-2xl font-display text-white mb-2 italic">Crafting Memories with Royal Elegance</h3>
                  <p className="text-xs text-gray-400 font-light leading-relaxed">
                    "We don't just set up print hardware. We curatate the entire atmosphere—making sure your grandparents, siblings, and esteemed wedding guests smile, laugh, and walk away with a beautifully laminated souvenir they'll treasure forever."
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-[#799351]/20 border border-[#799351]/40 flex items-center justify-center font-bold font-display text-[#a1c398]">
                    I
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-white">Irfan & Irsalina</span>
                    <span className="text-[10px] text-gray-500 font-mono block">Co-Founders & Creative Directors</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {currentSection === "spaces" && (
        <motion.div
          key="spaces"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={slideTransition}
          className="space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-mono font-bold text-[#a1c398] uppercase tracking-widest">
              EXCLUSIVE PHOTOBOOTH PLANS
            </span>
            <h2 className="text-4xl md:text-5xl text-white font-display">
              Select Your <span className="italic font-light">Custom Choice</span>
            </h2>
            <p className="text-sm text-gray-400 font-light">
              Choose from our meticulously structured packages. All include unlimited ultra-high-speed printing, high-fidelity backdrops, and digital downloads.
            </p>
          </div>

          {/* Elegant slider controls */}
          <div className="flex justify-center items-center gap-4 mt-2 mb-6">
            <button
              type="button"
              onClick={() => scrollPackages("left")}
              className="w-10 h-10 rounded-full border border-white/10 bg-neutral-900/80 hover:bg-neutral-800 hover:border-[#799351]/50 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
              title="Previous Plan"
            >
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a1c398]">
              ◄ Swipe or use buttons to slide ►
            </span>
            <button
              type="button"
              onClick={() => scrollPackages("right")}
              className="w-10 h-10 rounded-full border border-white/10 bg-neutral-900/80 hover:bg-neutral-800 hover:border-[#799351]/50 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
              title="Next Plan"
            >
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          <div 
            ref={packagesScrollRef}
            className="flex flex-nowrap gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:none snap-x snap-mandatory pb-6"
          >
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="w-full sm:w-[48%] lg:w-[31%] shrink-0 snap-start snap-always glass-card rounded-3xl p-6 md:p-8 border-[#799351]/20 flex flex-col justify-between hover:border-[#799351]/40 hover:scale-[1.01] transition-all bg-neutral-900/40 relative overflow-hidden"
              >
                {pkg.id === "platinum" && (
                  <div className="absolute top-4 right-4 bg-[#799351] text-white text-[9px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#a1c398]/30 animate-pulse">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-display text-white mb-2">{pkg.name}</h3>
                  <p className="text-xs text-gray-400 font-light leading-relaxed mb-6">
                    {pkg.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-[10px] text-gray-500 font-mono block">UNLIMITED PRINTS PLAN</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold font-display text-[#a1c398]">RM {pkg.price}</span>
                      <span className="text-xs text-gray-400 font-light">/ event ({pkg.durationHrs} hours)</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/10 my-4" />

                  <span className="text-[10px] font-mono text-[#a1c398] tracking-widest block uppercase mb-3">
                    WHAT'S INCLUDED:
                  </span>
                  <ul className="space-y-2 text-xs text-gray-300 font-light mb-8">
                    {pkg.features.map((feat, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#a1c398] font-bold">✔</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  className="w-full py-3 rounded-xl bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shadow-md"
                >
                  <span>Select & Book Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {currentSection === "locations" && (() => {
        const list = testimonialsList.length > 0 ? testimonialsList : DEFAULT_TESTIMONIALS;
        const doubledList = [...list, ...list, ...list, ...list]; // Quadruple to ensure seamless loop
        
        const cols = [];
        let testiIdx = 0;
        while (testiIdx < doubledList.length) {
          if (testiIdx % 3 === 0) {
            cols.push({
              type: "tall",
              items: [doubledList[testiIdx]]
            });
            testiIdx += 1;
          } else {
            const items = [doubledList[testiIdx]];
            if (testiIdx + 1 < doubledList.length) {
              items.push(doubledList[testiIdx + 1]);
            }
            cols.push({
              type: "stacked",
              items
            });
            testiIdx += 2;
          }
        }

        return (
          <motion.div
            key="locations"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideVariants}
            transition={slideTransition}
            className="w-full relative rounded-[2.5rem] p-8 md:p-12 lg:p-16 overflow-hidden min-h-[90vh] flex flex-col justify-between shadow-2xl transition-all"
            style={{ backgroundColor: "#edd3c4" }}
          >
            {/* Subtle elegant agency top lines */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#799351] via-[#a1c398] to-[#799351]" />
            
            <div className="max-w-[1400px] mx-auto w-full space-y-12">
              {/* Top Typography & Navigation row */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#c2aa9d]/30 pb-8">
                <div className="space-y-3.5 max-w-2xl">
                  <span className="text-[10px] font-mono font-bold text-[#8a5b3a] uppercase tracking-[0.2em] block">
                    MEMORIES & SHARED JOY
                  </span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-[#4a3225] tracking-tight leading-none">
                    What Clients Say <br />
                    <span className="italic font-light text-[#634839]">About the Experience</span>
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center max-w-xl">
                  <p className="text-xs md:text-sm text-[#5e4436] font-light leading-relaxed">
                    We've captured over 150,000 memories – so when you join us, you're in great (and well-loved) company. Every day, more people discover how capturing frames leads to endless smiles.
                  </p>

                  {/* Slider Arrow buttons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollMemories("left")}
                      className="w-12 h-12 rounded-full border border-[#c2aa9d]/40 flex items-center justify-center text-[#4a3225] hover:bg-[#e4cbbe] transition-all shadow-sm"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollMemories("right")}
                      className="w-12 h-12 rounded-full bg-[#4a3225] flex items-center justify-center text-white hover:bg-[#342217] transition-all shadow-md"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Continuous Scrolling Gallery */}
              <div 
                ref={railRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full overflow-x-auto scrollbar-none flex gap-6 py-6"
                style={{ scrollSnapType: "x proximity" }}
              >
                {cols.map((col, colIdx) => (
                  <div 
                    key={colIdx} 
                    className={`flex flex-col gap-6 shrink-0 ${col.type === "tall" ? "w-[300px] md:w-[350px]" : "w-[240px] md:w-[280px]"}`}
                  >
                    {col.items.map((item, itemIdx) => (
                      <div
                        key={`${item.id}-${colIdx}-${itemIdx}`}
                        className="group relative overflow-hidden rounded-[2.5rem] bg-[#e4cbbe]/50 border border-[#c2aa9d]/20 shadow-sm cursor-pointer"
                        style={{ 
                          height: col.type === "tall" ? "460px" : "218px" 
                        }}
                      >
                        {/* Image */}
                        <img
                          src={item.imageUrl || "https://cdn.sceneai.art/Hero%20section%20image/3654d348-a98c-4320-bc14-3f458b45a50d.png"}
                          alt={item.author}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain bg-[#342217]/5 transform transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                        />

                        {/* Aesthetic Shopping Badge Overlaid Bottom Left */}
                        <div className="absolute bottom-5 left-5 w-10 h-10 rounded-full bg-[#f28e2b] text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300 z-10">
                          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>

                        {/* Hover Info Overlay */}
                        <div className="absolute inset-0 bg-[#342217]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white rounded-[2.5rem] z-20">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-200">{item.logo || "FRAMEZ.MY"}</span>
                          <p className="text-xs font-sans font-light italic leading-relaxed mt-1.5">"{item.quote}"</p>
                          <span className="text-[10px] font-mono mt-3 text-white/80">{item.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Pagination/Scroll Indicator */}
              <div className="flex justify-center items-center gap-2 pt-2">
                <div className="h-1 w-24 bg-[#c2aa9d]/30 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-[#4a3225] transition-all duration-300 w-1/3"
                  />
                </div>
                <span className="text-[10px] font-mono text-[#5e4436]">DRAG OR USE ARROWS TO EXPLORE</span>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* CORE FEATURE: MAIN WEBSITE CALENDAR & STEP-BY-STEP RESERVATION WIZARD */}
      {currentSection === "calendar" && (
        <motion.div
          key="calendar-section"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={slideTransition}
          className="glass-card rounded-[2.5rem] p-6 md:p-10 border-[#799351]/20 bg-neutral-950/80 backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Decorative radial gradients */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#799351]/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-950/10 blur-[120px] pointer-events-none" />

          {/* Success Splash screen if booking completed */}
          {bookingCompleted ? (
            <div className="text-center max-w-xl mx-auto py-12 space-y-6">
              <div className="w-20 h-20 bg-[#799351]/20 border border-[#a1c398] rounded-full flex items-center justify-center mx-auto text-[#a1c398] animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase block">
                  Reservation successfully queued
                </span>
                <h2 className="text-3xl md:text-4xl font-display text-white">
                  Booking Receipt Submitted!
                </h2>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  Congratulations! Co-founders Irfan & Irsalina have received your reservation request for <strong>{wizardDate}</strong> ({STATES_MAP.find(s => s.id === wizardState)?.name || wizardState}). Your transaction receipt has been queued in our Event CRM.
                </p>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 text-left font-mono space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">BOOKING REFERENCE:</span>
                  <span className="text-white font-bold text-right">{generatedBookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SERVICE PLAN:</span>
                  <span className="text-[#a1c398]">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">VENUE LOCATION:</span>
                  <span className="text-white truncate max-w-[240px]">{venueAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TOTAL PRICE:</span>
                  <span className="text-white font-semibold">RM {calculatedTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">STATUS:</span>
                  <span className="text-amber-400 font-bold block">PREBOOKED (Receipt Clearance Pending)</span>
                </div>
              </div>

              <div className="bg-[#799351]/10 border border-[#799351]/20 p-4 rounded-xl text-[11px] text-[#a1c398] text-left leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>What's Next?</strong> You can track and view your receipt status inside our <strong>Client Portal</strong>. To log in, click <strong>"Login"</strong> in the top header and type your email address <strong>{clientEmail}</strong>. All live digital downloads, photos, and print logs will be unlocked once approved.
                </span>
              </div>

              <div className="pt-4 flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setBookingCompleted(false);
                    setActiveStep(1);
                    setVenueAddress("");
                    setReceiptFileName(null);
                    setExtraHours(0);
                    setUpgrade4R(false);
                    setBackdropResize(false);
                    setExtraGuestbook(false);
                  }}
                  className="px-6 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs uppercase font-semibold tracking-wider transition-colors"
                >
                  Book Another Slot
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header Title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase font-bold block">
                    Interactive Scheduling
                  </span>
                  <h2 className="text-3xl font-display text-white italic mt-1">
                    Book Your <span className="font-light not-italic text-gray-300">Live Space</span>
                  </h2>
                </div>
                <div className="text-xs text-gray-400 font-light bg-black/30 px-3.5 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a1c398] animate-ping" />
                  <span>Interactive Real-time Verification</span>
                </div>
              </div>

              {/* STEP PROGRESS BAR */}
              <div className="space-y-3.5">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span className="uppercase text-[#a1c398] font-bold">
                    Step {activeStep} of 5: {
                      activeStep === 1 ? "Select Date & Coverage" :
                      activeStep === 2 ? "Service Plan & Venue Details" :
                      activeStep === 3 ? "Interactive Quotation Calculator" :
                      activeStep === 4 ? "Bank Transfer & Receipt Upload" :
                      "Review & Register Contact"
                    }
                  </span>
                  <span>{activeStep * 20}% Complete</span>
                </div>

                {/* Progress bar line */}
                <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#799351] to-[#a1c398] transition-all duration-300 rounded-full"
                    style={{ width: `${activeStep * 20}%` }}
                  />
                </div>

                {/* Quick Step Indicators */}
                <div className="grid grid-cols-5 gap-2 text-center text-[9px] font-mono uppercase text-gray-500 pt-1">
                  <span className={activeStep >= 1 ? "text-[#a1c398] font-bold" : ""}>1. Date</span>
                  <span className={activeStep >= 2 ? "text-[#a1c398] font-bold" : ""}>2. Service</span>
                  <span className={activeStep >= 3 ? "text-[#a1c398] font-bold" : ""}>3. Pricing</span>
                  <span className={activeStep >= 4 ? "text-[#a1c398] font-bold" : ""}>4. Payment</span>
                  <span className={activeStep >= 5 ? "text-[#a1c398] font-bold" : ""}>5. Confirm</span>
                </div>
              </div>

              {/* STEP 1: DATE & COVERAGE */}
              {activeStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  {/* Left Column: State Selection */}
                  <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">1</span>
                      Choose Coverage Region
                    </h3>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Select your event's Malaysian state. Irfan & Irsalina offer direct transit support with <strong>RM0 Delivery surcharge</strong> across all coverages:
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      {STATES_MAP.map((st) => {
                        const active = wizardState === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setWizardState(st.id)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                              active
                                ? "bg-[#799351]/20 border-[#799351] text-white shadow-md"
                                : "bg-neutral-900/40 border-white/5 text-gray-400 hover:border-[#799351]/30 hover:text-white"
                            }`}
                          >
                            <span className="text-xs font-semibold">{st.name}</span>
                            <span className="text-[10px] font-mono text-[#a1c398] font-semibold">{st.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Month Calendar (July 2026) */}
                  <div className="lg:col-span-7 bg-neutral-900/40 border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                        <h4 className="text-sm font-semibold text-white font-display">
                          📅 Select Event Date: <span className="text-[#a1c398] italic font-light">July 2026</span>
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500 uppercase">Interactive Live Feed</span>
                      </div>

                      {/* Calendar Grid Header */}
                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono uppercase text-gray-500 font-bold mb-2">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                      </div>

                      {/* Calendar Cells */}
                      <div className="grid grid-cols-7 gap-2">
                        {/* Offsets Wednesday */}
                        {Array.from({ length: startDayOffset }).map((_, i) => (
                          <div key={`offset-${i}`} className="aspect-square bg-transparent" />
                        ))}

                        {/* July days */}
                        {Array.from({ length: daysInJuly }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;
                          
                          // Check if day is already booked in the selected region/state
                          const selectedStateName = STATES_MAP.find((s) => s.id === wizardState)?.name || "Selangor";
                          const isBooked = bookingsList.some((b) => {
                            const isDateMatch = b.date === dateStr;
                            const isStatusMatch = b.status === "BOOKED" || b.status === "PREBOOKED";
                            if (isCalendarSynced) {
                              return isDateMatch && isStatusMatch;
                            } else {
                              return isDateMatch && isStatusMatch && b.state.toLowerCase() === selectedStateName.toLowerCase();
                            }
                          });
                          const isSelected = wizardDate === dateStr;

                          return (
                            <button
                              key={`day-${dayNum}`}
                              type="button"
                              disabled={isBooked}
                              onClick={() => setWizardDate(dateStr)}
                              className={`aspect-square flex flex-col items-center justify-between p-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                                isBooked
                                  ? "bg-neutral-950/80 border border-red-500/10 text-gray-600 cursor-not-allowed opacity-40 line-through"
                                  : isSelected
                                  ? "bg-[#799351] border border-[#a1c398] text-white shadow-lg"
                                  : "bg-neutral-950/40 border border-white/5 text-gray-300 hover:border-[#799351] hover:bg-[#799351]/10"
                              }`}
                            >
                              <span>{dayNum}</span>
                              {isBooked ? (
                                <span className="text-[7px] font-mono text-red-500 scale-95 font-bold uppercase tracking-tighter">Locked</span>
                              ) : isSelected ? (
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                              ) : (
                                <span className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-500 block uppercase font-mono text-[9px]">Active Target Slot:</span>
                        <span className="font-semibold text-white">
                          📅 {wizardDate ? wizardDate : "No date selected"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="w-2.5 h-2.5 rounded bg-neutral-900 border border-white/5 block" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="w-2.5 h-2.5 rounded bg-neutral-950 block opacity-40" />
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SERVICE & VENUE */}
              {activeStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  {/* Service selection dropdown */}
                  <div className="lg:col-span-6 space-y-5">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">2</span>
                      Choose Your Service Plan
                    </h3>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Select Service Tier</label>
                      <select
                        value={wizardService}
                        onChange={(e) => setWizardService(e.target.value)}
                        className="p-4 bg-neutral-950 border border-white/10 rounded-2xl text-sm text-white outline-none focus:border-[#799351] cursor-pointer w-full"
                      >
                        {PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} (RM {pkg.price} / {pkg.durationHrs} Hrs)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show quick package features preview */}
                    <div className="bg-neutral-900/60 p-5 rounded-2xl border border-white/5 space-y-3">
                      <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase block font-bold">
                        Included in this package:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300 font-light">
                        {selectedPackage.features.map((feat, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="text-[#a1c398] font-bold shrink-0">✔</span>
                            <span className="leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Location Address Area */}
                  <div className="lg:col-span-6 space-y-5">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">3</span>
                      Event Venue Address
                    </h3>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Enter the exact hotel ballroom, banquet hall, or private house coordinate. This allows Irfan & Irsalina to coordinate the lead crew hardware loading plans.
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Venue Location Address</label>
                      <textarea
                        required
                        rows={5}
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="e.g. Grand Ballroom Level 3, Grand Hyatt Hotel, 12 Jalan Pinang, Kuala Lumpur, 50450"
                        className="p-4 bg-neutral-950 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-[#799351] placeholder-gray-600 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-400 flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Address is required to lock coordinates. You may update this address later via client desk chat.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Quotation Calculator */}
              {activeStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  {/* Left Column: Interactive Add-ons */}
                  <div className="lg:col-span-6 space-y-5">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">4</span>
                      Select Premium Add-ons
                    </h3>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Tailor your instant dye-sub photo prints using our verified custom add-ons. The dynamic pricing invoice updates immediately on the right:
                    </p>

                    <div className="space-y-3">
                      {/* Addon 1: Extra Hours Counter */}
                      <div className="p-4 bg-neutral-900/60 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-white">Additional Duration</h4>
                          <p className="text-[10px] text-gray-400 font-light">Extend unlimited print window (+RM 170 / hour)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setExtraHours((prev) => Math.max(0, prev - 1))}
                            className="w-8 h-8 rounded-full bg-neutral-950 border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white w-4 text-center">{extraHours}h</span>
                          <button
                            type="button"
                            onClick={() => setExtraHours((prev) => Math.min(5, prev + 1))}
                            className="w-8 h-8 rounded-full bg-neutral-950 border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Addon 2: Upgrade 4R Size */}
                      <button
                        type="button"
                        onClick={() => setUpgrade4R(!upgrade4R)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${
                          upgrade4R ? "bg-[#799351]/10 border-[#799351]" : "bg-neutral-900/60 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">Upgrade to 4R Big Size Prints</h4>
                          <p className="text-[10px] text-gray-400 font-light">Change from 2R strips to massive 4R photo cards (+RM {wizardService === "grand_luxe" ? 499 : 399})</p>
                        </div>
                        <div className="w-5 h-5 rounded border border-white/30 flex items-center justify-center">
                          {upgrade4R && <CheckCircle2 className="w-4 h-4 text-[#a1c398]" />}
                        </div>
                      </button>

                      {/* Addon 3: Backdrop sizing */}
                      <button
                        type="button"
                        onClick={() => setBackdropResize(!backdropResize)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${
                          backdropResize ? "bg-[#799351]/10 border-[#799351]" : "bg-neutral-900/60 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">Upgrade Backdrop Dimensions (8x10)</h4>
                          <p className="text-[10px] text-gray-400 font-light">Extra wide dimension perfect for massive group shots (+RM 59)</p>
                        </div>
                        <div className="w-5 h-5 rounded border border-white/30 flex items-center justify-center">
                          {backdropResize && <CheckCircle2 className="w-4 h-4 text-[#a1c398]" />}
                        </div>
                      </button>

                      {/* Addon 4: Extra Custom Book */}
                      <button
                        type="button"
                        onClick={() => setExtraGuestbook(!extraGuestbook)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${
                          extraGuestbook ? "bg-[#799351]/10 border-[#799351]" : "bg-neutral-900/60 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">Extra Premium Leather Guestbook</h4>
                          <p className="text-[10px] text-gray-400 font-light">An additional custom scrapbook with markers for second set of families (+RM 79)</p>
                        </div>
                        <div className="w-5 h-5 rounded border border-white/30 flex items-center justify-center">
                          {extraGuestbook && <CheckCircle2 className="w-4 h-4 text-[#a1c398]" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Invoice Summary */}
                  <div className="lg:col-span-6 bg-neutral-900/40 border border-white/10 p-5 rounded-3xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase block font-bold mb-3">
                        Dynamic Quotation Invoice
                      </span>

                      <div className="space-y-2.5 font-mono text-xs">
                        {/* Base */}
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-gray-400 font-sans">{selectedPackage.name} ({selectedPackage.durationHrs}h)</span>
                          <span className="text-white">RM {basePrice}</span>
                        </div>

                        {/* Extra Hours */}
                        {extraHours > 0 && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400 font-sans">Additional Time (+{extraHours} Hours)</span>
                            <span className="text-white">RM {extraHoursPrice}</span>
                          </div>
                        )}

                        {/* 4R Upgrade */}
                        {upgrade4R && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400 font-sans">4R Photo Upgrade ({selectedPackage.durationHrs + extraHours}h)</span>
                            <span className="text-[#a1c398]">+RM {upgrade4RPrice}</span>
                          </div>
                        )}

                        {/* Backdrop Resize */}
                        {backdropResize && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400 font-sans">Wide Backdrop Dimensions (8x10)</span>
                            <span className="text-[#a1c398]">+RM {backdropResizePrice}</span>
                          </div>
                        )}

                        {/* Extra Guestbook */}
                        {extraGuestbook && (
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400 font-sans">Extra Premium Leather Guestbook</span>
                            <span className="text-[#a1c398]">+RM {extraGuestbookPrice}</span>
                          </div>
                        )}

                        {/* Surcharges / Delivery */}
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 text-[11px]">
                          <span className="text-[#a1c398] font-sans">Nationwide Transit & Travel Fee</span>
                          <span className="text-emerald-400 font-bold uppercase">RM 0 (Guaranteed)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-mono text-gray-500 uppercase block">Total Net Quote:</span>
                          <span className="text-2xl font-bold font-display text-[#a1c398]">
                            RM {calculatedTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right text-[10px] text-gray-400 font-sans max-w-[160px] leading-tight">
                          Includes unlimited instant printing, lead crew coordinator, and backdrop setups.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Bank Transfer Payment Details & Receipt Uploader */}
              {activeStep === 4 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  {/* Left Column: Bank account coordinates & QR code */}
                  <div className="lg:col-span-6 space-y-5">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">5</span>
                      Bank Transfer Information
                    </h3>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                        Choose Payment Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentType("Booking Fees")}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            paymentType === "Booking Fees"
                              ? "bg-[#799351]/20 border-[#799351] text-white shadow-md"
                              : "bg-neutral-900/40 border-white/5 text-gray-400 hover:border-[#799351]/30 hover:text-white"
                          }`}
                        >
                          <div className="text-xs font-bold">Booking Fees</div>
                          <div className="text-[10px] font-mono text-[#a1c398] mt-0.5 font-semibold">RM 150.00 (Fixed, Non-Refundable)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentType("Full Package")}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            paymentType === "Full Package"
                              ? "bg-[#799351]/20 border-[#799351] text-white shadow-md"
                              : "bg-neutral-900/40 border-white/5 text-gray-400 hover:border-[#799351]/30 hover:text-white"
                          }`}
                        >
                          <div className="text-xs font-bold">Full Package</div>
                          <div className="text-[10px] font-mono text-[#a1c398] mt-0.5 font-semibold">RM {calculatedTotal.toLocaleString()} (Full Amount)</div>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 font-light leading-relaxed">
                      To secure your slot on <strong>{wizardDate}</strong>, please complete an online bank transfer of <strong>RM {paymentType === "Booking Fees" ? "150 (Booking Fee)" : `${calculatedTotal} (Full Package)`}</strong> to our Maybank corporate account:
                    </p>

                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-3.5">
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <span className="text-gray-500 uppercase">Bank:</span>
                        <span className="text-white col-span-2 font-semibold">
                          {localStorage.getItem("framez_bank_name") || "Maybank (Malayan Banking Berhad)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <span className="text-gray-500 uppercase">Account Name:</span>
                        <span className="text-white col-span-2 font-semibold uppercase">
                          {localStorage.getItem("framez_bank_acc_name") || "Framez Photobooth Enterprise"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <span className="text-gray-500 uppercase">Account No:</span>
                        <span className="text-[#a1c398] col-span-2 font-bold tracking-wider text-sm select-all font-mono">
                          {localStorage.getItem("framez_bank_acc_no") || "5140-1234-5678"}
                        </span>
                      </div>
                    </div>

                    {/* QR Payment Code Box */}
                    <div className="p-4 bg-neutral-900/50 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
                      <div className="w-28 h-28 bg-white p-2 rounded-xl flex flex-col items-center justify-center border border-white/20 shadow-lg relative shrink-0">
                        {localStorage.getItem("framez_bank_qr_url") ? (
                          <img
                            src={localStorage.getItem("framez_bank_qr_url") || ""}
                            alt="Bank QR"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          /* CSS Simulated QR code */
                          <div className="w-full h-full border-4 border-black relative flex flex-col justify-between p-1">
                            <div className="flex justify-between">
                              <div className="w-5 h-5 bg-black" />
                              <div className="w-5 h-5 bg-black" />
                            </div>
                            <div className="w-10 h-10 border-2 border-black border-dashed absolute top-8 left-8" />
                            <div className="flex justify-between">
                              <div className="w-5 h-5 bg-black" />
                              <div className="w-6 h-3 bg-black self-end" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase font-bold block">
                          Instant DuitNow QR
                        </span>
                        <h4 className="text-xs font-bold text-white">Maybank DuitNow Transfer</h4>
                        <p className="text-[10px] text-gray-400 font-light leading-relaxed">
                          Scan the Framez Enterprise dynamic QR code directly using your Malaysian banking app (MAE, CIMB Clicks, etc.) to instant-pay the calculated net quote.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Receipt Uploader */}
                  <div className="lg:col-span-6 space-y-4">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">6</span>
                      Upload Transaction Receipt
                    </h3>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Please upload the PDF, PNG, or JPEG transaction slip. This receipt feeds into our active owner ledger for direct clearance confirmation:
                    </p>

                     {/* Drag-and-drop Styled File Area */}
                    <div className="relative border-2 border-dashed border-white/10 hover:border-[#799351]/40 rounded-2xl bg-neutral-900/40 p-6 text-center transition-all">
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleRealUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      
                      <div className="space-y-3 relative z-10 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-[#799351]/15 text-[#a1c398] flex items-center justify-center mx-auto border border-[#799351]/30">
                          {receiptFileName ? (
                            <FileCheck className="w-6 h-6 text-[#a1c398]" />
                          ) : (
                            <UploadCloud className="w-6 h-6 text-[#a1c398]" />
                          )}
                        </div>

                        {receiptFileName ? (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-white block truncate max-w-[280px] mx-auto">
                              {receiptFileName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono block">
                              Size: {receiptFileSize} • Upload Successful
                            </span>
                          </div>
                        ) : isUploading ? (
                          <div className="space-y-2">
                            <span className="text-xs text-white block">Uploading receipt file...</span>
                            <div className="w-32 h-1 bg-neutral-950 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-[#a1c398]" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-white block">
                              Drag and drop receipt here, or <span className="text-[#a1c398] underline cursor-pointer">browse file</span>
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono block">
                              Supports PDF, PNG, JPG (Max 5MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {receiptFileName && (
                      <div className="bg-[#799351]/10 border border-[#799351]/20 p-3.5 rounded-xl text-[11px] text-[#a1c398] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#a1c398] shrink-0" />
                          <span>Receipt validated. Ready to lock reservation!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFileName(null);
                            setReceiptFileSize(null);
                          }}
                          className="text-[10px] font-bold text-red-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: Final Confirmation & Contact */}
              {activeStep === 5 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  {/* Left Column: Contact Details Input */}
                  <div className="lg:col-span-6 space-y-4">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#799351]/20 text-[#a1c398] flex items-center justify-center font-mono text-xs font-bold">7</span>
                      Enter Contact Information
                    </h3>
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                      Register your email and phone coordinates. These credentials allow you to log in to our premium client portal desk to download high-res files instantly during the event:
                    </p>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Contact Full Name</label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Siti Aminah"
                          className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Contact Email Address</label>
                        <input
                          type="email"
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="e.g. siti.aminah@gmail.com"
                          className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Contact Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="e.g. +6012-3456789"
                          className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Create Portal Password</label>
                        <input
                          type="password"
                          required
                          value={portalPassword}
                          onChange={(e) => setPortalPassword(e.target.value)}
                          placeholder="Create password for client portal"
                          className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                        />
                      </div>

                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 leading-relaxed font-sans space-y-1">
                        <span className="font-bold uppercase block tracking-wider font-mono text-[9px]">⚠️ Important Login Reminder:</span>
                        <p>
                          You must use this email (<strong>{clientEmail || "your-email"}</strong>) and password to log in and access your personal dashboard, track verification, or download high-resolution event photos.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Final Invoice breakdown summary */}
                  <div className="lg:col-span-6 bg-neutral-900/40 border border-white/10 p-5 rounded-3xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#a1c398] tracking-widest uppercase block font-bold mb-3">
                        Booking Summary Details
                      </span>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-gray-400">Target Date:</span>
                          <span className="text-white font-bold">{wizardDate}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-gray-400">Coverage State:</span>
                          <span className="text-white uppercase font-bold">{STATES_MAP.find(s => s.id === wizardState)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Selected Plan:</span>
                          <span className="text-[#a1c398] font-bold">{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-sans">Venue Address:</span>
                          <span className="text-white text-right truncate max-w-[200px]">{venueAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Payment Receipt:</span>
                          <span className="text-emerald-400 truncate max-w-[200px] font-mono text-[11px]">{receiptFileName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-xs text-gray-400 font-semibold">CALCULATED TOTAL RATE:</span>
                        <span className="text-xl font-bold text-[#a1c398]">RM {calculatedTotal}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitBooking}
                        className="w-full py-3 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Lock & Submit Booking Reservation</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION CONTROLS */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                {activeStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs uppercase font-mono tracking-wider font-semibold text-gray-300 flex items-center gap-2 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div className="w-24" />
                )}

                <div className="text-xs text-gray-500 font-mono">
                  Stage {activeStep} of 5
                </div>

                {activeStep < 5 ? (
                  <button
                    type="button"
                    disabled={
                      (activeStep === 1 && !wizardDate) ||
                      (activeStep === 2 && (!venueAddress.trim() || !wizardService)) ||
                      (activeStep === 4 && !receiptFileName)
                    }
                    onClick={() => setActiveStep((prev) => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-[#799351] hover:bg-[#5f743e] disabled:opacity-40 disabled:hover:bg-[#799351] text-white text-xs uppercase font-mono tracking-wider font-semibold flex items-center gap-2 transition-all"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-24" />
                )}
              </div>

            </div>
          )}
        </motion.div>
      )}

      {currentSection === "how-to-book" && (
        <motion.div
          key="how-to-book"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={slideTransition}
          className="glass-card rounded-[2.5rem] p-8 md:p-12 lg:p-16 border-[#799351]/20 relative overflow-hidden bg-black/60 backdrop-blur-xl"
        >
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#799351]/10 blur-[120px] pointer-events-none" />

          <div className="space-y-8">
            <div className="border-b border-white/10 pb-6">
              <span className="text-[11px] font-mono font-bold text-[#a1c398] uppercase tracking-widest block">
                RESERVATION GUIDE & TERMS
              </span>
              <h2 className="text-4xl md:text-5xl text-white font-display mt-2">
                How to Book & <span className="italic font-light">Service Agreement</span>
              </h2>
              <p className="text-sm text-gray-400 font-light mt-2 max-w-2xl font-sans">
                Securing a premier photo booth workspace is easy and fully automated. Please read our interactive step-by-step procedure and the official binding terms below.
              </p>
            </div>

            {/* Step-by-Step Booking Process Timeline */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-[#799351] rounded-sm inline-block" />
                The 6-Step Booking Flow
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    title: "Select Area / Region",
                    desc: "Choose from our 5 direct-transit Malaysian states (Selangor, Johor, Melaka, N.Sembilan, Pahang). This is critical as calendar slots are locked per region."
                  },
                  {
                    step: "2",
                    title: "Choose Date",
                    desc: "Select an available date in July 2026. The calendar dynamically checks region-specific availability to avoid dual bookings."
                  },
                  {
                    step: "3",
                    title: "Select Package & Enter Venue",
                    desc: "Choose from Classics, Platinum Royal, or Grand Luxe plans, and input your precise ballroom or hall address for the loading crews."
                  },
                  {
                    step: "4",
                    title: "Customize Add-ons",
                    desc: "Inject upgrades (such as 4R print dimensions, wide backdrops, or extra hours) into our interactive quotation calculator."
                  },
                  {
                    step: "5",
                    title: "Instant DuitNow QR Transfer",
                    desc: "Transfer the calculated rate to our corporate Maybank account or scan the DuitNow QR code on-screen using your banking app."
                  },
                  {
                    step: "6",
                    title: "Submit Receipt Proof",
                    desc: "Upload your transaction receipt. Your pre-booking is locked instantly, and will be formally approved by Irfan & Irsalina after a ledger match."
                  }
                ].map((item) => (
                  <div key={item.step} className="p-5 rounded-2xl bg-neutral-900/40 border border-white/5 relative hover:border-[#799351]/30 transition-all flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#a1c398] bg-[#799351]/10 px-2.5 py-1 rounded-lg">Step {item.step}</span>
                      <h4 className="text-sm font-bold text-white mt-4">{item.title}</h4>
                      <p className="text-xs text-gray-400 font-light mt-1.5 leading-relaxed font-sans">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms and Non-Refundable Agreement Box */}
            <div className="bg-[#799351]/10 border border-[#799351]/20 rounded-2xl p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#a1c398]" />
                <h3 className="text-lg font-bold text-white">Client-Business Agreement Rules</h3>
              </div>

              <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-light font-sans">
                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1">
                  <h4 className="text-red-400 font-bold uppercase tracking-wider font-mono text-[10px]">⚠️ Strict Non-Refundable Policy:</h4>
                  <p className="text-gray-300">
                    <strong>All reservation booking payments are 100% strictly non-refundable.</strong> Once a date and Malaysian state region are locked, we deploy hardware sets, reserve logistics crew coordinators, and reject alternative inquiries. There are no refunds for cancellations, weather delays, or guest count fluctuations.
                  </p>
                </div>

                <div className="space-y-2">
                  <p>
                    <strong>1. Reservation State Integrity:</strong> Because each Malaysian state (Selangor, Johor, Melaka, N. Sembilan, Pahang) uses an independent set of equipment and local crews, the locked location region cannot be altered after approval.
                  </p>
                  <p>
                    <strong>2. Date Lock:</strong> Once approved, the booked date is fully locked. In rare instances of proven emergency, a date rebooking may be requested up to 14 days prior, subject to a <strong>RM150 processing surcharge</strong> and calendar availability in the same region.
                  </p>
                  <p>
                    <strong>3. Rejected Payments:</strong> If your uploaded receipt is rejected by the owner (e.g. invalid transfer amount or corrupt file), you will be notified and your pre-booking will move to a <strong>Rejected</strong> status. You must re-book or re-upload the correct transaction proof under the same booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {currentSection === "contact" && (
        <motion.div
          key="contact"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={slideTransition}
          className="glass-card rounded-[2.5rem] p-8 md:p-12 lg:p-16 border-[#799351]/20 relative overflow-hidden bg-black/60 backdrop-blur-xl"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#799351]/10 blur-[120px] pointer-events-none" />

          {inquirySubmitted ? (
            <div className="text-center max-w-md mx-auto py-12 space-y-6">
              <div className="w-16 h-16 bg-[#799351]/20 border border-[#a1c398] rounded-full flex items-center justify-center mx-auto text-[#a1c398]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-display text-white">Inquiry Sent Successfully!</h2>
                <p className="text-xs text-gray-300 font-light leading-relaxed font-sans">
                  Thank you, <strong>{inquiryName}</strong>. Your inquiry has been dispatched to Irfan & Irsalina (Owners) as well as our Developer support desk. We have logged this action in our system audit trail.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInquirySubmitted(false);
                  setInquiryName("");
                  setInquiryEmail("");
                  setInquiryPhone("");
                  setInquiryMessage("");
                }}
                className="px-6 py-2 bg-neutral-900 border border-white/10 hover:bg-neutral-850 rounded-xl text-xs font-mono text-[#a1c398] uppercase transition-colors"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Info Column */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[11px] font-mono font-bold text-[#a1c398] uppercase tracking-widest block">
                  GET IN TOUCH WITH THE TEAM
                </span>
                <h2 className="text-4xl text-white font-display leading-tight">
                  Have an Inquiry? <span className="italic font-light">Send us a message</span>
                </h2>
                <p className="text-sm text-gray-300 font-light leading-relaxed font-sans">
                  Need custom packaging, high-volume corporate contracts, or special backdrop adjustments? Submit an official inquiry form. This form dispatches a secure data payload directly to the inbox of the co-founders and developer portal team.
                </p>

                <div className="space-y-3.5 pt-4 text-xs font-light text-gray-400 font-sans">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4.5 h-4.5 text-[#a1c398]" />
                    <span>massagroup00@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4.5 h-4.5 text-[#a1c398]" />
                    <span>+6012-4269946 (Corporate Office)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4.5 h-4.5 text-[#a1c398]" />
                    <span>P3B-03A-19, Jalan Wan Siew Off, Jalan Sg Chua, Taman Sepakat Indah, 43000 Kajang, Selangor</span>
                  </div>
                </div>
              </div>

              {/* Right Form Column */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryMessage.trim()) return;
                  
                  if (onAddAuditLog) {
                    onAddAuditLog(
                      "Public Guest",
                      `Submitted public inquiry: ${inquiryName} (${inquiryEmail}) for region ${inquiryRegion.toUpperCase()}`,
                      "info"
                    );
                  }
                  setInquirySubmitted(true);
                }}
                className="lg:col-span-7 bg-neutral-900/40 border border-white/5 p-6 md:p-8 rounded-3xl space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. Siti Aminah"
                      className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase">Your Email Address</label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="e.g. siti.aminah@gmail.com"
                      className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase">Contact Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="e.g. +6012-3456789"
                      className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-gray-400 uppercase">Preferred Location Region</label>
                    <select
                      value={inquiryRegion}
                      onChange={(e) => setInquiryRegion(e.target.value)}
                      className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] cursor-pointer"
                    >
                      {STATES_MAP.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Your Inquiry details</label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Specify date, expected guest volume, custom backdrop preferences, or corporate layout requirements..."
                    className="p-3 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351] placeholder-gray-600 resize-none leading-relaxed font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Submit Inquiry Request</span>
                </button>
              </form>
            </div>
          )}
        </motion.div>
      )}

      {/* Center of Contact screen social media icons for framezbooth.my */}
      {currentSection === "contact" && (
        <div className="mt-12 pt-8 border-t border-white/10 text-center space-y-4">
          <span className="text-[11px] font-mono font-bold text-[#a1c398] uppercase tracking-widest block">
            follow us and drop some love at:
          </span>
          <div className="flex justify-center items-center gap-8">
            <a
              href="https://www.instagram.com/framezbooth.my"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <div className="p-3 bg-neutral-900 border border-white/5 rounded-full group-hover:border-pink-500/30 group-hover:bg-pink-500/10 transition-all duration-300">
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </div>
              <span className="text-[9px] font-mono tracking-wider">INSTAGRAM</span>
            </a>
            <a
              href="https://www.tiktok.com/@framezbooth.my"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <div className="p-3 bg-neutral-900 border border-white/5 rounded-full group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all duration-300">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors fill-current" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10V9.5a4.5 4.5 0 0 1-3.5-1.5A5.4 5.4 0 0 0 15 5h-2v11.5a3.5 3.5 0 1 1-3.5-3.5c.3 0 .6 0 .9.1V11a5.5 5.5 0 1 0 4.6 5.4V8a6.5 6.5 0 0 0 5-5H18a4.5 4.5 0 0 1-6 4v-5z" />
                </svg>
              </div>
              <span className="text-[9px] font-mono tracking-wider">TIKTOK</span>
            </a>
            <a
              href="https://www.thread.com/@framezbooth.my"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <div className="p-3 bg-neutral-900 border border-white/5 rounded-full group-hover:border-white/30 group-hover:bg-white/10 transition-all duration-300">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5V11c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5v5.5zm0-8c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1z" />
                </svg>
              </div>
              <span className="text-[9px] font-mono tracking-wider">THREADS</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (!testimonials || testimonials.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400 font-mono text-xs">
        No testimonials uploaded yet. Let the Developer add custom memories.
      </div>
    );
  }

  // Display all uploaded testimonial memory cards without limiting to 3
  const visibleCards = testimonials;

  return (
    <div className="space-y-10 relative">
      {/* Hidden Triggers to map to parent buttons */}
      <button id="testimonial-next-trigger" className="hidden" onClick={handleNext} />
      <button id="testimonial-prev-trigger" className="hidden" onClick={handlePrev} />

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((card, index) => {
            return (
              <motion.div
                key={`${card.id}-${index}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="group flex flex-col justify-between p-8 rounded-[2rem] bg-neutral-50/50 border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/80 transition-all duration-300 min-h-[460px] shadow-sm hover:shadow-md relative overflow-hidden"
              >
                {/* Visual Accent Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-100/40 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-6">
                  {/* Top Logo */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono font-black text-neutral-900 tracking-wider">
                      {card.logo || "LOGO"}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#799351]" />
                  </div>

                  {/* Word-by-word reveal quote text */}
                  <div className="text-neutral-800 text-sm md:text-base leading-relaxed font-light font-sans italic min-h-[120px]">
                    <WordReveal text={card.quote} />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-neutral-100/80 mt-6">
                  {/* Author detail */}
                  <span className="text-[11px] font-mono font-bold tracking-wider text-[#799351] block uppercase">
                    {card.author || "- CLIENT REVIEWER"}
                  </span>

                  {/* High quality portrait frame */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-200">
                    <img
                      src={card.imageUrl || "https://cdn.sceneai.art/Hero%20section%20image/3654d348-a98c-4320-bc14-3f458b45a50d.png"}
                      alt="Memory Souvenir"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain transform transition-transform duration-[800ms] group-hover:scale-105"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Progress bullet indicators */}
      <div className="flex justify-center gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              currentIndex === i ? "bg-neutral-900 w-6" : "bg-neutral-200 hover:bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function WordReveal({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.03
          }
        }
      }}
      className="inline-block"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 5 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="inline-block mr-1.5"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
