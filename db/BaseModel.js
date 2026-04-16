/**
 * Base Model Class
 * Provides common CRUD operations and utilities for all models
 */

import { getDatabase } from "./database.js";

export class BaseModel {
  /**
   * Table name - must be overridden by subclasses
   * @type {string}
   */
  static get tableName() {
    throw new Error("Subclasses must define tableName");
  }

  /**
   * Get database instance
   * @returns {Database} SQLite database instance
   */
  static get db() {
    return getDatabase();
  }

  /**
   * Find a record by ID
   * @param {number} id - Record ID
   * @returns {Object|null} Record or null if not found
   */
  static findById(id) {
    const stmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
    );
    return stmt.get(id) || null;
  }

  /**
   * Find all records with optional where clause
   * @param {string} where - Optional WHERE clause
   * @param {Array} params - Parameters for WHERE clause
   * @returns {Array} Array of records
   */
  static findAll(where = "", params = []) {
    let sql = `SELECT * FROM ${this.tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  /**
   * Find a single record with optional where clause
   * @param {string} where - WHERE clause
   * @param {Array} params - Parameters for WHERE clause
   * @returns {Object|null} Record or null if not found
   */
  static findOne(where, params = []) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${where} LIMIT 1`;
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) || null;
  }

  /**
   * Insert a new record
   * @param {Object} data - Record data
   * @returns {Object} Inserted record with ID
   */
  static insert(data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((col) => data[col]);

    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (${columns.join(", ")})
      VALUES (${placeholders})
    `);

    const result = stmt.run(...values);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Update a record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Data to update
   * @returns {Object|null} Updated record or null
   */
  static update(id, data) {
    const columns = Object.keys(data);
    const setClause = columns.map((col) => `${col} = ?`).join(", ");
    const values = [...columns.map((col) => data[col]), id];

    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * Delete a record by ID
   * @param {number} id - Record ID
   * @returns {boolean} True if deleted, false otherwise
   */
  static delete(id) {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Check if a record exists
   * @param {string} where - WHERE clause
   * @param {Array} params - Parameters for WHERE clause
   * @returns {boolean} True if exists
   */
  static exists(where, params = []) {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE ${where} LIMIT 1`;
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) !== undefined;
  }

  /**
   * Count records with optional where clause
   * @param {string} where - Optional WHERE clause
   * @param {Array} params - Parameters for WHERE clause
   * @returns {number} Count of records
   */
  static count(where = "", params = []) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    return result?.count || 0;
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Function to execute within transaction
   * @returns {*} Result of callback
   */
  static transaction(callback) {
    const db = this.db;
    try {
      db.exec("BEGIN TRANSACTION");
      const result = callback();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
