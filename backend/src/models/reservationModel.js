import { supabase } from "../config/supabaseClient.js";

export const ReservationModel = {
  async getAll() {
    // Try selecting with game_title and game_id first
    let query = supabase
      .from("reservations")
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at, game_title, game_id,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .order("created_at", { ascending: false });

    let { data, error } = await query;

    // Fallback if game_title column not created yet in DB
    if (error && error.code === "PGRST204") {
      const fallbackQuery = await supabase
        .from("reservations")
        .select(`
          id, booking_code, customer_name, customer_phone,
          table_id, reservation_date, session_time, guest_count,
          status, created_at,
          cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
        `)
        .order("created_at", { ascending: false });
      if (fallbackQuery.error) throw fallbackQuery.error;
      return fallbackQuery.data;
    }

    if (error) throw error;
    return data;
  },

  async getById(id) {
    let { data, error } = await supabase
      .from("reservations")
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at, game_title, game_id,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST204") {
      const fallbackQuery = await supabase
        .from("reservations")
        .select(`
          id, booking_code, customer_name, customer_phone,
          table_id, reservation_date, session_time, guest_count,
          status, created_at,
          cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
        `)
        .eq("id", id)
        .single();
      if (fallbackQuery.error) throw fallbackQuery.error;
      return fallbackQuery.data;
    }

    if (error) throw error;
    return data;
  },

  async create(payload) {
    if (!payload.booking_code) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      payload.booking_code = `MC-${randomCode}`;
    }

    // Attempt insert with game fields
    let { data, error } = await supabase
      .from("reservations")
      .insert([payload])
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .single();

    // If column game_title or game_id doesn't exist yet, gracefully format into customer_name
    if (error && error.code === "PGRST204") {
      const sanitized = { ...payload };
      if (sanitized.game_title && !sanitized.customer_name.includes("[Game:")) {
        sanitized.customer_name = `${sanitized.customer_name} [Game: ${sanitized.game_title}]`;
      }
      delete sanitized.game_title;
      delete sanitized.game_id;

      const fallbackInsert = await supabase
        .from("reservations")
        .insert([sanitized])
        .select(`
          id, booking_code, customer_name, customer_phone,
          table_id, reservation_date, session_time, guest_count,
          status, created_at,
          cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
        `)
        .single();

      if (fallbackInsert.error) throw fallbackInsert.error;
      return fallbackInsert.data;
    }

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
