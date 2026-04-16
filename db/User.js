/**
 * User Model
 * Manages student/user profiles with authentication
 */

import { BaseModel } from "./BaseModel.js";
import bcrypt from "bcrypt";

export class User extends BaseModel {
  static get tableName() {
    return "users";
  }

  /**
   * Create a new user with hashed password
   * @param {Object} data - User data
   * @returns {Object} Created user (without password hash)
   */
  static create(data) {
    const { password, ...userData } = data;
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = this.insert({
      ...userData,
      password_hash: passwordHash,
    });

    return this.#sanitizeUser(user);
  }

  /**
   * Find user by email for login
   * @param {string} email - User email
   * @returns {Object|null} User or null
   */
  static findByEmail(email) {
    return this.findOne("email = ?", [email]);
  }

  /**
   * Authenticate user with password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Object|null} User object (sanitized) if valid, null otherwise
   */
  static authenticate(email, password) {
    const user = this.findByEmail(email);
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return null;

    return this.#sanitizeUser(user);
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Object|null} Updated user or null
   */
  static updatePassword(id, newPassword) {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    return this.update(id, { password_hash: passwordHash });
  }

  /**
   * Verify password for a user
   * @param {Object} user - User object
   * @param {string} password - Plain text password to verify
   * @returns {boolean} True if password matches
   */
  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  /**
   * Get user's completed courses
   * @param {number} userId - User ID
   * @returns {Array} Array of completed course records
   */
  static getCompletedCourses(userId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT c.* FROM courses c
      JOIN course_history ch ON c.id = ch.course_id
      WHERE ch.student_id = ? AND ch.status = 'completed'
    `,
      )
      .all(userId);
  }

  /**
   * Get user's academic plan
   * @param {number} userId - User ID
   * @returns {Array} Array of planned courses grouped by semester
   */
  static getAcademicPlan(userId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT ap.*, c.course_code, c.course_name, c.credit_hours
      FROM academic_plans ap
      JOIN courses c ON ap.course_id = c.id
      WHERE ap.student_id = ?
      ORDER BY ap.planned_year, ap.planned_semester
    `,
      )
      .all(userId);
  }

  /**
   * Get user's degree requirements
   * @param {number} userId - User ID
   * @returns {Array} Array of required courses for user's major
   */
  static getDegreeRequirements(userId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT dr.*, c.course_code, c.course_name
      FROM degree_requirements dr
      JOIN courses c ON dr.course_id = c.id
      WHERE dr.major = (SELECT declared_major FROM users WHERE id = ?)
        AND dr.catalog_year = (SELECT catalog_year FROM users WHERE id = ?)
        AND dr.is_active = 1
    `,
      )
      .all(userId, userId);
  }

  /**
   * Sanitize user object (remove sensitive data)
   * @param {Object} user - User object with password_hash
   * @returns {Object} User object without password_hash
   */
  static #sanitizeUser(user) {
    if (!user) return null;
    const { password_hash: _, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Check if user can access a resource (data isolation)
   * @param {number} userId - User ID requesting access
   * @param {number} targetUserId - Target user ID of the resource
   * @returns {boolean} True if user can access
   */
  static canAccess(userId, targetUserId) {
    // Users can only access their own data
    return userId === targetUserId;
  }

  /**
   * Get student profile with full details
   * @param {number} id - User ID
   * @returns {Object|null} Student profile or null
   */
  static getProfile(id) {
    const user = this.findById(id);
    if (!user) return null;
    return this.#sanitizeUser(user);
  }

  /**
   * Update student profile
   * @param {number} id - User ID
   * @param {Object} data - Profile data to update
   * @returns {Object|null} Updated profile or null
   */
  static updateProfile(id, data) {
    const allowedFields = [
      "name",
      "declared_major",
      "current_semester",
      "planned_graduation_semester",
      "planned_graduation_year",
      "catalog_year",
    ];
    const filteredData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    }

    return this.update(id, filteredData);
  }
}
