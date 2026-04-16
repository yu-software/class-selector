/**
 * Course Model
 * Manages courses with prerequisites and semester availability
 */

import { BaseModel } from "./BaseModel.js";

export class Course extends BaseModel {
  static get tableName() {
    return "courses";
  }

  /**
   * Create a new course
   * @param {Object} data - Course data
   * @returns {Object} Created course
   */
  static create(data) {
    return this.insert({
      course_code: data.courseCode,
      course_name: data.courseName,
      credit_hours: data.creditHours ?? 3,
      description: data.description ?? null,
    });
  }

  /**
   * Find course by course code
   * @param {string} code - Course code (e.g., 'CS101')
   * @returns {Object|null} Course or null
   */
  static findByCode(code) {
    return this.findOne("course_code = ?", [code]);
  }

  /**
   * Add prerequisite to a course
   * @param {number} courseId - Course ID
   * @param {number} prerequisiteId - Prerequisite course ID
   * @returns {Object} Created prerequisite record
   */
  static addPrerequisite(courseId, prerequisiteId) {
    const db = this.db;
    const stmt = db.prepare(`
      INSERT INTO course_prerequisites (course_id, prerequisite_course_id)
      VALUES (?, ?)
    `);
    const result = stmt.run(courseId, prerequisiteId);
    return db
      .prepare("SELECT * FROM course_prerequisites WHERE id = ?")
      .get(result.lastInsertRowid);
  }

  /**
   * Remove prerequisite from a course
   * @param {number} courseId - Course ID
   * @param {number} prerequisiteId - Prerequisite course ID
   * @returns {boolean} True if removed
   */
  static removePrerequisite(courseId, prerequisiteId) {
    const db = this.db;
    const stmt = db.prepare(`
      DELETE FROM course_prerequisites
      WHERE course_id = ? AND prerequisite_course_id = ?
    `);
    const result = stmt.run(courseId, prerequisiteId);
    return result.changes > 0;
  }

  /**
   * Get all prerequisites for a course
   * @param {number} courseId - Course ID
   * @returns {Array} Array of prerequisite courses
   */
  static getPrerequisites(courseId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT c.* FROM courses c
      JOIN course_prerequisites cp ON c.id = cp.prerequisite_course_id
      WHERE cp.course_id = ?
    `,
      )
      .all(courseId);
  }

  /**
   * Get all courses that have this course as a prerequisite
   * @param {number} courseId - Course ID
   * @returns {Array} Array of dependent courses
   */
  static getDependentCourses(courseId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT c.* FROM courses c
      JOIN course_prerequisites cp ON c.id = cp.course_id
      WHERE cp.prerequisite_course_id = ?
    `,
      )
      .all(courseId);
  }

  /**
   * Check if a student has completed all prerequisites for a course
   * @param {number} courseId - Course ID
   * @param {number} studentId - Student ID
   * @returns {Object} { hasAll: boolean, missing: Array }
   */
  static checkPrerequisitesCompleted(courseId, studentId) {
    const db = this.db;

    // Get all prerequisites
    const prerequisites = this.getPrerequisites(courseId);

    // Get completed courses for student
    const completed = db
      .prepare(
        `
      SELECT course_id FROM course_history
      WHERE student_id = ? AND status = 'completed'
    `,
      )
      .all(studentId)
      .map((row) => row.course_id);

    // Find missing prerequisites
    const missing = prerequisites.filter(
      (prereq) => !completed.includes(prereq.id),
    );

    return {
      hasAll: missing.length === 0,
      missing: missing,
    };
  }

  /**
   * Set course availability for a semester
   * @param {number} courseId - Course ID
   * @param {string} semester - 'Fall', 'Spring', or 'Summer'
   * @param {boolean} isOffered - Whether course is offered
   * @returns {Object} Availability record
   */
  static setAvailability(courseId, semester, isOffered = true) {
    const db = this.db;
    const stmt = db.prepare(`
      INSERT INTO course_availability (course_id, semester, is_offered)
      VALUES (?, ?, ?)
      ON CONFLICT(course_id, semester) DO UPDATE SET is_offered = ?
    `);
    // SQLite requires 0/1 for boolean values
    const offeredValue = isOffered ? 1 : 0;
    stmt.run(courseId, semester, offeredValue, offeredValue);
    return db
      .prepare(
        `
      SELECT * FROM course_availability
      WHERE course_id = ? AND semester = ?
    `,
      )
      .get(courseId, semester);
  }

  /**
   * Check if a course is offered in a specific semester
   * @param {number} courseId - Course ID
   * @param {string} semester - 'Fall', 'Spring', or 'Summer'
   * @returns {boolean} True if offered
   */
  static isOfferedInSemester(courseId, semester) {
    const db = this.db;
    const result = db
      .prepare(
        `
      SELECT is_offered FROM course_availability
      WHERE course_id = ? AND semester = ?
    `,
      )
      .get(courseId, semester);

    return result ? result.is_offered === 1 : false;
  }

  /**
   * Get all courses offered in a specific semester
   * @param {string} semester - 'Fall', 'Spring', or 'Summer'
   * @returns {Array} Array of courses
   */
  static getCoursesBySemester(semester) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT c.* FROM courses c
      JOIN course_availability ca ON c.id = ca.course_id
      WHERE ca.semester = ? AND ca.is_offered = 1 AND c.is_active = 1
    `,
      )
      .all(semester);
  }

  /**
   * Get all semesters a course is offered
   * @param {number} courseId - Course ID
   * @returns {Array} Array of semester names
   */
  static getOfferedSemesters(courseId) {
    const db = this.db;
    const results = db
      .prepare(
        `
      SELECT semester FROM course_availability
      WHERE course_id = ? AND is_offered = 1
    `,
      )
      .all(courseId);
    return results.map((r) => r.semester);
  }

  /**
   * Search courses by code or name
   * @param {string} query - Search query
   * @returns {Array} Array of matching courses
   */
  static search(query) {
    const searchTerm = `%${query}%`;
    return this.findAll(
      "(course_code LIKE ? OR course_name LIKE ?) AND is_active = 1",
      [searchTerm, searchTerm],
    );
  }

  /**
   * Get course with full details including prerequisites and availability
   * @param {number} id - Course ID
   * @returns {Object|null} Course with details or null
   */
  static getFullDetails(id) {
    const course = this.findById(id);
    if (!course) return null;

    return {
      ...course,
      prerequisites: this.getPrerequisites(id),
      offeredSemesters: this.getOfferedSemesters(id),
      dependents: this.getDependentCourses(id),
    };
  }
}
