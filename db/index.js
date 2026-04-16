/**
 * Class Selector System - Database Module
 *
 * Central export point for all database models and utilities.
 * Provides a modular design for easy updates to course rules without recoding logic.
 */

import { getDatabase, initializeDatabase } from "./database.js";

// Database connection and initialization
export {
  getDatabase,
  closeDatabase,
  initializeDatabase,
  createUsersTable,
  createCoursesTable,
  createDegreeRequirementsTable,
  createCourseHistoryTable,
  createAcademicPlansTable,
} from "./database.js";

// Base model for inheritance
export { BaseModel } from "./BaseModel.js";

// Models
export { User } from "./User.js";
export { Course } from "./Course.js";
export { DegreeRequirement } from "./DegreeRequirement.js";
export { CourseHistory } from "./CourseHistory.js";
export { AcademicPlan } from "./AcademicPlan.js";

/**
 * Quick initialization helper
 * Call this once at application startup
 */
export function init() {
  initializeDatabase();
}

/**
 * Reset database (drop all tables and recreate)
 * USE WITH CAUTION - This will delete all data
 */
export function resetDatabase() {
  const db = getDatabase();

  // Drop tables in reverse order (respecting foreign keys)
  db.exec("DROP TABLE IF EXISTS academic_plans");
  db.exec("DROP TABLE IF EXISTS course_history");
  db.exec("DROP TABLE IF EXISTS degree_requirements");
  db.exec("DROP TABLE IF EXISTS course_prerequisites");
  db.exec("DROP TABLE IF EXISTS course_availability");
  db.exec("DROP TABLE IF EXISTS courses");
  db.exec("DROP TABLE IF EXISTS users");

  // Recreate all tables
  initializeDatabase();
}
