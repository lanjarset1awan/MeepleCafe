import { DEFAULT_BACKEND_URL, SUPABASE_URL, SUPABASE_KEY } from "./config.js";

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
      const resText = await response.text();
      return resText ? JSON.parse(resText) : {};
    }
  } catch (err) {
    // Abaikan jika server lokal belum aktif, lanjutkan ke Supabase Cloud
  }

  // 2. Fallback: Langsung akses Supabase Cloud
  const supabaseUrl = `${SUPABASE_URL}/rest/v1/${supabaseTable}`;
  const supabaseHeaders = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`
  };

  if (options.method === "POST") {
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
    method: options.method || "GET",
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

  const resText = await response.text();
  let result = null;
  try {
    result = resText ? JSON.parse(resText) : {};
  } catch (e) {
    result = {};
  }

  // Jika hasil berupa array dan yang diminta adalah single item
  if (Array.isArray(result)) {
    if (options.method === "POST") {
      return result[0];
    }
    if (options.single) {
      return result.length > 0 ? result[0] : null;
    }
  }
  return result;
}

export const ApiService = {
  // 1. Koleksi Games (List Utama 1 & Detail)
  async getGames(categoryId = null) {
    const endpoint = categoryId ? `/api/games?category=${categoryId}` : "/api/games";
    const supabaseQuery = categoryId
      ? `board_games?category_id=eq.${categoryId}&select=*,game_categories(id,name)`
      : `board_games?select=*,game_categories(id,name)&order=title.asc`;
    return fetchWithFallback(endpoint, supabaseQuery);
  },

  async getGameById(id) {
    return fetchWithFallback(
      `/api/games/${id}`,
      `board_games?id=eq.${id}&select=*,game_categories(id,name)`,
      { single: true }
    );
  },

  // 2. Meja Kafe (List Utama 2 & Detail)
  async getTables() {
    return fetchWithFallback("/api/tables", "cafe_tables?order=table_number.asc");
  },

  async getTableById(id) {
    return fetchWithFallback(`/api/tables/${id}`, `cafe_tables?id=eq.${id}`, { single: true });
  },

  // 3. Reservasi / Booking Meja
  async getReservations() {
    return fetchWithFallback(
      "/api/reservations",
      "reservations?select=*,cafe_tables(*)&order=created_at.desc"
    );
  },

  async createReservation(payload) {
    if (!payload.booking_code) {
      const code = Math.floor(1000 + Math.random() * 9000);
      payload.booking_code = `MC-${code}`;
    }

    try {
      return await fetchWithFallback("/api/reservations", "reservations", {
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
        return await fetchWithFallback("/api/reservations", "reservations", {
          method: "POST",
          body: JSON.stringify(sanitized)
        });
      }
      throw err;
    }
  },

  async deleteReservation(id) {
    return fetchWithFallback(`/api/reservations/${id}`, `reservations?id=eq.${id}`, {
      method: "DELETE"
    });
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
      const filter = `or=(username.ilike.${encodeURIComponent(trimmedId)},email.ilike.${encodeURIComponent(trimmedId)},nim.ilike.${encodeURIComponent(trimmedId)})`;
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
      nim: userData.nim ? userData.nim.trim() : "",
      major: userData.major ? userData.major.trim() : "Member Umum",
      password: userData.password.trim(),
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/png?seed=${userData.username}&backgroundColor=287ab8`,
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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}&select=id,name,username,email,phone,nim,major,avatar,role,created_at`, {
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
    if (profileData.name !== undefined) payload.name = profileData.name.trim();
    if (profileData.phone !== undefined) payload.phone = profileData.phone.trim();
    if (profileData.nim !== undefined) payload.nim = profileData.nim.trim();
    if (profileData.major !== undefined) payload.major = profileData.major.trim();

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
    } catch (e) {
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
      }
    } catch (sbErr) {
      // Lanjut ke fallback
    }

    return {
      message: "Profil diperbarui secara lokal",
      user: { id, ...payload }
    };
  }
};
