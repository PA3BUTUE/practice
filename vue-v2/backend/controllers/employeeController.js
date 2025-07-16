const Employee = require('../models/Employee');

const employeeController = {
  async getAll(req, res) {
    try {
      const employees = await Employee.findAll();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByBranch(req, res) {
    try {
      const employees = await Employee.findByBranch(req.params.branchId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByBranchTree(req, res) {
    try {
      const employees = await Employee.getByBranchTree(req.params.branchId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const employee = await Employee.create(req.body);
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const employee = await Employee.update(req.params.id, req.body);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await Employee.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = employeeController;