import { supabase } from "../config/supabaseClient.js";

// Akun bawaan (Admin / Mahasiswa Utama)
export const DEFAULT_USERS = [
  {
    id: "2d688ca5-1dbf-4e9a-bd4c-84d3f0527d2c",
    name: "Lanjar Setiawan",
    username: "lanjar",
    email: "lanjar@meeplecafe.com",
    phone: "081234567890",
    password: "123",
    avatar:
      "https://mmdrzvvnmoplbdfaiixx.supabase.co/storage/v1/object/public/avatar/2/avatar.png?t=1779476174261",
    role: "Member",
    created_at: "2026-11-13T09:00:00.000Z"
  }
];

// Fallback in-memory cache jika tabel Supabase belum dibuat di dashboard
const fallbackMemoryUsers = [...DEFAULT_USERS];

export const UserModel = {
  // Ambil semua pengguna
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, username, email, phone, avatar, role, created_at")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      // Lanjut ke fallback
    }

    return fallbackMemoryUsers.map(({ password, ...u }) => u);
  },

  // Cari pengguna berdasarkan username atau email (termasuk password untuk login)
  async findByIdentifier(identifier) {
    const cleanId = (identifier || "").trim().toLowerCase();

    // 1. Coba cari di database Supabase
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      // Lanjut ke fallback
    }

    // 2. Fallback: cari di memory store
    return (
      fallbackMemoryUsers.find(
        (u) =>
          u.username.toLowerCase() === cleanId ||
          (u.email && u.email.toLowerCase() === cleanId)
      ) || null
    );
  },

  // Cari pengguna berdasarkan ID
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, username, email, phone, avatar, role, created_at")
        .eq("id", id)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      // Lanjut ke fallback
    }

    const found = fallbackMemoryUsers.find((u) => u.id === id);
    if (found) {
      const { password, ...safeUser } = found;
      return safeUser;
    }
    return null;
  },

  // Buat akun pengguna baru
  async create(payload) {
    const newUser = {
      name: payload.name.trim(),
      username: payload.username.trim().toLowerCase(),
      email: payload.email ? payload.email.trim().toLowerCase() : `${payload.username.trim().toLowerCase()}@meeplecafe.com`,
      phone: payload.phone ? payload.phone.trim() : "081234567890",
      password: payload.password.trim(),
      avatar:
        payload.avatar ||
        `https://api.dicebear.com/7.x/bottts/png?seed=${payload.username}&backgroundColor=287ab8`,
      role: "Member"
    };

    // 1. Coba simpan ke database Supabase
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([newUser])
        .select("id, name, username, email, phone, avatar, role, created_at");

      if (!error && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      // Lanjut ke fallback
    }

    // 2. Fallback jika tabel users belum di-run di Supabase SQL Editor
    const generatedUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    fallbackMemoryUsers.push(generatedUser);

    const { password, ...safeUser } = generatedUser;
    return safeUser;
  },

  // Perbarui profil pengguna
  async update(id, payload) {
    const updateData = {};
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.username !== undefined) {
      const cleanUsername = payload.username.trim().toLowerCase();
      // Validasi keunikan username
      const existing = await UserModel.findByIdentifier(cleanUsername);
      if (existing && existing.id !== id) {
        throw new Error(`Username "${cleanUsername}" sudah digunakan oleh pengguna lain.`);
      }
      updateData.username = cleanUsername;
    }
    if (payload.email !== undefined) {
      const cleanEmail = payload.email.trim().toLowerCase();
      if (cleanEmail) {
        // Cek apakah email sudah digunakan oleh orang lain
        const existing = await UserModel.findByIdentifier(cleanEmail);
        if (existing && existing.id !== id) {
          throw new Error(`Email "${cleanEmail}" sudah digunakan oleh pengguna lain.`);
        }
      }
      updateData.email = cleanEmail;
    }
    if (payload.phone !== undefined) updateData.phone = payload.phone.trim();
    if (payload.avatar !== undefined) {
      updateData.avatar = payload.avatar && payload.avatar.trim() ? payload.avatar.trim() : null;
    }

    // 1. Coba update ke database Supabase
    try {
      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select("id, name, username, email, phone, avatar, role, created_at");

      if (error) {
        if (error.message && error.message.includes("users_username_key")) {
          throw new Error(`Username "${updateData.username}" sudah digunakan.`);
        }
        throw error;
      }

      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    } catch (e) {
      if (e.message && e.message.includes("sudah digunakan")) {
        throw e;
      }
      // Lanjut ke fallback
    }

    // 2. Fallback in-memory cache
    const idx = fallbackMemoryUsers.findIndex((u) => u.id === id);
    if (idx >= 0) {
      fallbackMemoryUsers[idx] = {
        ...fallbackMemoryUsers[idx],
        ...updateData
      };
      const { password, ...safeUser } = fallbackMemoryUsers[idx];
      return safeUser;
    }

    return null;
  }
};
