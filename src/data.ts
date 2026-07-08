import { Package, AddOn, Booking, HardwareItem, CrewLead, ChatMessage, SystemAuditLog, Testimonial, InventoryLocation, InventoryItem, SystemNotification } from "./types";

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
  },
  {
    id: "video_guestbook",
    name: "Video Guestbook Experience",
    description: "Capturing high-definition video memories with a choice of Long Mirror or Convex Mirror and custom compilations.",
    price: 400,
    durationHrs: 5,
    printSize: "Unlimited HD Video (No Prints)",
    templatesCount: 1,
    features: [
      "5 Hours Active Coverage",
      "Long Mirror or Convex Mirror setup",
      "Unlimited Video captures on-the-spot",
      "Free Compiled Video highlights",
      "Professional Booth Assistant on-site",
      "Zero Transit Fee in Selangor, Melaka, N.Sembilan, Johor, Pahang"
    ]
  }
];

export const ADDONS: AddOn[] = [
  {
    id: "video_guestbook_addon",
    name: "Video Guestbook Experience Upgrade (Mirror, Unlimited Video, Free Compile Video, Assistant, 5 hrs)",
    price: 400,
    unit: "flat",
    quantity: 0
  },
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

export const DEFAULT_BOOKINGS: Booking[] = [];

export const DEFAULT_HARDWARE: HardwareItem[] = [];

export const DEFAULT_CREW: CrewLead[] = [];

export const DEFAULT_CHATS: ChatMessage[] = [];

export const DEFAULT_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: "log_init",
    timestamp: new Date().toISOString(),
    actor: "System Administrator",
    action: "Framez Office Workspace Database fully initialized. Ready for production bookings.",
    severity: "info"
  }
];

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "testi_1",
    logo: "NURUL & FARHAN",
    quote: "Sublime custom layouts and instant printing made our wedding night in Selangor absolutely perfect. The team's hospitality was royal class!",
    author: "- Nurul & Farhan, Selangor",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "testi_2",
    logo: "PETRONAS AGM",
    quote: "Incredibly fast high-res prints for our corporate event. Having local nodes meant zero travel surcharge and outstanding coordinator support.",
    author: "- Hazim, Petronas Corporate Event",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "testi_3",
    logo: "AMIRA & SEAN",
    quote: "Our guestbook is filled with hilarious pictures and warm wishes. Framez's dye-sub quality is crisp, water-resistant, and genuinely beautiful.",
    author: "- Amira & Sean, Johor Wedding Reception",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80"
  }
];

export const DEFAULT_LOCATIONS: InventoryLocation[] = [
  { id: "loc_hq", name: "Kuala Lumpur Headquarters (HQ Warehouse)", address: "No. 12, Jalan Ampang, 50450 Kuala Lumpur" },
  { id: "loc_sel", name: "Selangor Hub & Depot", address: "Lot 45, Seksyen 13, 40000 Shah Alam, Selangor" },
  { id: "loc_johor", name: "Southern Hub (Johor Bahru)", address: "Jalan Austin Heights, 81100 Johor Bahru, Johor" }
];

export const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: "inv_1",
    name: "Sony Alpha 7 IV Professional Camera Rig",
    category: "Camera",
    threshold: 1,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80",
    locations: { loc_hq: 4, loc_sel: 2, loc_johor: 1 }
  },
  {
    id: "inv_2",
    name: "DNP DS620 Dye-Sub High-Speed Printer",
    category: "Printer",
    threshold: 1,
    imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80",
    locations: { loc_hq: 3, loc_sel: 2, loc_johor: 1 }
  },
  {
    id: "inv_3",
    name: "Godox FV150 Continuous & High Speed Flash",
    category: "Lighting",
    threshold: 2,
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80",
    locations: { loc_hq: 6, loc_sel: 3, loc_johor: 2 }
  },
  {
    id: "inv_4",
    name: "Premium Dye-Sub Ribbon Roll & Paper Box",
    category: "Consumables",
    threshold: 5,
    imageUrl: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=300&q=80",
    locations: { loc_hq: 12, loc_sel: 4, loc_johor: 2 }
  },
  {
    id: "inv_5",
    name: "Ethereal Floral Ceremony Backdrop (8x10)",
    category: "Backdrop",
    threshold: 1,
    imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80",
    locations: { loc_hq: 2, loc_sel: 1, loc_johor: 1 }
  }
];

export const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif_welcome",
    title: "🚀 Portal Setup Completed",
    message: "Welcome to the central Framez Enterprise management portal. System is fully operational and cleared of old test booking records.",
    recipientRole: "ALL",
    sender: "System Coordinator",
    timestamp: new Date().toISOString(),
    isRead: false
  }
];

