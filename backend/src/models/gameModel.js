import { supabase } from "../config/supabaseClient.js";

export const GameModel = {
  async getAll(category) {
    let query = supabase
      .from("board_games")
      .select(`
        id, title, category_id, min_players, max_players,
        duration_minutes, difficulty, image_url, description,
        rules_summary, is_available, created_at,
        game_categories ( id, name )
      `)
      .order("title", { ascending: true });

    if (category) {
      query = query.eq("category_id", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
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
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("board_games")
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("board_games")
      .update(payload)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async remove(id) {
    const { error } = await supabase
      .from("board_games")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { message: "Board game deleted successfully" };
  }
};

