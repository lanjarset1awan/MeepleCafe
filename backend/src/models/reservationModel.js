import { supabase } from "../config/supabaseClient.js";
import { GameModel } from "./gameModel.js";

function parseHours(sessionStr) {
  if (!sessionStr) return { start: 0, end: 0 };
  const match = sessionStr.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
  if (match) {
    return {
      start: parseInt(match[1], 10) + parseInt(match[2], 10) / 60,
      end: parseInt(match[3], 10) + parseInt(match[4], 10) / 60
    };
  }
  return { start: 0, end: 0 };
}

function doOverlap(s1, s2) {
  const h1 = parseHours(s1);
  const h2 = parseHours(s2);
  if (h1.start === 0 && h1.end === 0) return s1 === s2;
  if (h2.start === 0 && h2.end === 0) return s1 === s2;
  return h1.start < h2.end && h2.start < h1.end;
}

export const ReservationModel = {
  async getAll(filter = {}) {
    // Select standard columns first to guarantee compatibility with or without new columns
    let query = supabase
      .from("reservations")
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .order("created_at", { ascending: false });

    let { data, error } = await query;
    if (error) throw error;

    if (data && (filter.username || filter.customer_name || filter.customer_phone)) {
      const uName = (filter.username || "").toLowerCase();
      const cName = (filter.customer_name || "").toLowerCase();
      const cPhone = (filter.customer_phone || "").replace(/\D/g, "");

      data = data.filter((item) => {
        const rawName = (item.customer_name || "").toLowerCase();
        const rawPhone = (item.customer_phone || "").replace(/\D/g, "");

        if (uName && rawName.includes(`[user: ${uName}]`)) return true;
        const clean = rawName.replace(/\[.+?\]/g, "").trim();
        if (uName && clean === uName) return true;
        if (cName && (clean === cName || clean.includes(cName))) return true;
        if (cPhone.length >= 7 && rawPhone.length >= 7 && cPhone === rawPhone) return true;
        return false;
      });
    }

    return data;
  },

  async getById(id) {
    let { data, error } = await supabase
      .from("reservations")
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Cek ketersediaan slot sesi pada tanggal tertentu
  async checkAvailability(reservation_date, table_id, game_title) {
    let query = supabase
      .from("reservations")
      .select("id, booking_code, table_id, session_time, customer_name")
      .eq("reservation_date", reservation_date);

    const { data: bookings, error } = await query;
    if (error) throw error;

    const bookedSessionsForTable = [];
    const bookedSessionsForGame = [];

    (bookings || []).forEach((b) => {
      // Meja sudah dibooking pada sesi ini
      if (table_id && b.table_id === table_id) {
        bookedSessionsForTable.push(b.session_time);
      }
      // Game sudah dibooking pada sesi ini
      if (game_title) {
        const titleMatch =
          b.customer_name && b.customer_name.toLowerCase().includes(game_title.toLowerCase());
        if (titleMatch) {
          bookedSessionsForGame.push(b.session_time);
        }
      }
    });

    return {
      date: reservation_date,
      bookedSessionsForTable,
      bookedSessionsForGame
    };
  },

  async create(payload) {
    // 0. VALIDASI TANGGAL & JAM (Tidak boleh memesan tanggal/jam yang sudah lewat)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    if (payload.reservation_date < todayStr) {
      const err = new Error(
        `Tidak dapat memesan untuk tanggal yang telah lewat (${payload.reservation_date}). Silakan pilih tanggal hari ini atau mendatang.`
      );
      err.status = 400;
      throw err;
    }

    if (payload.reservation_date === todayStr) {
      const hours = parseHours(payload.session_time);
      const currentHour = today.getHours() + today.getMinutes() / 60;
      if (hours.start <= currentHour) {
        const err = new Error(
          `Jam mulai reservasi (${payload.session_time}) sudah lewat untuk hari ini. Silakan pilih jam berikutnya!`
        );
        err.status = 400;
        throw err;
      }
    }

    // 1. VALIDASI KONFLIK JADWAL (Mencegah double booking meja & game dengan pengecekan interval overlap)
    const { data: existingBookings, error: checkError } = await supabase
      .from("reservations")
      .select("id, booking_code, table_id, session_time, customer_name")
      .eq("reservation_date", payload.reservation_date);

    if (existingBookings && existingBookings.length > 0) {
      // Cek apakah meja ini sudah dibooking orang pada rentang jam tersebut
      const tableConflict = existingBookings.find(
        (b) => b.table_id === payload.table_id && doOverlap(b.session_time, payload.session_time)
      );
      if (tableConflict) {
        const err = new Error(
          `Meja ini sudah direservasi pelanggan lain pada rentang jam ${payload.session_time}. Silakan pilih jam lain!`
        );
        err.status = 409;
        throw err;
      }

      // Cek apakah game ini sudah dipinjam di meja lain pada rentang jam yang sama (stok habis)
      if (payload.game_title) {
        const gameConflict = existingBookings.filter((b) => {
          const isSameGame =
            b.customer_name && b.customer_name.toLowerCase().includes(payload.game_title.toLowerCase());
          return isSameGame && doOverlap(b.session_time, payload.session_time);
        });

        if (gameConflict.length >= 1) {
          const err = new Error(
            `Stok game "${payload.game_title}" sedang habis/dipinjam pada rentang jam ${payload.session_time}. Silakan pilih jam berikutnya!`
          );
          err.status = 409;
          throw err;
        }
      }
    }

    if (!payload.booking_code) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      payload.booking_code = `MC-${randomCode}`;
    }

    const targetGameIdentifier = payload.game_id || payload.game_title;

    // 2. Format game ke customer_name secara aman agar tidak gagal di database
    const sanitized = { ...payload };
    if (sanitized.game_title && !sanitized.customer_name.includes("[Game:")) {
      sanitized.customer_name = `${sanitized.customer_name} [Game: ${sanitized.game_title}]`;
    }
    delete sanitized.game_title;
    delete sanitized.game_id;

    // 3. Simpan ke database
    let { data, error } = await supabase
      .from("reservations")
      .insert([sanitized])
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .single();

    if (error) throw error;

    // 4. Integrasi stok: kurangi stok game 1 box saat reservasi berhasil dipesan
    if (targetGameIdentifier) {
      try {
        await GameModel.decrementStock(targetGameIdentifier);
      } catch (err) {
        console.warn("Gagal decrement stok game:", err.message);
      }
    }

    return data;
  },

  async updateStatus(id, status) {
    // Jika status diubah menjadi Cancelled, kembalikan stok box game
    if (status === "Cancelled") {
      try {
        const { data: currentRes } = await supabase
          .from("reservations")
          .select("customer_name")
          .eq("id", id)
          .single();
        if (currentRes && currentRes.customer_name) {
          const match = currentRes.customer_name.match(/\[Game:\s*([^\]]+)\]/i);
          if (match && match[1]) {
            await GameModel.incrementStock(match[1].trim());
          }
        }
      } catch (e) {
        // Abaikan
      }
    }

    const { data, error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    try {
      const { data: currentRes } = await supabase
        .from("reservations")
        .select("customer_name")
        .eq("id", id)
        .single();
      if (currentRes && currentRes.customer_name) {
        const match = currentRes.customer_name.match(/\[Game:\s*([^\]]+)\]/i);
        if (match && match[1]) {
          await GameModel.incrementStock(match[1].trim());
        }
      }
    } catch (e) {
      // Abaikan
    }

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Reservation deleted successfully" };
  }
};
