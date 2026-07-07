import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  writeBatch
} from "firebase/firestore";

// Config parsed from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0053075220",
  appId: "1:770855153685:web:45dcc91a0c2c9d69d61e1c",
  apiKey: "AIzaSyDmsd-jjq00krsaoeh7c9GdGvIg_3aR28Y",
  authDomain: "gen-lang-client-0053075220.firebaseapp.com",
  databaseId: "ai-studio-framezmy-cc1b96a0-657d-4f2d-8eff-8202cfbb32c1",
  storageBucket: "gen-lang-client-0053075220.firebasestorage.app",
  messagingSenderId: "770855153685"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.databaseId);

// Collection helper names
export const ACCOUNTS_COLLECTION = "accounts";
export const AUDIT_LOGS_COLLECTION = "audit_logs";
export const BOOKINGS_COLLECTION = "bookings";

export interface FireAccount {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "CREW" | "OWNER" | "DEVELOPER" | "GUEST";
  accessStatus: string;
  clientBookingIds: string[];
}

// Initial demo accounts
export const DEFAULT_DEMO_ACCOUNTS: FireAccount[] = [
  { id: "acc_1", email: "nexcraftsystems@gmail.com", name: "Siti Aminah", role: "CLIENT", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: ["b1"] },
  { id: "acc_2", email: "crew@framez.my", name: "Zack Crew lead", role: "CREW", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
  { id: "acc_3", email: "irfan@framez.my", name: "Irfan (Co-Founder)", role: "OWNER", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
  { id: "acc_4", email: "dev@framez.my", name: "Developer Superuser", role: "DEVELOPER", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
  { id: "acc_5", email: "zack@framez.my", name: "Zack Coordinator", role: "CREW", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [] },
];

/**
 * Sync initial/default accounts to Firestore if none exist.
 */
export async function initializeFirestoreDb() {
  try {
    const qSnap = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    if (qSnap.empty) {
      console.log("Initializing Firestore with default demo accounts...");
      const batch = writeBatch(db);
      for (const acc of DEFAULT_DEMO_ACCOUNTS) {
        const docRef = doc(db, ACCOUNTS_COLLECTION, acc.id);
        batch.set(docRef, acc);
      }
      await batch.commit();
      console.log("Firestore accounts successfully initialized!");
    }
  } catch (error) {
    console.error("Error initializing Firestore database accounts:", error);
  }
}

/**
 * Fetch all verified multi-role accounts from Firestore
 */
export async function getFireAccounts(): Promise<FireAccount[]> {
  try {
    const qSnap = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    const list: FireAccount[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data() as FireAccount);
    });
    return list;
  } catch (e) {
    console.error("Failed to fetch Firestore accounts, falling back to local list", e);
    return DEFAULT_DEMO_ACCOUNTS;
  }
}

/**
 * Save or update an account in Firestore
 */
export async function saveFireAccount(acc: FireAccount) {
  try {
    await setDoc(doc(db, ACCOUNTS_COLLECTION, acc.id), acc);
  } catch (e) {
    console.error("Failed to save Firestore account", e);
  }
}

/**
 * Delete a single client/account (restricted to Developer only)
 */
export async function deleteFireAccount(accId: string) {
  try {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, accId));
  } catch (e) {
    console.error("Failed to delete Firestore account", e);
    throw e;
  }
}

/**
 * Log action to Firestore
 */
export async function addFirestoreAuditLog(actor: string, action: string, severity: "info" | "warning" | "alert") {
  try {
    const logId = "log_" + Math.random().toString(36).substring(2, 11);
    const newLog = {
      id: logId,
      actor,
      action,
      severity,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, AUDIT_LOGS_COLLECTION, logId), newLog);
    return newLog;
  } catch (e) {
    console.error("Failed to write to Firestore audit logs", e);
    return null;
  }
}

/**
 * Clear all audit logs (restricted to Developer only)
 */
export async function clearFirestoreAuditLogs() {
  try {
    const qSnap = await getDocs(collection(db, AUDIT_LOGS_COLLECTION));
    const batch = writeBatch(db);
    qSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (e) {
    console.error("Failed to clear Firestore audit logs", e);
    throw e;
  }
}

/**
 * Fetch all audit logs from Firestore, ordered by timestamp desc
 */
export async function getFirestoreAuditLogs() {
  try {
    const qSnap = await getDocs(collection(db, AUDIT_LOGS_COLLECTION));
    const list: any[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data());
    });
    // sort desc manually since we might not have a compound index configured yet
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error("Failed to fetch Firestore audit logs", e);
    return [];
  }
}
