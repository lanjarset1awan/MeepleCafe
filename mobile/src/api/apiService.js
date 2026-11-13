import { DEFAULT_BACKEND_URL, SUPABASE_URL, SUPABASE_KEY } from "./config";

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
      return await response.json();
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

  const result = await response.json();

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

    return fetchWithFallback("/api/reservations", "reservations", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
