import { ReservationModel } from "../models/reservationModel.js";
import { supabase } from "../config/supabaseClient.js";

export const ReservationController = {
  async getAll(req, res) {
    try {
      const { user_id, username, customer_name, customer_phone } = req.query;
      const reservations = await ReservationModel.getAll({ user_id, username, customer_name, customer_phone });
      res.json(reservations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const reservation = await ReservationModel.getById(id);
      res.json(reservation);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async checkAvailability(req, res) {
    try {
      const { date, table_id, game_title } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }
      const availability = await ReservationModel.checkAvailability(date, table_id, game_title);
      res.json(availability);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { customer_name, customer_phone, table_id, reservation_date, session_time, guest_count } = req.body;
      if (!customer_name || !customer_phone || !table_id || !reservation_date || !session_time || !guest_count) {
        return res.status(400).json({
          error: "All reservation fields are required: customer_name, customer_phone, table_id, reservation_date, session_time, guest_count"
        });
      }
      const reservation = await ReservationModel.create(req.body);
      res.status(201).json(reservation);
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });
      const reservation = await ReservationModel.updateStatus(id, status);
      res.json(reservation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const result = await ReservationModel.remove(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // POST /api/reservations/upload-proof (Upload bukti transfer tiket ke bucket 'tickets')
  async uploadProof(req, res) {
    try {
      const { base64, mimeType = "image/jpeg" } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "Data gambar (base64) wajib disertakan" });
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const fileName = `ticket-proof-${Date.now()}.${ext}`;

      let imageUrl = null;

      // 1. Coba upload ke Supabase Storage bucket khusus 'tickets'
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("tickets")
          .upload(`proofs/${fileName}`, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: publicData } = supabase.storage
            .from("tickets")
            .getPublicUrl(`proofs/${fileName}`);
          imageUrl = publicData?.publicUrl || null;
        } else {
          // Fallback ke bucket 'avatars/tickets' jika bucket 'tickets' belum dibuat
          const { data: fallbackUpload, error: fallbackErr } = await supabase.storage
            .from("avatars")
            .upload(`tickets/${fileName}`, buffer, {
              contentType: mimeType,
              upsert: true
            });
          if (!fallbackErr && fallbackUpload) {
            const { data: publicData } = supabase.storage
              .from("avatars")
              .getPublicUrl(`tickets/${fileName}`);
            imageUrl = publicData?.publicUrl || null;
          }
        }
      } catch (e) {
        console.warn("Storage upload tickets note:", e.message);
      }

      // 2. Fallback base64 jika cloud storage offline
      if (!imageUrl) {
        imageUrl = `data:${mimeType};base64,${cleanBase64}`;
      }

      return res.json({
        message: "Bukti transfer berhasil diunggah!",
        imageUrl
      });
    } catch (err) {
      console.error("Upload payment proof error:", err);
      return res.status(500).json({ error: err.message || "Gagal mengunggah bukti transfer" });
    }
  }
};
