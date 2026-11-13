import { supabase } from "../config/supabaseClient.js";

export const TableModel = {
  async getAll() {
    const { data, error } = await supabase
      .from("cafe_tables")
      .select("*")
      .order("table_number", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("cafe_tables")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("cafe_tables")
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("cafe_tables")
      .update(payload)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async remove(id) {
    const { error } = await supabase
      .from("cafe_tables")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Table deleted successfully" };
  }
};

