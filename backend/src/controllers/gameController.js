import { GameModel } from "../models/gameModel.js";
import { supabase } from "../config/supabaseClient.js";

export const GameController = {
  async getAll(req, res) {
    try {
      const { category } = req.query;
      const games = await GameModel.getAll(category);
      res.json(games);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const game = await GameModel.getById(id);
      res.json(game);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { title, category_id, min_players, max_players, duration_minutes, difficulty } = req.body;
      if (!title || !min_players || !max_players) {
        return res.status(400).json({ error: "Title and player capacity are required" });
      }
      const game = await GameModel.create(req.body);
      res.status(201).json(game);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const game = await GameModel.update(id, req.body);
      res.json(game);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const result = await GameModel.remove(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // POST /api/games/upload-image (Upload foto cover game ke cloud storage)
  async uploadImage(req, res) {
    try {
      const { base64, mimeType = "image/jpeg" } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "Data gambar (base64) wajib disertakan" });
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const fileName = `game-${Date.now()}.${ext}`;

      let imageUrl = null;

      // 1. Coba upload ke Supabase Storage bucket 'games'
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("games")
          .upload(`covers/${fileName}`, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = supabase.storage
            .from("games")
            .getPublicUrl(`covers/${fileName}`);
          imageUrl = publicData?.publicUrl || null;
        } else {
          // Fallback ke bucket 'avatars/games' yang sudah aktif
          const { data: avatarUpload, error: avatarErr } = await supabase.storage
            .from("avatars")
            .upload(`games/${fileName}`, buffer, {
              contentType: mimeType,
              upsert: true
            });
          if (!avatarErr && avatarUpload) {
            const { data: publicData } = supabase.storage
              .from("avatars")
              .getPublicUrl(`games/${fileName}`);
            imageUrl = publicData?.publicUrl || null;
          }
        }
      } catch (e) {
        console.warn("Storage upload note:", e.message);
      }

      // 2. Fallback base64 jika cloud storage offline
      if (!imageUrl) {
        imageUrl = `data:${mimeType};base64,${cleanBase64}`;
      }

      return res.json({
        message: "Gambar berhasil diunggah!",
        imageUrl
      });
    } catch (err) {
      console.error("Upload game image error:", err);
      return res.status(500).json({ error: err.message || "Gagal mengunggah gambar game" });
    }
  }
};

