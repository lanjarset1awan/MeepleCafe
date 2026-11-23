import { DEFAULT_BACKEND_URL, SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { CacheService, CACHE_KEYS } from "../services/cacheService.js";

let isLastKnownOnline = true;

/**
 * Pengecekan aktif konektivitas internet (Ping ke Supabase Cloud / Backend)
 */
export async function checkConnectivity() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "HEAD",
      headers: { apikey: SUPABASE_KEY },
      signal: controller.signal
    });
    clearTimeout(timer);
    const online = response.status < 500;
    isLastKnownOnline = online;
    return online;
  } catch (err) {
    isLastKnownOnline = false;
    return false;
  }
}

/**
 * Helper fetch dengan pembersihan header & auto-fallback ke Supabase Cloud
 */
async function fetchWithFallback(endpoint, supabaseTable, options = {}) {
  const backendUrl = `${DEFAULT_BACKEND_URL}${endpoint}`;

  // 1. Coba hubungi backend local terlebih dahulu
  try {
    const cleanHeaders = {
      "Content-Type": "application/json"
    };
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        if (v !== undefined && v !== null) {
          cleanHeaders[k] = String(v);
        }
      }
    }

    const fetchOptions = {
      method: options.method || "GET",
      headers: cleanHeaders
    };
    if (options.body) {
      fetchOptions.body = options.body;
    }

    const response = await fetch(backendUrl, fetchOptions);
    if (response.ok) {
      isLastKnownOnline = true;
      const resText = await response.text();
      return resText ? JSON.parse(resText) : {};
    }
  } catch (err) {
    // Abaikan jika server lokal belum aktif, lanjutkan ke Supabase Cloud
  }

  // 2. Fallback: Langsung akses Supabase Cloud
  try {
    const supabaseUrl = `${SUPABASE_URL}/rest/v1/${supabaseTable}`;
    const supabaseHeaders = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    };

    const supabaseMethod = options.supabaseMethod || (options.method === "PUT" ? "PATCH" : (options.method || "GET"));

    if (options.method === "POST" || supabaseMethod === "PATCH") {
      supabaseHeaders["Prefer"] = "return=representation";
    }

    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        if (v !== undefined && v !== null) {
          supabaseHeaders[k] = String(v);
        }
      }
    }

    const supabaseOptions = {
      method: supabaseMethod,
      headers: supabaseHeaders
    };
    if (options.body) {
      supabaseOptions.body = options.body;
    }

    const response = await fetch(supabaseUrl, supabaseOptions);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gagal memuat data dari Supabase: ${errText}`);
    }

    isLastKnownOnline = true;
    const resText = await response.text();
    let result = null;
    try {
      result = resText ? JSON.parse(resText) : {};
    } catch (e) {
      result = {};
    }

    // Jika hasil berupa array dan yang diminta adalah single item
    if (Array.isArray(result)) {
      if (options.method === "POST" || supabaseMethod === "PATCH") {
        return result[0];
      }
      if (options.single) {
        return result.length > 0 ? result[0] : null;
      }
    }
    return result;
  } catch (networkErr) {
    isLastKnownOnline = false;
    throw networkErr;
  }
}

// Helper normalisasi game dengan stok kafe & posisi rak dinamis
function normalizeGame(game) {
  if (!game) return game;
  const letters = ["A", "B", "C", "D"];
  const idStr = String(game.id || game.title || "1");
  const num = parseInt(idStr.replace(/\D/g, ""), 10) || (idStr.charCodeAt(0) % 12) + 1;
  const section = letters[(num - 1) % letters.length] || "A";
  const shelfNum = Math.floor(((num - 1) % 12) / letters.length) + 1;
  const fallbackShelf = `Rak ${section}-0${shelfNum}`;

  const stock = game.stock !== undefined && game.stock !== null ? Number(game.stock) : 2;
  const shelf_location = game.shelf_location || fallbackShelf;
  const is_available = stock > 0 && game.is_available !== false;

  return {
    ...game,
    stock,
    shelf_location,
    rack_code: shelf_location,
    is_available
  };
}

export const ApiService = {
  // Helper Pengecekan Online
  checkOnline() {
    return checkConnectivity();
  },
  isOnline() {
    return isLastKnownOnline;
  },

  // 1. Koleksi Games (List Utama 1 & Detail) - Strategi Cache-First (Stale-While-Revalidate)
  async getGames(categoryId = null) {
    try {
      const endpoint = categoryId ? `/api/games?category=${categoryId}` : "/api/games";
      const supabaseQuery = categoryId
        ? `board_games?category_id=eq.${categoryId}&select=*,game_categories(id,name)`
        : `board_games?select=*,game_categories(id,name)&order=title.asc`;
      const data = await fetchWithFallback(endpoint, supabaseQuery);
      const normalized = Array.isArray(data) ? data.map(normalizeGame) : [];

      // Simpan ke cache lokal jika fetch online berhasil
      if (!categoryId) {
        CacheService.saveGames(normalized).catch(() => {});
      }
      return normalized;
    } catch (err) {
      // Fallback Offline: Muat dari AsyncStorage
      const cached = await CacheService.getGames();
      if (cached && cached.length > 0) {
        let result = cached;
        if (categoryId) {
          result = cached.filter((g) => String(g.category_id) === String(categoryId));
        }
        result._isOffline = true;
        return result;
      }
      throw err;
    }
  },

  async getGameById(id) {
    try {
      const data = await fetchWithFallback(
        `/api/games/${id}`,
        `board_games?id=eq.${id}&select=*,game_categories(id,name)`,
        { single: true }
      );
      const normalized = normalizeGame(data);
      if (normalized) {
        CacheService.set(CACHE_KEYS.GAME_DETAIL(id), normalized).catch(() => {});
      }
      return normalized;
    } catch (err) {
      // Fallback Offline: Muat detail dari cache
      const cached = await CacheService.getGameDetail(id);
      if (cached) {
        cached._isOffline = true;
        return cached;
      }
      throw err;
    }
  },

  async createGame(payload) {
    return fetchWithFallback("/api/games", "board_games", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateGame(id, payload) {
    return fetchWithFallback(`/api/games/${id}`, `board_games?id=eq.${id}`, {
      method: "PUT",
      supabaseMethod: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  async deleteGame(id) {
    return fetchWithFallback(`/api/games/${id}`, `board_games?id=eq.${id}`, {
      method: "DELETE"
    });
  },

  async decrementGameStock(id) {
    try {
      return await fetchWithFallback(`/api/games/${id}/decrement-stock`, `board_games?id=eq.${id}`, {
        method: "PATCH"
      });
    } catch (e) {
      // Abaikan
    }
  },

  async incrementGameStock(id) {
    try {
      return await fetchWithFallback(`/api/games/${id}/increment-stock`, `board_games?id=eq.${id}`, {
        method: "PATCH"
      });
    } catch (e) {
      // Abaikan
    }
  },

  async getCategories() {
    try {
      const data = await fetchWithFallback("/api/categories", "game_categories?select=*&order=name.asc");
      const list = Array.isArray(data) ? data : [];
      if (list.length > 0) {
        CacheService.saveCategories(list).catch(() => {});
      }
      return list;
    } catch (err) {
      const cached = await CacheService.getCategories();
      if (cached && cached.length > 0) return cached;
      return [
        { id: "1", name: "Strategy" },
        { id: "2", name: "Party Game" },
        { id: "3", name: "Family" },
        { id: "4", name: "Social Deduction" }
      ];
    }
  },

  // 2. Meja Kafe (List Utama 2, Detail & CRUD Admin) - Strategi Cache-First
  async getTables() {
    try {
      const data = await fetchWithFallback("/api/tables", "cafe_tables?order=table_number.asc");
      const list = Array.isArray(data) ? data : [];
      CacheService.saveTables(list).catch(() => {});
      return list;
    } catch (err) {
      const cached = await CacheService.getTables();
      if (cached && cached.length > 0) {
        cached._isOffline = true;
        return cached;
      }
      throw err;
    }
  },

  async getTableById(id) {
    try {
      const data = await fetchWithFallback(`/api/tables/${id}`, `cafe_tables?id=eq.${id}`, { single: true });
      if (data) {
        CacheService.set(CACHE_KEYS.TABLE_DETAIL(id), data).catch(() => {});
      }
      return data;
    } catch (err) {
      const cached = await CacheService.getTableDetail(id);
      if (cached) {
        cached._isOffline = true;
        return cached;
      }
      throw err;
    }
  },

  async createTable(payload) {
    return fetchWithFallback("/api/tables", "cafe_tables", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async updateTable(id, payload) {
    return fetchWithFallback(`/api/tables/${id}`, `cafe_tables?id=eq.${id}`, {
      method: "PUT",
      supabaseMethod: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  async deleteTable(id) {
    return fetchWithFallback(`/api/tables/${id}`, `cafe_tables?id=eq.${id}`, {
      method: "DELETE"
    });
  },

  // 3. Reservasi / Booking Meja
  async getReservations(filter = {}) {
    let endpoint = "/api/reservations";
    if (filter.username) {
      endpoint += `?username=${encodeURIComponent(filter.username)}`;
    }
    return fetchWithFallback(
      endpoint,
      "reservations?select=*,cafe_tables(*)&order=created_at.desc"
    );
  },

  async createReservation(payload) {
    // Validasi mode offline: Pemesanan membutuhkan koneksi internet aktif
    if (!isLastKnownOnline) {
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        throw new Error("OFFLINE_ERROR: Anda sedang dalam mode offline. Pembuatan tiket reservasi membutuhkan koneksi internet aktif.");
      }
    }

    if (!payload.booking_code) {
      const code = Math.floor(1000 + Math.random() * 9000);
      payload.booking_code = `MC-${code}`;
    }

    let result;
    try {
      result = await fetchWithFallback("/api/reservations", "reservations", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Jika kolom game_title belum dibuat di Supabase, fallback simpan di customer_name
      if (err.message && err.message.includes("PGRST204")) {
        const sanitized = { ...payload };
        if (sanitized.game_title && !sanitized.customer_name.includes("[Game:")) {
          sanitized.customer_name = `${sanitized.customer_name} [Game: ${sanitized.game_title}]`;
        }
        delete sanitized.game_title;
        delete sanitized.game_id;
        result = await fetchWithFallback("/api/reservations", "reservations", {
          method: "POST",
          body: JSON.stringify(sanitized)
        });
      } else {
        throw err;
      }
    }

    // Integrasi: kurangi stok game saat reservasi berhasil dibuat
    if (payload.game_id) {
      this.decrementGameStock(payload.game_id).catch(() => {});
    }

    return result;
  },

  async deleteReservation(id) {
    return fetchWithFallback(`/api/reservations/${id}`, `reservations?id=eq.${id}`, {
      method: "DELETE"
    });
  },

  async updateReservationStatus(id, status) {
    return fetchWithFallback(`/api/reservations/${id}/status`, `reservations?id=eq.${id}`, {
      method: "PUT",
      supabaseMethod: "PATCH",
      body: JSON.stringify({ status })
    });
  },

  // Upload Bukti Pembayaran Tiket Reservasi (Bucket Khusus: 'tickets')
  async uploadPaymentProof(base64, mimeType = "image/jpeg") {
    // 1. Coba upload via Express Backend API
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/reservations/upload-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType })
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
    } catch (e) {
      // Backend offline, lanjut direct ke Supabase
    }

    // 2. Direct Fallback ke Supabase Storage (Bucket 'tickets')
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const fileName = `ticket-proof-${Date.now()}.${ext}`;

    try {
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Coba upload ke bucket 'tickets'
      let storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/tickets/proofs/${fileName}`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": mimeType
        },
        body: bytes
      });

      let bucketName = "tickets";
      let objectPath = `proofs/${fileName}`;

      if (!storageRes.ok) {
        // Fallback ke bucket 'avatars' folder 'tickets' jika bucket 'tickets' belum aktif
        storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/tickets/${fileName}`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": mimeType
          },
          body: bytes
        });
        bucketName = "avatars";
        objectPath = `tickets/${fileName}`;
      }

      if (storageRes.ok) {
        return {
          imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${objectPath}`
        };
      }
    } catch (e) {}

    // Fallback data URI jika cloud storage offline
    return {
      imageUrl: `data:${mimeType};base64,${cleanBase64}`
    };
  },

  // Autentikasi Pengguna (Login via Backend REST API & Supabase)
  async login(identifier, password) {
    const trimmedId = (identifier || "").trim().toLowerCase();
    const trimmedPass = (password || "").trim();

    // 1. Coba via Express Backend API
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmedId, password: trimmedPass })
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
      const errData = await backendRes.json().catch(() => ({}));
      if (backendRes.status === 400 || backendRes.status === 401) {
        throw new Error(errData.error || "Username atau kata sandi salah");
      }
    } catch (e) {
      if (e.message && (e.message.includes("salah") || e.message.includes("tidak ditemukan"))) {
        throw e;
      }
      // Backend lokal tidak aktif, lanjut ke Supabase Cloud
    }

    // 2. Direct Fallback: Supabase Cloud tabel users
    try {
      const filter = `or=(username.ilike.${encodeURIComponent(trimmedId)},email.ilike.${encodeURIComponent(trimmedId)})`;
      const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/users?${filter}&limit=1`, {
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        }
      });
      if (supabaseRes.ok) {
        const users = await supabaseRes.json();
        if (Array.isArray(users) && users.length > 0) {
          const u = users[0];
          if (u.password === trimmedPass) {
            const { password: _, ...safeUser } = u;
            return {
              message: "Login berhasil!",
              user: safeUser,
              token: `sb-${safeUser.id}`
            };
          } else {
            throw new Error("Kata sandi salah. Silakan coba lagi.");
          }
        }
      }
    } catch (sbErr) {
      if (sbErr.message && sbErr.message.includes("salah")) {
        throw sbErr;
      }
    }

    throw new Error("Pengguna tidak ditemukan di database cloud.");
  },

  // Registrasi Akun Pengguna Baru
  async register(userData) {
    const payload = {
      name: userData.name.trim(),
      username: userData.username.trim().toLowerCase(),
      email: userData.email ? userData.email.trim().toLowerCase() : `${userData.username.trim().toLowerCase()}@meeplecafe.com`,
      phone: userData.phone ? userData.phone.trim() : "081234567890",
      password: userData.password.trim(),
      avatar: userData.avatar || null,
      role: "Member"
    };

    // 1. Coba daftarkan via Express Backend API
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
      const errData = await backendRes.json().catch(() => ({}));
      if (backendRes.status === 400) {
        throw new Error(errData.error || "Data registrasi tidak valid");
      }
    } catch (e) {
      if (e.message && e.message.includes("terdaftar")) {
        throw e;
      }
      // Backend lokal tidak aktif, lanjut coba langsung ke Supabase Cloud
    }

    // 2. Direct Fallback: Supabase Cloud tabel users
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });

    if (supabaseRes.ok) {
      const data = await supabaseRes.json();
      const created = Array.isArray(data) ? data[0] : data;
      const { password: _, ...safeUser } = created;
      return {
        message: "Registrasi berhasil!",
        user: safeUser,
        token: `sb-${safeUser.id}`
      };
    } else {
      const errText = await supabaseRes.text();
      if (errText.includes("users_username_key") || errText.includes("duplicate")) {
        throw new Error(`Username "${payload.username}" sudah terdaftar.`);
      }
      throw new Error(`Gagal menyimpan ke database Supabase: ${errText}`);
    }
  },

  // Ambil Profil Pengguna
  async getUserProfile(id) {
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/auth/profile/${id}`);
      if (backendRes.ok) return await backendRes.json();
    } catch (e) {}

    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}&select=id,name,username,email,phone,avatar,role,created_at`, {
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }
    return null;
  },

  // Perbarui Profil Pengguna
  async updateProfile(id, profileData) {
    const payload = {};
    if (profileData.name !== undefined) payload.name = profileData.name ? profileData.name.trim() : "";
    if (profileData.username !== undefined) payload.username = profileData.username ? profileData.username.trim().toLowerCase() : "";
    if (profileData.email !== undefined) payload.email = profileData.email ? profileData.email.trim().toLowerCase() : "";
    if (profileData.phone !== undefined) payload.phone = profileData.phone ? profileData.phone.trim() : "";
    if (profileData.avatar !== undefined) {
      payload.avatar = profileData.avatar && profileData.avatar.trim() ? profileData.avatar.trim() : null;
    }

    // 1. Coba update via Express Backend REST API
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/auth/profile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
      const errJson = await backendRes.json().catch(() => ({}));
      if (errJson && errJson.error) {
        throw new Error(errJson.error);
      }
    } catch (e) {
      if (e.message && (e.message.includes("sudah digunakan") || e.message.includes("kosong") || e.message.includes("spasi"))) {
        throw e;
      }
      // Backend offline, lanjut ke Supabase Cloud
    }

    // 2. Direct Fallback: Supabase Cloud tabel users
    try {
      const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify(payload)
      });

      if (supabaseRes.ok) {
        const data = await supabaseRes.json();
        const updated = Array.isArray(data) && data.length > 0 ? data[0] : payload;
        const { password: _, ...safeUser } = updated;
        return {
          message: "Profil berhasil diperbarui!",
          user: safeUser
        };
      } else {
        const errText = await supabaseRes.text();
        if (errText.includes("users_username_key") || errText.includes("duplicate")) {
          throw new Error(`Username "${payload.username}" sudah digunakan pengguna lain.`);
        }
      }
    } catch (sbErr) {
      if (sbErr.message && sbErr.message.includes("sudah digunakan")) {
        throw sbErr;
      }
      // Lanjut ke fallback
    }

    return {
      message: "Profil diperbarui secara lokal",
      user: { id, ...payload }
    };
  },

  // Upload Foto Profil (Supabase Storage Bucket 'avatars' / Express Backend)
  async uploadAvatar(userId, base64, mimeType = "image/jpeg") {
    // 1. Coba upload via Express Backend API
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/auth/upload-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, base64, mimeType })
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
    } catch (e) {
      // Backend offline, lanjut ke direct storage Supabase
    }

    // 2. Direct Fallback ke Supabase Storage & Users Table
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    let avatarUrl = null;

    try {
      // Convert base64 to binary byte array
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${filePath}`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": mimeType
        },
        body: bytes
      });

      if (storageRes.ok) {
        avatarUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
      }
    } catch (storageErr) {
      // Storage error
    }

    // Jika upload bucket belum siap, simpan data URI agar tetap langsung tampil
    if (!avatarUrl) {
      avatarUrl = `data:${mimeType};base64,${cleanBase64}`;
    }

    // Simpan avatar URL ke record pengguna
    const updateResult = await this.updateProfile(userId, { avatar: avatarUrl });
    return {
      message: "Foto profil berhasil diperbarui!",
      avatarUrl,
      user: updateResult.user || { avatar: avatarUrl }
    };
  },

  // Hapus Foto Profil Pengguna
  async deleteAvatar(userId) {
    return this.updateProfile(userId, { avatar: null });
  },

  // Upload Foto Cover Board Game (Admin)
  async uploadGameImage(base64, mimeType = "image/jpeg") {
    // 1. Coba upload via Express Backend API
    try {
      const backendRes = await fetch(`${DEFAULT_BACKEND_URL}/api/games/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mimeType })
      });
      if (backendRes.ok) {
        return await backendRes.json();
      }
    } catch (e) {
      // Backend offline, lanjut direct ke Supabase
    }

    // 2. Direct Fallback ke Supabase Storage
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const fileName = `game-${Date.now()}.${ext}`;

    try {
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Coba upload ke games bucket
      let storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/games/covers/${fileName}`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": mimeType
        },
        body: bytes
      });

      let bucketName = "games";
      let objectPath = `covers/${fileName}`;

      if (!storageRes.ok) {
        // Fallback ke bucket avatars/games yang terbukti aktif
        storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/games/${fileName}`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": mimeType
          },
          body: bytes
        });
        bucketName = "avatars";
        objectPath = `games/${fileName}`;
      }

      if (storageRes.ok) {
        return {
          imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${objectPath}`
        };
      }
    } catch (e) {}

    // Fallback data URI jika offline
    return {
      imageUrl: `data:${mimeType};base64,${cleanBase64}`
    };
  }
};
