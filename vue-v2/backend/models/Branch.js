const pool = require('../config/database');

class Branch {
  static async findAll() {
    const result = await pool.query(`
      SELECT id, name, parent_id 
      FROM branches 
      ORDER BY name
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, parent_id FROM branches WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create(name, parentId = null) {
    const result = await pool.query(
      'INSERT INTO branches (name, parent_id) VALUES ($1, $2) RETURNING *',
      [name, parentId]
    );
    return result.rows[0];
  }

  static async update(id, name, parentId = null) {
    const result = await pool.query(
      'UPDATE branches SET name = $1, parent_id = $2 WHERE id = $3 RETURNING *',
      [name, parentId, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM branches WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async getTree() {
    const branches = await this.findAll();
    const branchMap = {};
    const rootBranches = [];

    // Создаем карту веток с пустыми массивами children
    branches.forEach(branch => {
      branchMap[branch.id] = {
        ...branch,
        children: []
      };
    });

    // Строим дерево
    branches.forEach(branch => {
      if (branch.parent_id === null) {
        rootBranches.push(branchMap[branch.id]);
      } else {
        if (branchMap[branch.parent_id]) {
          branchMap[branch.parent_id].children.push(branchMap[branch.id]);
        }
      }
    });

    return rootBranches;
  }
}

module.exports = Branch;