import { ReservationModel } from "../models/reservationModel.js";

export const ReservationController = {
  async getAll(req, res) {
    try {
      const reservations = await ReservationModel.getAll();
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
      res.status(400).json({ error: err.message });
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
  }
};

