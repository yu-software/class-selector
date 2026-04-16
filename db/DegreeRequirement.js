/**
 * DegreeRequirement Model
 * Maps majors to required courses for graduation
 */

import { BaseModel } from "./BaseModel.js";

export class DegreeRequirement extends BaseModel {
  static get tableName() {
    return "degree_requirements";
  }

  /**
   * Add a course requirement for a major
   * @param {Object} data - Requirement data
   * @returns {Object} Created requirement
   */
  static addRequirement(data) {
    return this.insert({
      major: data.major,
      course_id: data.courseId,
      requirement_type: data.requirementType ?? "required",
      catalog_year: data.catalogYear,
    });
  }

  /**
   * Remove a requirement for a major
   * @param {number} id - Requirement ID
   * @returns {boolean} True if removed
   */
  static removeRequirement(id) {
    return this.update(id, { is_active: 0 });
  }

  /**
   * Get all requirements for a major and catalog year
   * @param {string} major - Major name
   * @param {number} catalogYear - Catalog year
   * @returns {Array} Array of required courses with details
   */
  static getRequirementsForMajor(major, catalogYear) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT dr.*, c.course_code, c.course_name, c.credit_hours
      FROM degree_requirements dr
      JOIN courses c ON dr.course_id = c.id
      WHERE dr.major = ?
        AND dr.catalog_year = ?
        AND dr.is_active = 1
      ORDER BY dr.requirement_type, c.course_code
    `,
      )
      .all(major, catalogYear);
  }

  /**
   * Get all requirements for a major (latest catalog year)
   * @param {string} major - Major name
   * @returns {Array} Array of required courses
   */
  static getCurrentRequirements(major) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT dr.*, c.course_code, c.course_name, c.credit_hours
      FROM degree_requirements dr
      JOIN courses c ON dr.course_id = c.id
      WHERE dr.major = ?
        AND dr.catalog_year = (
          SELECT MAX(catalog_year) FROM degree_requirements WHERE major = ? AND is_active = 1
        )
        AND dr.is_active = 1
      ORDER BY dr.requirement_type, c.course_code
    `,
      )
      .all(major, major);
  }

  /**
   * Check if a course is required for a major
   * @param {string} major - Major name
   * @param {number} courseId - Course ID
   * @param {number} catalogYear - Catalog year
   * @returns {boolean} True if required
   */
  static isRequired(major, courseId, catalogYear) {
    return this.exists(
      "major = ? AND course_id = ? AND catalog_year = ? AND is_active = 1",
      [major, courseId, catalogYear],
    );
  }

  /**
   * Get all available catalog years for a major
   * @param {string} major - Major name
   * @returns {Array} Array of catalog years
   */
  static getCatalogYears(major) {
    const db = this.db;
    const results = db
      .prepare(
        `
      SELECT DISTINCT catalog_year FROM degree_requirements
      WHERE major = ? AND is_active = 1
      ORDER BY catalog_year DESC
    `,
      )
      .all(major);
    return results.map((r) => r.catalog_year);
  }

  /**
   * Get requirements grouped by type for a major
   * @param {string} major - Major name
   * @param {number} catalogYear - Catalog year
   * @returns {Object} Requirements grouped by type
   */
  static getRequirementsByType(major, catalogYear) {
    const requirements = this.getRequirementsForMajor(major, catalogYear);

    return requirements.reduce(
      (acc, req) => {
        const type = req.requirement_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({
          id: req.course_id,
          code: req.course_code,
          name: req.course_name,
          creditHours: req.credit_hours,
        });
        return acc;
      },
      {
        required: [],
        core: [],
        elective: [],
      },
    );
  }

  /**
   * Bulk add requirements for a major
   * @param {string} major - Major name
   * @param {number} catalogYear - Catalog year
   * @param {Array} courses - Array of { courseId, requirementType }
   * @returns {Array} Created requirements
   */
  static bulkAddRequirements(major, catalogYear, courses) {
    const db = this.db;
    const created = [];

    db.transaction(() => {
      for (const course of courses) {
        const req = this.insert({
          major,
          course_id: course.courseId,
          requirement_type: course.requirementType ?? "required",
          catalog_year: catalogYear,
        });
        created.push(req);
      }
    })();

    return created;
  }

  /**
   * Update requirements for a new catalog year (copy from previous)
   * @param {string} major - Major name
   * @param {number} fromCatalogYear - Source catalog year
   * @param {number} toCatalogYear - Target catalog year
   * @returns {Array} New requirements
   */
  static copyRequirementsToNewCatalog(major, fromCatalogYear, toCatalogYear) {
    const existing = this.getRequirementsForMajor(major, fromCatalogYear);

    return this.bulkAddRequirements(
      major,
      toCatalogYear,
      existing.map((req) => ({
        courseId: req.course_id,
        requirementType: req.requirement_type,
      })),
    );
  }

  /**
   * Get count of requirements by type
   * @param {string} major - Major name
   * @param {number} catalogYear - Catalog year
   * @returns {Object} Counts by type
   */
  static getCountByType(major, catalogYear) {
    const db = this.db;
    const results = db
      .prepare(
        `
      SELECT requirement_type, COUNT(*) as count
      FROM degree_requirements
      WHERE major = ? AND catalog_year = ? AND is_active = 1
      GROUP BY requirement_type
    `,
      )
      .all(major, catalogYear);

    return results.reduce((acc, row) => {
      acc[row.requirement_type] = row.count;
      return acc;
    }, {});
  }
}
