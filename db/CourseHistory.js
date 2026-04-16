/**
 * CourseHistory Model
 * Records of courses completed by students
 */

import { BaseModel } from "./BaseModel.js";

export class CourseHistory extends BaseModel {
  static get tableName() {
    return "course_history";
  }

  /**
   * Record a completed course for a student
   * @param {Object} data - History data
   * @returns {Object} Created record
   */
  static recordCompletion(data) {
    return this.insert({
      student_id: data.studentId,
      course_id: data.courseId,
      status: "completed",
      grade: data.grade ?? null,
      semester_taken: data.semesterTaken,
      year_taken: data.yearTaken,
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Record a course in progress
   * @param {Object} data - History data
   * @returns {Object} Created record
   */
  static recordInProgress(data) {
    return this.insert({
      student_id: data.studentId,
      course_id: data.courseId,
      status: "in_progress",
      semester_taken: data.semesterTaken,
      year_taken: data.yearTaken,
    });
  }

  /**
   * Update course status (e.g., from in_progress to completed)
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @param {Object} data - Update data
   * @returns {Object|null} Updated record or null
   */
  static updateCourseStatus(studentId, courseId, data) {
    // Find existing record
    const existing = this.findOne("student_id = ? AND course_id = ?", [
      studentId,
      courseId,
    ]);

    if (!existing) {
      return this.insert({
        student_id: studentId,
        course_id: courseId,
        ...data,
        completed_at:
          data.status === "completed" ? new Date().toISOString() : null,
      });
    }

    const updateData = { ...data };
    if (data.status === "completed" && !data.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    return this.update(existing.id, updateData);
  }

  /**
   * Get all courses for a student
   * @param {number} studentId - Student ID
   * @param {string} status - Optional status filter
   * @returns {Array} Array of course history records with course details
   */
  static getStudentHistory(studentId, status = null) {
    const db = this.db;

    let query = `
      SELECT ch.*, c.course_code, c.course_name, c.credit_hours
      FROM course_history ch
      JOIN courses c ON ch.course_id = c.id
      WHERE ch.student_id = ?
    `;

    const params = [studentId];

    if (status) {
      query += ` AND ch.status = ?`;
      params.push(status);
    }

    query += " ORDER BY ch.year_taken DESC, ch.semester_taken DESC";

    return db.prepare(query).all(...params);
  }

  /**
   * Get completed courses for a student
   * @param {number} studentId - Student ID
   * @returns {Array} Array of completed courses
   */
  static getCompletedCourses(studentId) {
    return this.getStudentHistory(studentId, "completed");
  }

  /**
   * Get courses in progress for a student
   * @param {number} studentId - Student ID
   * @returns {Array} Array of in-progress courses
   */
  static getInProgressCourses(studentId) {
    return this.getStudentHistory(studentId, "in_progress");
  }

  /**
   * Check if student has completed a specific course
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @returns {boolean} True if completed
   */
  static hasCompleted(studentId, courseId) {
    return this.exists(
      "student_id = ? AND course_id = ? AND status = 'completed'",
      [studentId, courseId],
    );
  }

  /**
   * Get total credit hours completed by student
   * @param {number} studentId - Student ID
   * @returns {number} Total credit hours
   */
  static getTotalCreditHours(studentId) {
    const db = this.db;
    const result = db
      .prepare(
        `
      SELECT SUM(c.credit_hours) as total
      FROM course_history ch
      JOIN courses c ON ch.course_id = c.id
      WHERE ch.student_id = ? AND ch.status = 'completed'
    `,
      )
      .get(studentId);

    return result?.total || 0;
  }

  /**
   * Get GPA for a student (simple calculation)
   * @param {number} studentId - Student ID
   * @returns {number} GPA
   */
  static getGPA(studentId) {
    const db = this.db;

    const gradePoints = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      "D-": 0.7,
      F: 0.0,
    };

    const results = db
      .prepare(
        `
      SELECT ch.grade, c.credit_hours
      FROM course_history ch
      JOIN courses c ON ch.course_id = c.id
      WHERE ch.student_id = ? AND ch.status = 'completed' AND ch.grade IS NOT NULL
    `,
      )
      .all(studentId);

    if (results.length === 0) return 0;

    let totalPoints = 0;
    let totalHours = 0;

    for (const result of results) {
      const points = gradePoints[result.grade] ?? 0;
      totalPoints += points * result.credit_hours;
      totalHours += result.credit_hours;
    }

    return totalHours > 0 ? totalPoints / totalHours : 0;
  }

  /**
   * Remove a course from student history (soft delete by setting to dropped)
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @returns {Object|null} Updated record or null
   */
  static dropCourse(studentId, courseId) {
    const record = this.findOne("student_id = ? AND course_id = ?", [
      studentId,
      courseId,
    ]);
    if (!record) return null;

    return this.update(record.id, { status: "dropped" });
  }

  /**
   * Get courses by semester for a student
   * @param {number} studentId - Student ID
   * @returns {Object} Courses grouped by semester/year
   */
  static getCoursesBySemester(studentId) {
    const history = this.getStudentHistory(studentId);

    return history.reduce((acc, record) => {
      const key = `${record.semester_taken}_${record.year_taken}`;
      if (!acc[key]) {
        acc[key] = {
          semester: record.semester_taken,
          year: record.year_taken,
          courses: [],
        };
      }
      acc[key].courses.push({
        id: record.course_id,
        code: record.course_code,
        name: record.course_name,
        status: record.status,
        grade: record.grade,
        creditHours: record.credit_hours,
      });
      return acc;
    }, {});
  }

  /**
   * Verify student can access their own history (data isolation)
   * @param {number} requestingUserId - User requesting access
   * @param {number} studentId - Student whose history is being accessed
   * @returns {boolean} True if access allowed
   */
  static canAccess(requestingUserId, studentId) {
    // Students can only view their own history
    return requestingUserId === studentId;
  }
}
