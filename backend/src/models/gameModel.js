import { supabase } from "../config/supabaseClient.js";

// Penyimpanan in-memory runtime untuk tracking stok & posisi rak
// Menjamin data tetap live & dinamis bahkan sebelum migrasi SQL dijalankan di Supabase Dashboard
const runtimeStockTracker = new Map();
const runtimeShelfTracker = new Map();
const softDeletedIds = new Set();

function computeDefaultStock(game) {
  if (game?.difficulty === "Hard" || game?.difficulty === "Sulit") return 1;
  if ((game?.max_players || 0) >= 6) return 3;
  return 2;
}

function computeDefaultShelf(game) {
  const letters = ["A", "B", "C", "D"];
  const idStr = String(game?.id || game?.title || "1");
  const num = parseInt(idStr.replace(/\D/g, ""), 10) || (idStr.charCodeAt(0) % 12) + 1;
  const section = letters[(num - 1) % letters.length] || "A";
  const shelfNum = Math.floor(((num - 1) % 12) / letters.length) + 1;
  return `Rak ${section}-0${shelfNum}`;
}

function enhanceGameData(game) {
  if (!game) return null;
  const storedStock = runtimeStockTracker.get(game.id);
  const storedShelf = runtimeShelfTracker.get(game.id);

  const stock =
    game.stock !== null && game.stock !== undefined
      ? Number(game.stock)
      : (storedStock !== undefined ? storedStock : computeDefaultStock(game));

  const shelf_location =
    game.shelf_location !== null && game.shelf_location !== undefined && game.shelf_location !== ""
      ? game.shelf_location
      : (storedShelf || computeDefaultShelf(game));

  const is_available = stock > 0 && game.is_available !== false;

  return {
    ...game,
    stock,
    shelf_location,
    is_available
  };
}

export const GameModel = {
  async getAll(category) {
    // 1. Coba query lengkap dengan kolom stock & shelf_location dari PostgreSQL Supabase
    try {
      let query = supabase
        .from("board_games")
        .select(`
          id, title, category_id, min_players, max_players,
          duration_minutes, difficulty, image_url, description,
          rules_summary, is_available, stock, shelf_location, created_at,
          game_categories ( id, name )
        `)
        .order("title", { ascending: true });

      if (category) {
        query = query.eq("category_id", category);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data
          .filter((g) => !softDeletedIds.has(String(g.id)))
          .map(enhanceGameData);
      }
    } catch (e) {
      // Lanjut ke fallback jika kolom belum ada di schema cache
    }

    // 2. Fallback query tanpa kolom stock & shelf_location, lalu lengkapi secara dinamis
    let fallbackQuery = supabase
      .from("board_games")
      .select(`
        id, title, category_id, min_players, max_players,
        duration_minutes, difficulty, image_url, description,
        rules_summary, is_available, created_at,
        game_categories ( id, name )
      `)
      .order("title", { ascending: true });

    if (category) {
      fallbackQuery = fallbackQuery.eq("category_id", category);
    }

    const { data, error } = await fallbackQuery;
    if (error) throw error;
    return (data || [])
      .filter((g) => !softDeletedIds.has(String(g.id)))
      .map(enhanceGameData);
  },

  async getById(id) {
    // 1. Coba query lengkap dengan kolom stock & shelf_location
    try {
      const { data, error } = await supabase
        .from("board_games")
        .select(`
          id, title, category_id, min_players, max_players,
          duration_minutes, difficulty, image_url, description,
          rules_summary, is_available, stock, shelf_location, created_at,
          game_categories ( id, name )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        return enhanceGameData(data);
      }
    } catch (e) {
      // Lanjut ke fallback
    }

    // 2. Fallback query tanpa kolom stock & shelf_location
    const { data, error } = await supabase
      .from("board_games")
      .select(`
        id, title, category_id, min_players, max_players,
        duration_minutes, difficulty, image_url, description,
        rules_summary, is_available, created_at,
        game_categories ( id, name )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return enhanceGameData(data);
  },

  async create(payload) {
    const desiredStock = payload.stock !== undefined ? Math.max(0, parseInt(payload.stock, 10)) : 2;
    const desiredShelf = payload.shelf_location ? payload.shelf_location.trim() : "Rak A-01";

    const insertPayload = {
      ...payload,
      stock: desiredStock,
      shelf_location: desiredShelf
    };

    try {
      const { data, error } = await supabase
        .from("board_games")
        .insert([insertPayload])
        .select();

      if (!error && data && data[0]) {
        runtimeStockTracker.set(data[0].id, desiredStock);
        runtimeShelfTracker.set(data[0].id, desiredShelf);
        return enhanceGameData(data[0]);
      }
    } catch (e) {
      // Gagal karena kolom belum ada di database Supabase
    }

    // Fallback: simpan tanpa kolom stock & shelf_location
    const cleanPayload = { ...insertPayload };
    delete cleanPayload.stock;
    delete cleanPayload.shelf_location;

    const { data, error } = await supabase
      .from("board_games")
      .insert([cleanPayload])
      .select();

    if (error) throw error;
    const created = data[0];
    runtimeStockTracker.set(created.id, desiredStock);
    runtimeShelfTracker.set(created.id, desiredShelf);
    return enhanceGameData(created);
  },

  async update(id, payload) {
    const updatePayload = { ...payload };
    let desiredStock = undefined;
    let desiredShelf = undefined;

    if (payload.stock !== undefined) {
      desiredStock = Math.max(0, parseInt(payload.stock, 10));
      updatePayload.stock = desiredStock;
      runtimeStockTracker.set(id, desiredStock);
    }
    if (payload.shelf_location !== undefined) {
      desiredShelf = payload.shelf_location.trim();
      updatePayload.shelf_location = desiredShelf;
      runtimeShelfTracker.set(id, desiredShelf);
    }

    try {
      const { data, error } = await supabase
        .from("board_games")
        .update(updatePayload)
        .eq("id", id)
        .select();

      if (!error && data && data[0]) {
        return enhanceGameData(data[0]);
      }
    } catch (e) {
      // Gagal karena kolom belum ada di database Supabase
    }

    // Fallback update tanpa kolom stock & shelf_location
    const cleanUpdate = { ...updatePayload };
    delete cleanUpdate.stock;
    delete cleanUpdate.shelf_location;

    const { data, error } = await supabase
      .from("board_games")
      .update(cleanUpdate)
      .eq("id", id)
      .select();

    if (error) throw error;
    return enhanceGameData(data[0]);
  },

  async remove(id) {
    const strId = String(id);
    softDeletedIds.add(strId);
    runtimeStockTracker.set(id, 0);

    // Soft delete: update is_available = false dan stock = 0 di Supabase
    // Menghindari error foreign key constraint dan tetap menjaga integritas riwayat tiket/reservasi
    try {
      await supabase
        .from("board_games")
        .update({ is_available: false, stock: 0 })
        .eq("id", id);
    } catch (e) {
      // Abaikan jika kolom di Supabase belum ada
    }

    return { message: "Board game deleted successfully (soft-deleted)", id, softDeleted: true };
  },

  // Kurangi stok box game ketika reservasi berhasil dipesan
  async decrementStock(idOrTitle) {
    if (!idOrTitle) return null;
    let game = null;

    try {
      game = await this.getById(idOrTitle);
    } catch (e) {
      // Jika bukan ID UUID, cari berdasarkan judul
      const allGames = await this.getAll();
      game = allGames.find(
        (g) => g.title.toLowerCase().trim() === String(idOrTitle).toLowerCase().trim()
      );
    }

    if (!game) return null;

    const currentStock = game.stock !== undefined ? game.stock : computeDefaultStock(game);
    const newStock = Math.max(0, currentStock - 1);
    const isAvail = newStock > 0;

    runtimeStockTracker.set(game.id, newStock);

    // Coba update ke database Supabase
    try {
      await supabase
        .from("board_games")
        .update({ stock: newStock, is_available: isAvail })
        .eq("id", game.id);
    } catch (e) {
      // Abaikan jika kolom di Supabase belum ada
    }

    return { ...game, stock: newStock, is_available: isAvail };
  },

  // Tambah / kembalikan stok box game saat reservasi dibatalkan atau dihapus
  async incrementStock(idOrTitle) {
    if (!idOrTitle) return null;
    let game = null;

    try {
      game = await this.getById(idOrTitle);
    } catch (e) {
      const allGames = await this.getAll();
      game = allGames.find(
        (g) => g.title.toLowerCase().trim() === String(idOrTitle).toLowerCase().trim()
      );
    }

    if (!game) return null;

    const currentStock = game.stock !== undefined ? game.stock : 0;
    const newStock = currentStock + 1;

    runtimeStockTracker.set(game.id, newStock);

    try {
      await supabase
        .from("board_games")
        .update({ stock: newStock, is_available: true })
        .eq("id", game.id);
    } catch (e) {
      // Abaikan jika kolom di Supabase belum ada
    }

    return { ...game, stock: newStock, is_available: true };
  }
};
