/**
 * AcademicPlan Model
 * Stores generated semester-by-semester plans for students
 */

import { BaseModel } from "./BaseModel.js";

export class AcademicPlan extends BaseModel {
  static get tableName() {
    return "academic_plans";
  }

  /**
   * Add a course to a student's academic plan
   * @param {Object} data - Plan data
   * @returns {Object} Created plan record
   */
  static addCourse(data) {
    return this.insert({
      student_id: data.studentId,
      course_id: data.courseId,
      planned_semester: data.plannedSemester,
      planned_year: data.plannedYear,
      status: "planned",
      notes: data.notes ?? null,
    });
  }

  /**
   * Add multiple courses to a student's plan
   * @param {number} studentId - Student ID
   * @param {Array} courses - Array of { courseId, plannedSemester, plannedYear, notes }
   * @returns {Array} Created plan records
   */
  static addMultipleCourses(studentId, courses) {
    const db = this.db;
    const created = [];

    db.transaction(() => {
      for (const course of courses) {
        const exists = this.exists(
          "student_id = ? AND course_id = ? AND planned_semester = ? AND planned_year = ?",
          [
            studentId,
            course.courseId,
            course.plannedSemester,
            course.plannedYear,
          ],
        );

        if (exists) {
          // Skip duplicate plan entries instead of throwing UNIQUE constraint
          continue;
        }

        const plan = this.insert({
          student_id: studentId,
          course_id: course.courseId,
          planned_semester: course.plannedSemester,
          planned_year: course.plannedYear,
          status: "planned",
          notes: course.notes ?? null,
        });
        created.push(plan);
      }
    })();

    return created;
  }

  /**
   * Remove a course from a student's plan
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @param {string} semester - Planned semester
   * @param {number} year - Planned year
   * @returns {boolean} True if removed
   */
  static removeCourse(studentId, courseId, semester, year) {
    const db = this.db;
    const stmt = db.prepare(`
      DELETE FROM academic_plans
      WHERE student_id = ? AND course_id = ? AND planned_semester = ? AND planned_year = ?
    `);
    const result = stmt.run(studentId, courseId, semester, year);
    return result.changes > 0;
  }

  /**
   * Update plan record
   * @param {number} id - Plan record ID
   * @param {Object} data - Update data
   * @returns {Object|null} Updated record or null
   */
  static updatePlan(id, data) {
    const allowedFields = [
      "planned_semester",
      "planned_year",
      "status",
      "notes",
    ];
    const filteredData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filteredData[
          field === "planned_semester"
            ? "planned_semester"
            : field === "planned_year"
              ? "planned_year"
              : field === "status"
                ? "status"
                : "notes"
        ] = data[field];
      }
    }

    return this.update(id, filteredData);
  }

  /**
   * Get full academic plan for a student
   * @param {number} studentId - Student ID
   * @returns {Array} Array of planned courses with details
   */
  static getStudentPlan(studentId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT ap.*, c.course_code, c.course_name, c.credit_hours
      FROM academic_plans ap
      JOIN courses c ON ap.course_id = c.id
      WHERE ap.student_id = ?
      ORDER BY ap.planned_year, ap.planned_semester, c.course_code
    `,
      )
      .all(studentId);
  }

  /**
   * Get academic plan grouped by semester
   * @param {number} studentId - Student ID
   * @returns {Array} Array of semesters with courses
   */
  static getPlanBySemester(studentId) {
    const plans = this.getStudentPlan(studentId);

    return Object.values(
      plans.reduce((acc, plan) => {
        const key = `${plan.planned_semester}_${plan.planned_year}`;
        if (!acc[key]) {
          acc[key] = {
            semester: plan.planned_semester,
            year: plan.planned_year,
            courses: [],
            totalCredits: 0,
          };
        }
        acc[key].courses.push({
          id: plan.course_id,
          planId: plan.id,
          code: plan.course_code,
          name: plan.course_name,
          creditHours: plan.credit_hours,
          status: plan.status,
          notes: plan.notes,
        });
        acc[key].totalCredits += plan.credit_hours;
        return acc;
      }, {}),
    );
  }

  /**
   * Get planned courses for a specific semester
   * @param {number} studentId - Student ID
   * @param {string} semester - 'Fall', 'Spring', or 'Summer'
   * @param {number} year - Year
   * @returns {Array} Array of planned courses
   */
  static getCoursesForSemester(studentId, semester, year) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT ap.*, c.course_code, c.course_name, c.credit_hours
      FROM academic_plans ap
      JOIN courses c ON ap.course_id = c.id
      WHERE ap.student_id = ?
        AND ap.planned_semester = ?
        AND ap.planned_year = ?
      ORDER BY c.course_code
    `,
      )
      .all(studentId, semester, year);
  }

  /**
   * Get total planned credit hours for a student
   * @param {number} studentId - Student ID
   * @returns {number} Total planned credits
   */
  static getTotalPlannedCredits(studentId) {
    const db = this.db;
    const result = db
      .prepare(
        `
      SELECT SUM(c.credit_hours) as total
      FROM academic_plans ap
      JOIN courses c ON ap.course_id = c.id
      WHERE ap.student_id = ?
    `,
      )
      .get(studentId);

    return result?.total || 0;
  }

  /**
   * Check if a course is already in student's plan
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @returns {boolean} True if already planned
   */
  static isCoursePlanned(studentId, courseId) {
    return this.exists(
      "student_id = ? AND course_id = ? AND status = 'planned'",
      [studentId, courseId],
    );
  }

  /**
   * Mark a planned course as completed
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @returns {Object|null} Updated record or null
   */
  static markAsCompleted(studentId, courseId) {
    const plan = this.findOne(
      "student_id = ? AND course_id = ? AND status = 'planned'",
      [studentId, courseId],
    );
    if (!plan) return null;

    return this.update(plan.id, { status: "completed" });
  }

  /**
   * Get all unique semesters in a student's plan
   * @param {number} studentId - Student ID
   * @returns {Array} Array of { semester, year } objects
   */
  static getPlannedSemesters(studentId) {
    const db = this.db;
    return db
      .prepare(
        `
      SELECT DISTINCT planned_semester as semester, planned_year as year
      FROM academic_plans
      WHERE student_id = ?
      ORDER BY planned_year, planned_semester
    `,
      )
      .all(studentId);
  }

  /**
   * Clear all planned courses for a student (or for a specific semester)
   * @param {number} studentId - Student ID
   * @param {string} semester - Optional semester to clear
   * @param {number} year - Optional year to clear
   * @returns {number} Number of records deleted
   */
  static clearPlan(studentId, semester = null, year = null) {
    const db = this.db;
    let sql =
      "DELETE FROM academic_plans WHERE student_id = ? AND status = 'planned'";
    const params = [studentId];

    if (semester && year) {
      sql += " AND planned_semester = ? AND planned_year = ?";
      params.push(semester, year);
    }

    const result = db.prepare(sql).run(...params);
    return result.changes;
  }

  /**
   * Verify student can access their own plan (data isolation)
   * @param {number} requestingUserId - User requesting access
   * @param {number} studentId - Student whose plan is being accessed
   * @returns {boolean} True if access allowed
   */
  static canAccess(requestingUserId, studentId) {
    // Students can only view/edit their own plan
    return requestingUserId === studentId;
  }

  /**
   * Copy a student's plan to create a new version
   * @param {number} studentId - Student ID
   * @param {number} yearOffset - Years to shift the plan (e.g., 1 for next year)
   * @returns {Array} New plan records
   */
  static copyPlan(studentId, yearOffset = 0) {
    const existing = this.getStudentPlan(studentId);

    const courses = existing.map((plan) => ({
      courseId: plan.course_id,
      plannedSemester: plan.planned_semester,
      plannedYear: plan.planned_year + yearOffset,
      notes: plan.notes,
    }));

    return this.addMultipleCourses(studentId, courses);
  }
}
