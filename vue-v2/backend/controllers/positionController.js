const Position = require('../models/Position');

const positionController = {
  async getAll(req, res) {
    try {
      const positions = await Position.findAll();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const position = await Position.findById(req.params.id);
      if (!position) {
        return res.status(404).json({ error: 'Position not found' });
      }
      res.json(position);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body;
      const position = await Position.create(name);
      res.status(201).json(position);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { name } = req.body;
      const position = await Position.update(req.params.id, name);
      if (!position) {
        return res.status(404).json({ error: 'Position not found' });
      }
      res.json(position);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Position.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Position not found' });
      }
      res.json({ message: 'Position deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = positionController;