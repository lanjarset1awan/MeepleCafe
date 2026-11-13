import Constants from "expo-constants";

// Alamat backend server Express.js (Modul 1 & Modul 6)
// Bisa diganti dengan IP LAN laptop Anda (misal http://192.168.1.X:3000)
// Atau jika dideploy ke Vercel (misal https://meeplecafe-api.vercel.app)
export const DEFAULT_BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl || "http://localhost:3000";

// Fallback langsung ke Supabase Cloud jika server lokal belum dinyalakan
export const SUPABASE_URL = "https://inavrmjnfpsveippxbqj.supabase.co";
export const SUPABASE_KEY = "sb_publishable_BhQlxKNqXOxoMIAcvq7FIQ_Zs4z25rp";
