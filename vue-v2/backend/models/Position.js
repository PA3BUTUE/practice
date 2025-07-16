const pool = require('../config/database');

class Position {
  static async findAll() {
    const result = await pool.query('SELECT id, name FROM positions ORDER BY name');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, name FROM positions WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(name) {
    const result = await pool.query(
      'INSERT INTO positions (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  static async update(id, name) {
    const result = await pool.query(
      'UPDATE positions SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM positions WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

module.exports = Position;