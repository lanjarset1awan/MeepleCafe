import Constants from "expo-constants";

// Alamat backend server Express.js di Vercel Cloud (Online 24/7)
export const DEFAULT_BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl || "https://meeple-cafe-backend.vercel.app";

// Fallback langsung ke Supabase Cloud jika server lokal tidak terjangkau
export const SUPABASE_URL = "https://inavrmjnfpsveippxbqj.supabase.co";
export const SUPABASE_KEY = "sb_publishable_BhQlxKNqXOxoMIAcvq7FIQ_Zs4z25rp";
