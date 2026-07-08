/**
 * Cryptographic Hashing & Salting Utilities for Secure Role-Based Authentication
 */

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  // Use Web Crypto API's native SHA-256
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function generateSalt(): string {
  const array = new Uint32Array(8);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(n => n.toString(16)).join("");
}
