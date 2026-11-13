import { CategoryModel } from "../models/categoryModel.js";

export const CategoryController = {
  async getAll(req, res) {
    try {
      const categories = await CategoryModel.getAll();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.getById(id);
      res.json(category);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const category = await CategoryModel.create(name);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

