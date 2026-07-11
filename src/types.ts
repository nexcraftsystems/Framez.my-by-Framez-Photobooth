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
  crewLeadId2?: string;
  secondReceiptUrl?: string;
  secondPaymentApproved?: boolean;
  secondPaymentRejected?: boolean;
  secondPaymentRejectionReason?: string;
  reviewRating?: number;
  reviewText?: string;
  unlockedDrive?: boolean;
  rejectionReason?: string;
  referralCode?: string;
  paymentType?: "Booking Fees" | "Full Package";
  paymentAmount?: number;
  portalPassword?: string;
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
  role: string; // e.g. "Lead Coordinator", "Senior Operator"
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
  gender?: "Male" | "Female" | "Other";
  coverArea?: string;
  totalIncome?: number;
  gmailAccount?: string;
  avatarUrl?: string;
  accountRole?: Role; // only developer can set
  payoutRate?: number; // pay per job
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

export interface Testimonial {
  id: string;
  logo: string;
  quote: string;
  author: string;
  imageUrl: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  address?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  threshold: number;
  locations: { [locationId: string]: number }; // stock count per location
}

export interface InventoryRequest {
  id: string;
  type: "IN" | "OUT" | "DAMAGE" | "ADD_NEW";
  requesterName: string;
  requesterRole: string;
  items: { itemId: string; name: string; quantity: number }[];
  locationId: string;
  proofImageUrl?: string; // photo proof for damage or addition
  status: "PENDING" | "APPROVED" | "REJECTED";
  timestamp: string;
  rejectionReason?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  recipientRole: "ALL" | "CREW" | "OWNER" | "DEVELOPER" | "PERSONAL_CREW";
  targetCrewId?: string;
  sender: string;
  timestamp: string;
  isRead?: boolean;
  type?: "INFO" | "BROADCAST" | "TASK" | "SYSTEM";
  targetRole?: "ALL" | "CREW" | "OWNER" | "DEVELOPER";
  isReadBy?: string[];
}

