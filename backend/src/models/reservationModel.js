import { supabase } from "../config/supabaseClient.js";

export const ReservationModel = {
  async getAll() {
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
    // 1. VALIDASI KONFLIK JADWAL (Mencegah double booking meja & game)
    const { data: existingBookings, error: checkError } = await supabase
      .from("reservations")
      .select("id, booking_code, table_id, session_time, customer_name")
      .eq("reservation_date", payload.reservation_date)
      .eq("session_time", payload.session_time);

    if (existingBookings && existingBookings.length > 0) {
      // Cek apakah meja ini sudah dibooking orang pada sesi tersebut
      const tableConflict = existingBookings.find((b) => b.table_id === payload.table_id);
      if (tableConflict) {
        const err = new Error(
          `Meja ini sudah direservasi pelanggan lain pada ${payload.session_time}. Silakan pilih sesi jam lain atau meja lain!`
        );
        err.status = 409;
        throw err;
      }

      // Cek apakah game ini sudah dipinjam di meja lain pada sesi yang sama (stok habis)
      if (payload.game_title) {
        const gameConflict = existingBookings.filter((b) => {
          return (
            b.customer_name && b.customer_name.toLowerCase().includes(payload.game_title.toLowerCase())
          );
        });

        if (gameConflict.length >= 1) {
          const err = new Error(
            `Stok game "${payload.game_title}" sedang habis/dipinjam pada ${payload.session_time}. Silakan pilih sesi jam berikutnya!`
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
    return data;
  },

  async updateStatus(id, status) {
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
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Reservation deleted successfully" };
  }
};
