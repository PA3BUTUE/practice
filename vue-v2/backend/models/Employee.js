const pool = require('../config/database');

class Employee {
  static async findAll() {
    const result = await pool.query(`
      SELECT e.id, e.full_name, e.salary, e.hire_date, e.birth_date, e.branch_id,
             p.name as position_name, p.id as position_id,
             b.name as branch_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN branches b ON e.branch_id = b.id
      ORDER BY e.full_name
    `);
    return result.rows;
  }

  static async findByBranch(branchId) {
    const result = await pool.query(`
      SELECT e.id, e.full_name, e.salary, e.hire_date, e.birth_date, e.branch_id,
             p.name as position_name, p.id as position_id,
             b.name as branch_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.branch_id = $1
      ORDER BY e.full_name
    `, [branchId]);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT e.id, e.full_name, e.salary, e.hire_date, e.birth_date, e.branch_id,
             p.name as position_name, p.id as position_id,
             b.name as branch_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { fullname, positionId, salary, hireDate, birthDate, branchId } = data;
    const result = await pool.query(`
      INSERT INTO employees (full_name, position_id, salary, hire_date, birth_date, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [fullname, positionId, salary, hireDate, birthDate, branchId]);
    return result.rows[0];
  }

  static async update(id, data) {
    const { fullname, positionId, salary, hireDate, birthDate, branchId } = data;
    const result = await pool.query(`
      UPDATE employees 
      SET full_name = $1, position_id = $2, salary = $3, hire_date = $4, birth_date = $5, branch_id = $6
      WHERE id = $7
      RETURNING *
    `, [fullname, positionId, salary, hireDate, birthDate, branchId, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async getByBranchTree(branchId) {
    // Получаем всех сотрудников из ветки и всех её дочерних веток
    const result = await pool.query(`
      WITH RECURSIVE branch_tree AS (
        SELECT id, name, parent_id, 0 as level
        FROM branches
        WHERE id = $1
        
        UNION ALL
        
        SELECT b.id, b.name, b.parent_id, bt.level + 1
        FROM branches b
        JOIN branch_tree bt ON b.parent_id = bt.id
      )
      SELECT e.id, e.full_name, e.salary, e.hire_date, e.birth_date, e.branch_id,
             p.name as position_name, p.id as position_id,
             b.name as branch_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.branch_id IN (SELECT id FROM branch_tree)
      ORDER BY e.full_name
    `, [branchId]);
    return result.rows;
  }
}

module.exports = Employee;