import { supabase } from "../config/supabaseClient.js";

export const ReservationModel = {
  async getAll() {
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id, booking_code, customer_name, customer_phone,
        table_id, reservation_date, session_time, guest_count,
        status, created_at,
        cafe_tables ( id, table_number, table_type, price_per_hour, image_url )
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
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

  async create(payload) {
    // Generate readable booking code if not provided, e.g. MC-XXXX
    if (!payload.booking_code) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      payload.booking_code = `MC-${randomCode}`;
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert([payload])
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

