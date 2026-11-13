import { GameModel } from "../models/gameModel.js";

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
  }
};

