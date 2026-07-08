import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
  writeBatch,
  where
} from "firebase/firestore";
import { hashPassword, generateSalt } from "./utils/crypto";

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
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  passwordHash?: string;
  passwordSalt?: string;
  firstTimeLogin?: boolean;
}

// Initial default real accounts
export const DEFAULT_DEMO_ACCOUNTS: FireAccount[] = [
  { id: "acc_dev", email: "nexcraftsystems@gmail.com", name: "Nexcraft Developer", role: "DEVELOPER", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [], firstTimeLogin: true },
  { id: "acc_crew", email: "wanahmadzaimwr99@gmail.com", name: "Wan Ahmad Zaim", role: "CREW", accessStatus: "ACTIVE_VERIFIED", clientBookingIds: [], firstTimeLogin: true },
];

/**
 * Sync initial/default accounts to Firestore if none exist or if these specific accounts are missing.
 */
export async function initializeFirestoreDb() {
  try {
    const accountsRef = collection(db, ACCOUNTS_COLLECTION);
    
    // Check developer account
    const devQuery = query(accountsRef, where("email", "==", "nexcraftsystems@gmail.com"));
    const devSnap = await getDocs(devQuery);
    if (devSnap.empty) {
      console.log("Seeding missing developer account: nexcraftsystems@gmail.com");
      const devSalt = generateSalt();
      const devHash = await hashPassword("Framez123", devSalt);
      const finalDev: FireAccount = {
        ...DEFAULT_DEMO_ACCOUNTS[0],
        passwordSalt: devSalt,
        passwordHash: devHash
      };
      await setDoc(doc(db, ACCOUNTS_COLLECTION, finalDev.id), finalDev);
    }

    // Check crew account
    const crewQuery = query(accountsRef, where("email", "==", "wanahmadzaimwr99@gmail.com"));
    const crewSnap = await getDocs(crewQuery);
    if (crewSnap.empty) {
      console.log("Seeding missing crew account: wanahmadzaimwr99@gmail.com");
      const crewSalt = generateSalt();
      const crewHash = await hashPassword("Framez123", crewSalt);
      const finalCrew: FireAccount = {
        ...DEFAULT_DEMO_ACCOUNTS[1],
        passwordSalt: crewSalt,
        passwordHash: crewHash
      };
      await setDoc(doc(db, ACCOUNTS_COLLECTION, finalCrew.id), finalCrew);
    }
  } catch (error) {
    console.error("Error initializing Firestore database accounts:", error);
  }
}

/**
 * Clean and reset the entire Firestore database (bookings, chats, accounts, logs)
 */
export async function resetEntireFirestoreDb() {
  try {
    // 1. Delete bookings
    const bSnap = await getDocs(collection(db, BOOKINGS_COLLECTION));
    const batch1 = writeBatch(db);
    bSnap.forEach(doc => batch1.delete(doc.ref));
    await batch1.commit();

    // 2. Delete audit logs
    const aSnap = await getDocs(collection(db, AUDIT_LOGS_COLLECTION));
    const batch2 = writeBatch(db);
    aSnap.forEach(doc => batch2.delete(doc.ref));
    await batch2.commit();

    // 3. Delete accounts
    const accSnap = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    const batch3 = writeBatch(db);
    accSnap.forEach(doc => batch3.delete(doc.ref));
    await batch3.commit();

    // 4. Re-initialize
    await initializeFirestoreDb();
    console.log("Database reset complete!");
  } catch (e) {
    console.error("Database reset failed", e);
    throw e;
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
