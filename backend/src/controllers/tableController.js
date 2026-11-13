import { TableModel } from "../models/tableModel.js";

export const TableController = {
  async getAll(req, res) {
    try {
      const tables = await TableModel.getAll();
      res.json(tables);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const table = await TableModel.getById(id);
      res.json(table);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { table_number, table_type, capacity } = req.body;
      if (!table_number || !table_type || !capacity) {
        return res.status(400).json({ error: "Table number, type, and capacity are required" });
      }
      const table = await TableModel.create(req.body);
      res.status(201).json(table);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const table = await TableModel.update(id, req.body);
      res.json(table);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const result = await TableModel.remove(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

