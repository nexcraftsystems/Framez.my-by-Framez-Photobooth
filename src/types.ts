export type Role = "CLIENT" | "CREW" | "OWNER" | "DEVELOPER" | "GUEST";

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  durationHrs: number;
  printSize: string;
  templatesCount: number;
  features: string[];
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface Booking {
  id: string;
  date: string;
  state: string;
  packageName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalPrice: number;
  addOns: string[];
  status: "AVAILABLE" | "PREBOOKED" | "BOOKED" | "REJECTED";
  locationAddress?: string;
  receiptUrl?: string;
  receiptApproved?: boolean;
  crewLeadId?: string;
  reviewRating?: number;
  reviewText?: string;
  unlockedDrive?: boolean;
  rejectionReason?: string;
  referralCode?: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: "Camera" | "Printer" | "Backdrop" | "Consumables" | "Lighting";
  stockCount: number;
  threshold: number;
  status: "Fully Operational" | "Maintenance Required" | "Low Stock";
  lastServiceDate: string;
}

export interface CrewLead {
  id: string;
  name: string;
  role: string;
  phone: string;
  assignedEvents: string[];
  activeEquipment: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  completedJobsCount?: number;
  rating?: number;
  promptnessRating?: number; // e.g. 98%
  customerSatisfaction?: number; // e.g. 4.9
}

export interface ChatMessage {
  id: string;
  clientId: string;
  clientName: string;
  sender: "CLIENT" | "CREW" | "OWNER";
  text: string;
  timestamp: string;
  isAiSuggested?: boolean;
  aiSuggestedText?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  severity: "info" | "warning" | "alert";
}
