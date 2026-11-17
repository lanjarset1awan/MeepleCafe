import Constants from "expo-constants";

// Alamat backend server Express.js (Modul 1 & Modul 6)
// Menggunakan IP LAN komputer Anda agar bisa diakses dari HP via Wi-Fi
export const DEFAULT_BACKEND_URL =
  Constants.expoConfig?.extra?.backendUrl || "http://10.34.2.135:3000";

// Fallback langsung ke Supabase Cloud jika server lokal tidak terjangkau
export const SUPABASE_URL = "https://inavrmjnfpsveippxbqj.supabase.co";
export const SUPABASE_KEY = "sb_publishable_BhQlxKNqXOxoMIAcvq7FIQ_Zs4z25rp";
