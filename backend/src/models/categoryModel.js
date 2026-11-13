import { supabase } from "../config/supabaseClient.js";

export const CategoryModel = {
  async getAll() {
    const { data, error } = await supabase
      .from("game_categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("game_categories")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(name) {
    const { data, error } = await supabase
      .from("game_categories")
      .insert([{ name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

