import AsyncStorage from "@react-native-async-storage/async-storage";

export const CACHE_KEYS = {
  GAMES: "@meeple_cache_games",
  TABLES: "@meeple_cache_tables",
  CATEGORIES: "@meeple_cache_categories",
  GAME_DETAIL: (id) => `@meeple_cache_game_detail_${id}`,
  TABLE_DETAIL: (id) => `@meeple_cache_table_detail_${id}`
};

export const CacheService = {
  /**
   * Mengambil data dari cache AsyncStorage
   */
  async get(key) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data !== undefined ? parsed.data : parsed;
    } catch (err) {
      console.warn(`[CacheService] Gagal membaca cache ${key}:`, err);
      return null;
    }
  },

  /**
   * Menyimpan data ke cache AsyncStorage dengan timestamp
   */
  async set(key, data) {
    try {
      if (data === undefined || data === null) return;
      const payload = {
        data,
        cachedAt: new Date().toISOString(),
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn(`[CacheService] Gagal menulis cache ${key}:`, err);
    }
  },

  /**
   * Menghapus cache spesifik
   */
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[CacheService] Gagal menghapus cache ${key}:`, err);
    }
  },

  /**
   * Simpan daftar games ke cache sekaligus seed detail per game
   */
  async saveGames(games) {
    if (!Array.isArray(games)) return;
    await this.set(CACHE_KEYS.GAMES, games);

    // Pre-cache detail untuk setiap game agar bisa dibuka saat offline
    try {
      const promises = games.map((game) => {
        if (game?.id) {
          return this.set(CACHE_KEYS.GAME_DETAIL(game.id), game);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (e) {
      // Abaikan jika batch write detail gagal sebagian
    }
  },

  /**
   * Ambil daftar games dari cache
   */
  async getGames() {
    const cached = await this.get(CACHE_KEYS.GAMES);
    return Array.isArray(cached) ? cached : [];
  },

  /**
   * Ambil detail game tertentu dari cache (fallback cari di games list)
   */
  async getGameDetail(id) {
    if (!id) return null;
    const directDetail = await this.get(CACHE_KEYS.GAME_DETAIL(id));
    if (directDetail) return directDetail;

    // Fallback: cari di list games
    const allGames = await this.getGames();
    return allGames.find((g) => String(g.id) === String(id)) || null;
  },

  /**
   * Simpan daftar meja ke cache sekaligus seed detail per meja
   */
  async saveTables(tables) {
    if (!Array.isArray(tables)) return;
    await this.set(CACHE_KEYS.TABLES, tables);

    try {
      const promises = tables.map((tbl) => {
        if (tbl?.id) {
          return this.set(CACHE_KEYS.TABLE_DETAIL(tbl.id), tbl);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (e) {
      // Abaikan jika batch write detail gagal sebagian
    }
  },

  /**
   * Ambil daftar meja dari cache
   */
  async getTables() {
    const cached = await this.get(CACHE_KEYS.TABLES);
    return Array.isArray(cached) ? cached : [];
  },

  /**
   * Ambil detail meja tertentu dari cache
   */
  async getTableDetail(id) {
    if (!id) return null;
    const directDetail = await this.get(CACHE_KEYS.TABLE_DETAIL(id));
    if (directDetail) return directDetail;

    const allTables = await this.getTables();
    return allTables.find((t) => String(t.id) === String(id)) || null;
  },

  /**
   * Simpan kategori game
   */
  async saveCategories(categories) {
    if (Array.isArray(categories)) {
      await this.set(CACHE_KEYS.CATEGORIES, categories);
    }
  },

  /**
   * Ambil kategori game
   */
  async getCategories() {
    const cached = await this.get(CACHE_KEYS.CATEGORIES);
    return Array.isArray(cached) ? cached : [];
  }
};
