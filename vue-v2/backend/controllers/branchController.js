const Branch = require('../models/Branch');

const branchController = {
  async getAll(req, res) {
    try {
      const branches = await Branch.findAll();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getTree(req, res) {
    try {
      const tree = await Branch.getTree();
      res.json(tree);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const branch = await Branch.findById(req.params.id);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, parent_id } = req.body;
      const branch = await Branch.create(name, parent_id);
      res.status(201).json(branch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { name, parent_id } = req.body;
      const branch = await Branch.update(req.params.id, name, parent_id);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Branch.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = branchController;