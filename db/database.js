/**
 * Database Connection Module
 * Manages SQLite database connection for the Class Selector System
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "class_selector.db");

let dbInstance = null;

/**
 * Get or create database instance
 * @returns {Database} SQLite database instance
 */
export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    // Enable foreign keys
    dbInstance.pragma("foreign_keys = ON");
    // Enable WAL mode for better concurrency
    dbInstance.pragma("journal_mode = WAL");
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Initialize database with all tables
 */
export function initializeDatabase() {
  const db = getDatabase();

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create tables in order (respecting foreign key dependencies)
  createUsersTable(db);
  createCoursesTable(db);
  createDegreeRequirementsTable(db);
  createCourseHistoryTable(db);
  createAcademicPlansTable(db);
}

function createUsersTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      declared_major TEXT,
      current_semester INTEGER DEFAULT 1,
      planned_graduation_semester TEXT,
      planned_graduation_year INTEGER,
      catalog_year INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index for login lookups
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  // Index for major lookups
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_users_major ON users(declared_major)`,
  );
}

function createCoursesTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT NOT NULL,
      course_name TEXT NOT NULL,
      credit_hours INTEGER DEFAULT 3,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_code)
    )
  `);

  // Course availability table (which semesters each course is offered)
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      semester TEXT NOT NULL CHECK(semester IN ('Fall', 'Spring', 'Summer')),
      is_offered BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(course_id, semester)
    )
  `);

  // Prerequisites table (self-referencing relationship)
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      prerequisite_course_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(course_id, prerequisite_course_id)
    )
  `);

  // Indexes for performance
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_course_availability ON course_availability(course_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_course_prerequisites ON course_prerequisites(course_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_prereq_course ON course_prerequisites(prerequisite_course_id)`,
  );
}

function createDegreeRequirementsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS degree_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      major TEXT NOT NULL,
      course_id INTEGER NOT NULL,
      requirement_type TEXT DEFAULT 'required' CHECK(requirement_type IN ('required', 'elective', 'core')),
      catalog_year INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(major, course_id, catalog_year)
    )
  `);

  // Indexes for major lookups
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_degree_major ON degree_requirements(major)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_degree_catalog ON degree_requirements(catalog_year)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_degree_course ON degree_requirements(course_id)`,
  );
}

function createCourseHistoryTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('completed', 'in_progress', 'dropped', 'failed')),
      grade TEXT,
      semester_taken TEXT,
      year_taken INTEGER,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);

  // Indexes for student history lookups
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_history_student ON course_history(student_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_history_course ON course_history(course_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_history_status ON course_history(status)`,
  );
}

function createAcademicPlansTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS academic_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      planned_semester TEXT NOT NULL CHECK(planned_semester IN ('Fall', 'Spring', 'Summer')),
      planned_year INTEGER NOT NULL,
      status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'completed', 'dropped')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id, planned_semester, planned_year)
    )
  `);

  // Indexes for plan lookups
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_plan_student ON academic_plans(student_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_plan_course ON academic_plans(course_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_plan_semester ON academic_plans(planned_semester, planned_year)`,
  );
}

export {
  createUsersTable,
  createCoursesTable,
  createDegreeRequirementsTable,
  createCourseHistoryTable,
  createAcademicPlansTable,
};
