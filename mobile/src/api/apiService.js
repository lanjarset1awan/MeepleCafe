import { DEFAULT_BACKEND_URL, SUPABASE_URL, SUPABASE_KEY } from "./config";

/**
 * Helper fetch dengan timeout dan auto-fallback ke Supabase Cloud
 */
async function fetchWithFallback(endpoint, supabaseTable, options = {}) {
  const backendUrl = `${DEFAULT_BACKEND_URL}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(backendUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend local tidak merespons (${backendUrl}), beralih ke Supabase Cloud...`);
  }

  // Fallback: Langsung akses Supabase Cloud
  const supabaseUrl = `${SUPABASE_URL}/rest/v1/${supabaseTable}`;
  const response = await fetch(supabaseUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: options.method === "POST" ? "return=representation" : undefined,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal memuat data: ${errText}`);
  }

  const result = await response.json();
  if (options.method === "POST" && Array.isArray(result)) {
    return result[0];
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
    return fetchWithFallback(`/api/games/${id}`, `board_games?id=eq.${id}&select=*,game_categories(id,name)&single=true`);
  },

  // 2. Meja Kafe (List Utama 2 & Detail)
  async getTables() {
    return fetchWithFallback("/api/tables", "cafe_tables?order=table_number.asc");
  },

  async getTableById(id) {
    return fetchWithFallback(`/api/tables/${id}`, `cafe_tables?id=eq.${id}&single=true`);
  },

  // 3. Reservasi / Booking Meja
  async getReservations() {
    return fetchWithFallback("/api/reservations", "reservations?select=*,cafe_tables(*)&order=created_at.desc");
  },

  async createReservation(payload) {
    // Generate booking code if missing
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
