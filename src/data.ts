import { Package, AddOn, Booking, HardwareItem, CrewLead, ChatMessage, SystemAuditLog } from "./types";

export const PACKAGES: Package[] = [
  {
    id: "classics",
    name: "Classics Experience",
    description: "Ideal for intimate family birthdays, mini socials, and casual corporate gatherings.",
    price: 599,
    durationHrs: 3,
    printSize: "2R size (2x6 inches strips)",
    templatesCount: 3,
    features: [
      "3 Hours Unlimited Prints",
      "2R Photo Size Prints",
      "3 Free Premium Template Designs",
      "Awesome & Hilarious Physical Props",
      "QR Softcopy download on-the-spot",
      "Free Standard Backdrop Selection",
      "Professional Dye-Sub High-Speed Printer (12s/print)",
      "Zero Transit Fee in Selangor, Melaka, N.Sembilan, Johor, Pahang"
    ]
  },
  {
    id: "platinum",
    name: "Platinum Royal Experience",
    description: "Our signature wedding & gala favorite with custom crafted leather guestbooks.",
    price: 699,
    durationHrs: 3,
    printSize: "2R size (2x6 inches strips)",
    templatesCount: 4,
    features: [
      "3 Hours Unlimited Prints",
      "2R Photo Size Prints",
      "4 Free Premium Template Designs",
      "Awesome & Hilarious Physical Props",
      "QR Softcopy download on-the-spot",
      "Free Standard Backdrop Selection",
      "Premium Custom Guestbook (with metallic markers & glue stickers)",
      "Professional Dye-Sub High-Speed Printer (12s/print)",
      "Zero Transit Fee in Selangor, Melaka, N.Sembilan, Johor, Pahang"
    ]
  },
  {
    id: "grand_luxe",
    name: "Grand Luxe Experience",
    description: "The ultimate showstopper package for large wedding receptions & corporate mega-parties.",
    price: 799,
    durationHrs: 4,
    printSize: "2R size (2x6 inches strips)",
    templatesCount: 4,
    features: [
      "4 Hours Unlimited Prints",
      "2R Photo Size Prints",
      "4 Free Premium Template Designs",
      "Awesome & Hilarious Physical Props",
      "QR Softcopy download on-the-spot",
      "Free Standard Backdrop Selection",
      "Premium Custom Guestbook included",
      "High-speed dye-sub printer & premium lighting rig",
      "Zero Transit Fee in Selangor, Melaka, N.Sembilan, Johor, Pahang"
    ]
  }
];

export const ADDONS: AddOn[] = [
  {
    id: "4r_3h",
    name: "Upgrade to 4R Photo Size (3 Hours)",
    price: 399,
    unit: "flat",
    quantity: 0
  },
  {
    id: "4r_4h",
    name: "Upgrade to 4R Photo Size (4 Hours)",
    price: 499,
    unit: "flat",
    quantity: 0
  },
  {
    id: "extra_hours",
    name: "Additional Booking Time",
    price: 170,
    unit: "hour",
    quantity: 0
  },
  {
    id: "backdrop_resize",
    name: "Upgrade Backdrop Dimensions",
    price: 59,
    unit: "flat",
    quantity: 0
  },
  {
    id: "custom_guestbook",
    name: "Extra Premium Hardcover Guestbook",
    price: 79,
    unit: "flat",
    quantity: 0
  }
];

export const STATES_MAP = [
  { id: "selangor", name: "Selangor", color: "#10b981", coords: "M 80,100 L 95,95 L 110,110 L 95,125 Z", desc: "RM0 Delivery Fee" },
  { id: "negeri_sembilan", name: "Negeri Sembilan", color: "#10b981", coords: "M 95,125 L 110,110 L 125,125 L 110,140 Z", desc: "RM0 Delivery Fee" },
  { id: "melaka", name: "Melaka", color: "#10b981", coords: "M 110,140 L 125,130 L 135,145 L 120,155 Z", desc: "RM0 Delivery Fee" },
  { id: "johor", name: "Johor", color: "#10b981", coords: "M 120,155 L 135,145 L 170,165 L 180,195 L 150,210 Z", desc: "RM0 Delivery Fee" },
  { id: "pahang", name: "Pahang", color: "#10b981", coords: "M 110,110 L 140,80 L 185,110 L 170,165 L 125,125 Z", desc: "RM0 Delivery Fee" }
];

export const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: "b_past1",
    date: "2026-06-15",
    state: "Selangor",
    packageName: "Platinum Royal Experience",
    clientName: "Ahmad Fauzi",
    clientEmail: "fauzi@gmail.com",
    clientPhone: "+6012-4433221",
    totalPrice: 699,
    addOns: [],
    status: "BOOKED",
    receiptUrl: "https://framez.my/receipts/rec_past1.pdf",
    receiptApproved: true,
    crewLeadId: "c1",
    reviewRating: 5,
    reviewText: "Excellent work by Zack! Super prompt and professional.",
    unlockedDrive: true,
    referralCode: "c1"
  },
  {
    id: "b_past2",
    date: "2026-06-20",
    state: "Johor",
    packageName: "Classics Experience",
    clientName: "Chong Wei",
    clientEmail: "chongwei@yahoo.com",
    clientPhone: "+6019-2233445",
    totalPrice: 599,
    addOns: [],
    status: "BOOKED",
    receiptUrl: "https://framez.my/receipts/rec_past2.pdf",
    receiptApproved: true,
    crewLeadId: "c2",
    reviewRating: 4,
    reviewText: "Maya designed beautiful photo layouts. Very happy!",
    unlockedDrive: true,
    referralCode: "c2"
  },
  {
    id: "b_past3",
    date: "2026-06-28",
    state: "Selangor",
    packageName: "Grand Luxe Experience",
    clientName: "Nisha Rao",
    clientEmail: "nisha@gmail.com",
    clientPhone: "+6013-1122334",
    totalPrice: 799,
    addOns: [],
    status: "BOOKED",
    receiptUrl: "https://framez.my/receipts/rec_past3.pdf",
    receiptApproved: true,
    crewLeadId: "c1",
    reviewRating: 5,
    reviewText: "The setup was massive and the photo prints were superb.",
    unlockedDrive: true
  },
  {
    id: "b1",
    date: "2026-07-15",
    state: "Selangor",
    packageName: "Platinum Royal Experience",
    clientName: "Siti Aminah",
    clientEmail: "siti.aminah@gmail.com",
    clientPhone: "+6012-3456789",
    totalPrice: 699,
    addOns: [],
    status: "BOOKED",
    receiptUrl: "https://framez.my/receipts/rec_92381.pdf",
    receiptApproved: true,
    crewLeadId: "c1", // Zack
    reviewRating: 5,
    reviewText: "Incredible prints and lovely guests engagement by Irfan and crew!",
    unlockedDrive: true,
    referralCode: "c1"
  },
  {
    id: "b2",
    date: "2026-07-16",
    state: "Johor",
    packageName: "Classics Experience",
    clientName: "David Teoh",
    clientEmail: "david.teoh@yahoo.com",
    clientPhone: "+6019-8765432",
    totalPrice: 599,
    addOns: [],
    status: "BOOKED",
    receiptUrl: "https://framez.my/receipts/rec_11204.pdf",
    receiptApproved: true,
    crewLeadId: "c2", // Maya
    unlockedDrive: false,
    referralCode: "c2"
  },
  {
    id: "b_open",
    date: "2026-07-10",
    state: "Penang",
    packageName: "Classics Experience",
    clientName: "Lim Guan Eng",
    clientEmail: "lim@penang.gov.my",
    clientPhone: "+6014-9988112",
    totalPrice: 699,
    addOns: [],
    status: "BOOKED",
    receiptUrl: "https://framez.my/receipts/rec_open.pdf",
    receiptApproved: true,
    crewLeadId: "c1"
  },
  {
    id: "b3",
    date: "2026-07-18",
    state: "Pahang",
    packageName: "Grand Luxe Experience",
    clientName: "Zulkifli Rahim",
    clientEmail: "zul.rahim@gmail.com",
    clientPhone: "+6011-2334455",
    totalPrice: 969, // Base RM799 + Extra Hour RM170
    addOns: ["Additional Booking Time (1 Hour)"],
    status: "PREBOOKED",
    receiptUrl: "https://framez.my/receipts/rec_pending.jpg",
    receiptApproved: false,
    crewLeadId: "c1" // Zack
  },
  {
    id: "b4",
    date: "2026-07-22",
    state: "Melaka",
    packageName: "Platinum Royal Experience",
    clientName: "Irsalina Test",
    clientEmail: "nexcraftsystems@gmail.com",
    clientPhone: "+6017-6655443",
    totalPrice: 1157, // Base RM699 + Upgrade 4R 3hr (RM399) + backdrop resize (RM59)
    addOns: ["Upgrade to 4R Photo Size (3 Hours)", "Upgrade Backdrop Dimensions"],
    status: "PREBOOKED",
    receiptUrl: undefined,
    receiptApproved: false
  }
];

export const DEFAULT_HARDWARE: HardwareItem[] = [
  {
    id: "hw-1",
    name: "Sony Alpha DSLR Client Rig Alpha III",
    category: "Camera",
    stockCount: 4,
    threshold: 1,
    status: "Fully Operational",
    lastServiceDate: "2026-05-10"
  },
  {
    id: "hw-2",
    name: "DNP DS620 High-Speed Dye-Sub Printer",
    category: "Printer",
    stockCount: 3,
    threshold: 1,
    status: "Fully Operational",
    lastServiceDate: "2026-06-01"
  },
  {
    id: "hw-3",
    name: "Framez Elegant Wedding Floral Backdrop 8x8",
    category: "Backdrop",
    stockCount: 5,
    threshold: 2,
    status: "Fully Operational",
    lastServiceDate: "2026-04-15"
  },
  {
    id: "hw-4",
    name: "Premium Dye-Sub Ribbon rolls (4x6 sheets)",
    category: "Consumables",
    stockCount: 2, // low stock! Threshold is 3
    threshold: 3,
    status: "Low Stock",
    lastServiceDate: "2026-07-01"
  },
  {
    id: "hw-5",
    name: "Godox Professional Studio Flash & Softbox",
    category: "Lighting",
    stockCount: 6,
    threshold: 2,
    status: "Fully Operational",
    lastServiceDate: "2026-05-20"
  }
];

export const DEFAULT_CREW: CrewLead[] = [
  {
    id: "c1",
    name: "Zack",
    role: "Senior Lead Event Coordinator",
    phone: "+6013-9988776",
    assignedEvents: ["b1", "b3", "b_past1", "b_past3", "b_open"],
    activeEquipment: ["Sony Alpha DSLR Client Rig Alpha III", "DNP DS620 High-Speed Dye-Sub Printer"],
    bankName: "Maybank",
    bankAccountNumber: "164012345678",
    bankAccountHolder: "ZACK BIN AMRAN",
    completedJobsCount: 14,
    rating: 4.9,
    promptnessRating: 98,
    customerSatisfaction: 4.9
  },
  {
    id: "c2",
    name: "Maya",
    role: "Visual Designer & Print Crew Lead",
    phone: "+6014-5544332",
    assignedEvents: ["b2", "b_past2"],
    activeEquipment: ["DNP DS620 High-Speed Dye-Sub Printer"],
    bankName: "CIMB Bank",
    bankAccountNumber: "8001234567",
    bankAccountHolder: "MAYA TENGKU",
    completedJobsCount: 9,
    rating: 4.8,
    promptnessRating: 95,
    customerSatisfaction: 4.7
  }
];

export const DEFAULT_CHATS: ChatMessage[] = [
  {
    id: "msg1",
    clientId: "b3",
    clientName: "Zulkifli Rahim",
    sender: "CLIENT",
    text: "Salam Irfan, I have uploaded my payment receipt. Can you check and approve my booking for Janda Baik on the 18th?",
    timestamp: "2026-07-06T09:15:00Z"
  },
  {
    id: "msg2",
    clientId: "b3",
    clientName: "Zulkifli Rahim",
    sender: "OWNER",
    text: "Waalaikumussalam Zulkifli, yes received! Let me review the transaction right away. If approved, Zack will lead your crew.",
    timestamp: "2026-07-06T09:20:00Z"
  },
  {
    id: "msg3",
    clientId: "b4",
    clientName: "Irsalina Test",
    sender: "CLIENT",
    text: "Hi Irsalina! Is transportation included in the RM499 price, or are there any extra transit surcharges to Melaka?",
    timestamp: "2026-07-06T10:05:00Z"
  }
];

export const DEFAULT_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: "l1",
    timestamp: "2026-07-06T06:00:00Z",
    actor: "System Scheduler",
    action: "Alert: Event Siti Aminah (b1) is on track for lead coordinator assignment.",
    severity: "info"
  },
  {
    id: "l2",
    timestamp: "2026-07-06T06:12:00Z",
    actor: "Irfan (Co-Founder)",
    action: "Checked out Sony Alpha DSLR Client Rig Alpha III for inspection.",
    severity: "info"
  },
  {
    id: "l3",
    timestamp: "2026-07-06T06:18:00Z",
    actor: "Maya (Crew Lead)",
    action: "Reported stock Level: Premium Dye-Sub Ribbon rolls is currently 2 rolls. Below limit threshold of 3.",
    severity: "warning"
  }
];
