import AsyncStorage from "@react-native-async-storage/async-storage";

export const CACHE_KEYS = {
  GAMES: "@meeple_cache_games",
  TABLES: "@meeple_cache_tables",
  CATEGORIES: "@meeple_cache_categories",
  GAME_DETAIL: (id) => `@meeple_cache_game_detail_${id}`,
  TABLE_DETAIL: (id) => `@meeple_cache_table_detail_${id}`,
  RESERVATIONS: (username) => `@meeple_cache_reservations_${(username || "all").toLowerCase()}`,
  DOWNLOADED_TICKETS: (username) => `@meeple_downloaded_tickets_${(username || "guest").toLowerCase()}`
};

export const CacheService = {
  /**
   * Memeriksa apakah key cache sudah pernah tersimpan di AsyncStorage
   */
  async hasKey(key) {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw !== null;
    } catch (err) {
      return false;
    }
  },

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
  },

  /**
   * Simpan daftar tiket/reservasi ke cache lokal per pengguna
   */
  async saveReservations(username, reservations) {
    if (!Array.isArray(reservations)) return;
    await this.set(CACHE_KEYS.RESERVATIONS(username), reservations);
  },

  /**
   * Cek apakah sudah ada cache reservasi tersimpan (untuk membedakan kosong vs belum pernah sync)
   */
  async hasReservationsCache(username) {
    const hasUser = await this.hasKey(CACHE_KEYS.RESERVATIONS(username));
    if (hasUser) return true;
    if (username) {
      return await this.hasKey(CACHE_KEYS.RESERVATIONS("all"));
    }
    return false;
  },

  /**
   * Ambil daftar tiket/reservasi dari cache (fallback ke cache 'all' atau snapshot tiket terunduh)
   */
  async getReservations(username) {
    const directCached = await this.get(CACHE_KEYS.RESERVATIONS(username));
    let baseList = Array.isArray(directCached) ? directCached : null;

    if (!baseList && username) {
      const allCached = await this.get(CACHE_KEYS.RESERVATIONS("all"));
      if (Array.isArray(allCached)) {
        baseList = allCached;
      }
    }

    const list = baseList ? [...baseList] : [];

    // Pastikan tiket yang sudah pernah didownload tetap muncul walaupun list utama belum ter-refresh
    if (username) {
      const downloadedMap = await this.getDownloadedTickets(username);
      const existingKeys = new Set(
        list.map((t) => String(t?.booking_code || t?.id || ""))
      );
      Object.values(downloadedMap).forEach((entry) => {
        if (entry?.snapshot) {
          const snapKey = String(entry.snapshot.booking_code || entry.snapshot.id || "");
          if (snapKey && !existingKeys.has(snapKey)) {
            list.push(entry.snapshot);
            existingKeys.add(snapKey);
          }
        }
      });
    }

    return list;
  },

  /**
   * Tambahkan tiket yang baru dibuat ke cache lokal agar langsung terlihat saat offline
   */
  async prependReservation(username, reservation) {
    if (!reservation) return;
    const keysToUpdate = [CACHE_KEYS.RESERVATIONS(username)];
    if (username) {
      keysToUpdate.push(CACHE_KEYS.RESERVATIONS("all"));
    }

    const matchSame = (a, b) =>
      (a?.id && b?.id && String(a.id) === String(b.id)) ||
      (a?.booking_code && b?.booking_code && a.booking_code === b.booking_code);

    for (const key of keysToUpdate) {
      const existing = await this.get(key);
      if (Array.isArray(existing)) {
        const filtered = existing.filter((item) => !matchSame(item, reservation));
        await this.set(key, [reservation, ...filtered]);
      } else if (key === CACHE_KEYS.RESERVATIONS(username)) {
        await this.set(key, [reservation]);
      }
    }
  },

  /**
   * Hapus tiket yang dihapus dari cache lokal
   */
  async removeReservationFromCache(username, ticketId) {
    if (!ticketId) return;
    const keysToUpdate = [CACHE_KEYS.RESERVATIONS(username)];
    if (username) {
      keysToUpdate.push(CACHE_KEYS.RESERVATIONS("all"));
    }

    for (const key of keysToUpdate) {
      const existing = await this.get(key);
      if (Array.isArray(existing)) {
        const filtered = existing.filter((item) => String(item.id) !== String(ticketId));
        await this.set(key, filtered);
      }
    }
  },

  /**
   * Ambil metadata seluruh E-Tiket yang sudah didownload / disimpan offline oleh pengguna
   */
  async getDownloadedTickets(username) {
    const map = await this.get(CACHE_KEYS.DOWNLOADED_TICKETS(username));
    return map && typeof map === "object" && !Array.isArray(map) ? map : {};
  },

  /**
   * Tandai tiket sudah diunduh & simpan snapshot offline beserta path PNG lokalnya
   */
  async saveDownloadedTicket(username, ticketKey, info) {
    if (!ticketKey || !info) return;
    const current = await this.getDownloadedTickets(username);
    current[String(ticketKey)] = info;
    await this.set(CACHE_KEYS.DOWNLOADED_TICKETS(username), current);
  },

  /**
   * Hapus status unduhan tiket tertentu
   */
  async removeDownloadedTicket(username, ticketKey) {
    if (!ticketKey) return;
    const current = await this.getDownloadedTickets(username);
    if (current[String(ticketKey)]) {
      delete current[String(ticketKey)];
      await this.set(CACHE_KEYS.DOWNLOADED_TICKETS(username), current);
    }
  }
};
