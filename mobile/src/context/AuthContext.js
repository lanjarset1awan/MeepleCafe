import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiService } from "../api/apiService";

const ACTIVE_USER_STORAGE_KEY = "@meeple_active_user";
const REGISTERED_USERS_STORAGE_KEY = "@meeple_registered_users";

// Akun bawaan (Admin / Mahasiswa Utama)
export const DEFAULT_USERS = [
  {
    id: "usr-lanjar-01",
    name: "Lanjar Setiawan",
    username: "lanjar",
    email: "lanjar@meeplecafe.com",
    phone: "081234567890",
    nim: "21120124120023",
    major: "Teknik Komputer",
    password: "123",
    avatar:
      "https://mmdrzvvnmoplbdfaiixx.supabase.co/storage/v1/object/public/avatar/2/avatar.png?t=1779476174261",
    role: "Mahasiswa / Member",
    createdAt: "2026-11-13T09:00:00.000Z"
  }
];

const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Muat sesi pengguna saat aplikasi dibuka
  useEffect(() => {
    async function loadActiveSession() {
      try {
        const storedUser = await AsyncStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Gagal membaca sesi aktif:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadActiveSession();
  }, []);

  // Ambil semua pengguna terdaftar (bawaan + pendaftaran baru)
  const getAllUsers = async () => {
    try {
      const stored = await AsyncStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
      const customUsers = stored ? JSON.parse(stored) : [];
      return [...DEFAULT_USERS, ...customUsers];
    } catch (err) {
      console.error("Gagal membaca daftar pengguna:", err);
      return DEFAULT_USERS;
    }
  };

  // Login dengan Email/Username/NIM & Password
  const login = async (identifier, password) => {
    const trimmedId = (identifier || "").trim().toLowerCase();
    const trimmedPass = (password || "").trim();

    if (!trimmedId || !trimmedPass) {
      throw new Error("Mohon isi username/email dan kata sandi.");
    }

    // 1. Coba login melalui Backend REST API / Database Supabase
    try {
      const response = await ApiService.login(trimmedId, trimmedPass);
      if (response && response.user) {
        await AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(response.user));
        setUser(response.user);
        return response.user;
      }
    } catch (apiErr) {
      console.log("Database login fallback to offline cache:", apiErr.message);
      if (apiErr.message && apiErr.message.includes("Kata sandi salah")) {
        throw apiErr;
      }
    }

    // 2. Fallback: Autentikasi lokal offline
    const allUsers = await getAllUsers();
    const foundUser = allUsers.find((u) => {
      const matchId =
        (u.email && u.email.toLowerCase() === trimmedId) ||
        (u.username && u.username.toLowerCase() === trimmedId) ||
        (u.nim && u.nim.toLowerCase() === trimmedId);
      const matchPass = u.password === trimmedPass;
      return matchId && matchPass;
    });

    if (!foundUser) {
      throw new Error("Kredensial salah. Periksa username/email dan kata sandi Anda.");
    }

    // Simpan sesi aktif
    await AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(foundUser));
    setUser(foundUser);
    return foundUser;
  };

  // Registrasi Akun Baru
  const register = async (userData) => {
    const { name, username, email, phone, nim, major, password } = userData;

    if (!name || !name.trim()) {
      throw new Error("Nama lengkap wajib diisi.");
    }
    if (!username || !username.trim()) {
      throw new Error("Username wajib diisi.");
    }
    if (!password || password.trim().length < 3) {
      throw new Error("Kata sandi minimal 3 karakter.");
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@meeplecafe.com`;

    // 1. Coba daftarkan ke Backend REST API / Database Supabase
    try {
      const response = await ApiService.register({
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: phone ? phone.trim() : "081234567890",
        nim: nim ? nim.trim() : "",
        major: major ? major.trim() : "Member Umum",
        password: password.trim()
      });

      if (response && response.user) {
        await AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(response.user));
        setUser(response.user);

        const stored = await AsyncStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
        const customUsers = stored ? JSON.parse(stored) : [];
        customUsers.push(response.user);
        await AsyncStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(customUsers));

        return response.user;
      }
    } catch (apiErr) {
      console.log("Database register fallback to offline storage:", apiErr.message);
      if (apiErr.message && apiErr.message.includes("sudah terdaftar")) {
        throw apiErr;
      }
    }

    // 2. Fallback: Simpan lokal jika backend belum terjangkau
    const allUsers = await getAllUsers();
    const isDuplicate = allUsers.some(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (email && u.email.toLowerCase() === cleanEmail)
    );

    if (isDuplicate) {
      throw new Error(`Username "${cleanUsername}" atau email sudah terdaftar.`);
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: phone ? phone.trim() : "081234567890",
      nim: nim ? nim.trim() : "",
      major: major ? major.trim() : "Member Umum",
      password: password.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${cleanUsername}&backgroundColor=287ab8`,
      role: "Member",
      createdAt: new Date().toISOString()
    };

    // Simpan ke daftar pengguna baru
    const stored = await AsyncStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
    const customUsers = stored ? JSON.parse(stored) : [];
    customUsers.push(newUser);
    await AsyncStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(customUsers));

    // Otomatis login dengan akun yang baru dibuat
    await AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  // Perbarui Profil Pengguna
  const updateProfile = async (profileData) => {
    if (!user) {
      throw new Error("Tidak ada sesi pengguna aktif.");
    }

    const updatedUser = {
      ...user,
      name: profileData.name ? profileData.name.trim() : user.name,
      phone: profileData.phone ? profileData.phone.trim() : (user.phone || ""),
      nim: profileData.nim !== undefined ? profileData.nim.trim() : (user.nim || ""),
      major: profileData.major ? profileData.major.trim() : (user.major || "Member Umum")
    };

    // 1. Coba simpan ke Backend / Supabase
    try {
      if (user.id) {
        const res = await ApiService.updateProfile(user.id, {
          name: updatedUser.name,
          phone: updatedUser.phone,
          nim: updatedUser.nim,
          major: updatedUser.major
        });
        if (res && res.user) {
          Object.assign(updatedUser, res.user);
        }
      }
    } catch (apiErr) {
      console.log("Database update profile fallback to local cache:", apiErr.message);
    }

    // 2. Simpan ke local active user
    await AsyncStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);

    // 3. Simpan juga ke cache registered users
    try {
      const stored = await AsyncStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
      if (stored) {
        const customUsers = JSON.parse(stored);
        const idx = customUsers.findIndex((u) => u.id === user.id || u.username === user.username);
        if (idx >= 0) {
          customUsers[idx] = { ...customUsers[idx], ...updatedUser };
          await AsyncStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(customUsers));
        }
      }
    } catch (cacheErr) {
      console.log("Error updating registered users cache:", cacheErr);
    }

    return updatedUser;
  };

  // Logout / Keluar
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      setUser(null);
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}
