#!/usr/bin/env node
/**
 * Database Initialization Script
 *
 * This script creates the SQLite database and all required tables
 * for the Class Selector System.
 *
 * Usage:
 *   node db/init-db.js
 */

import { initializeDatabase, getDatabase, closeDatabase } from './database.js';
import { User } from './User.js';
import { Course } from './Course.js';
import { DegreeRequirement } from './DegreeRequirement.js';
import { CourseHistory } from './CourseHistory.js';
import { AcademicPlan } from './AcademicPlan.js';

console.log('Initializing Class Selector System Database...\n');

try {
  // Initialize database schema
  initializeDatabase();
  console.log('✓ Database tables created successfully\n');

  // Create sample data for testing (optional - remove in production)
  console.log('Creating sample data...\n');

  // Create a sample admin/test user
  const sampleUser = User.create({
    email: 'student@example.com',
    password: 'password123',
    name: 'Sample Student',
    declared_major: 'Computer Science',
    current_semester: 3,
    planned_graduation_semester: 'Spring',
    planned_graduation_year: 2027,
    catalog_year: 2024
  });
  console.log(`✓ Created sample user: ${sampleUser.name} (${sampleUser.email})`);

  // Create sample courses
  const courses = [
    { courseCode: 'CS101', courseName: 'Introduction to Programming', creditHours: 3 },
    { courseCode: 'CS102', courseName: 'Data Structures', creditHours: 3 },
    { courseCode: 'CS201', courseName: 'Algorithms', creditHours: 3 },
    { courseCode: 'CS205', courseName: 'Computer Organization', creditHours: 3 },
    { courseCode: 'CS301', courseName: 'Software Engineering', creditHours: 3 },
    { courseCode: 'CS305', courseName: 'Database Systems', creditHours: 3 },
    { courseCode: 'MATH101', courseName: 'Calculus I', creditHours: 4 },
    { courseCode: 'MATH102', courseName: 'Calculus II', creditHours: 4 },
    { courseCode: 'MATH201', courseName: 'Linear Algebra', creditHours: 3 },
    { courseCode: 'ENG101', courseName: 'English Composition', creditHours: 3 }
  ];

  const createdCourses = {};
  for (const courseData of courses) {
    const course = Course.create(courseData);
    createdCourses[courseData.courseCode] = course;
    console.log(`  Created course: ${course.course_code} - ${course.course_name}`);
  }

  // Set up prerequisites
  Course.addPrerequisite(createdCourses['CS102'].id, createdCourses['CS101'].id);
  Course.addPrerequisite(createdCourses['CS201'].id, createdCourses['CS102'].id);
  Course.addPrerequisite(createdCourses['CS201'].id, createdCourses['MATH102'].id);
  Course.addPrerequisite(createdCourses['CS301'].id, createdCourses['CS201'].id);
  Course.addPrerequisite(createdCourses['CS305'].id, createdCourses['CS201'].id);
  Course.addPrerequisite(createdCourses['MATH102'].id, createdCourses['MATH101'].id);
  Course.addPrerequisite(createdCourses['MATH201'].id, createdCourses['MATH102'].id);
  console.log('\n✓ Course prerequisites configured');

  // Set course availability
  Course.setAvailability(createdCourses['CS101'].id, 'Fall', true);
  Course.setAvailability(createdCourses['CS101'].id, 'Spring', true);
  Course.setAvailability(createdCourses['CS101'].id, 'Summer', true);
  Course.setAvailability(createdCourses['CS102'].id, 'Fall', true);
  Course.setAvailability(createdCourses['CS102'].id, 'Spring', true);
  Course.setAvailability(createdCourses['CS201'].id, 'Fall', true);
  Course.setAvailability(createdCourses['CS201'].id, 'Spring', true);
  Course.setAvailability(createdCourses['MATH101'].id, 'Fall', true);
  Course.setAvailability(createdCourses['MATH101'].id, 'Spring', true);
  Course.setAvailability(createdCourses['MATH102'].id, 'Fall', true);
  Course.setAvailability(createdCourses['MATH102'].id, 'Spring', true);
  console.log('✓ Course availability configured');

  // Create degree requirements for Computer Science major
  const csRequirements = [
    { courseId: createdCourses['CS101'].id, requirementType: 'required' },
    { courseId: createdCourses['CS102'].id, requirementType: 'required' },
    { courseId: createdCourses['CS201'].id, requirementType: 'required' },
    { courseId: createdCourses['CS205'].id, requirementType: 'required' },
    { courseId: createdCourses['CS301'].id, requirementType: 'required' },
    { courseId: createdCourses['CS305'].id, requirementType: 'required' },
    { courseId: createdCourses['MATH101'].id, requirementType: 'core' },
    { courseId: createdCourses['MATH102'].id, requirementType: 'core' },
    { courseId: createdCourses['MATH201'].id, requirementType: 'core' },
    { courseId: createdCourses['ENG101'].id, requirementType: 'elective' }
  ];

  DegreeRequirement.bulkAddRequirements('Computer Science', 2024, csRequirements);
  console.log('✓ Computer Science degree requirements configured');

  // Record some completed courses for the sample student
  CourseHistory.recordCompletion({
    studentId: sampleUser.id,
    courseId: createdCourses['CS101'].id,
    grade: 'A',
    semesterTaken: 'Fall',
    yearTaken: 2024
  });
  CourseHistory.recordCompletion({
    studentId: sampleUser.id,
    courseId: createdCourses['MATH101'].id,
    grade: 'B+',
    semesterTaken: 'Fall',
    yearTaken: 2024
  });
  CourseHistory.recordCompletion({
    studentId: sampleUser.id,
    courseId: createdCourses['ENG101'].id,
    grade: 'A-',
    semesterTaken: 'Fall',
    yearTaken: 2024
  });
  console.log('✓ Sample course history recorded');

  // Create a sample academic plan
  AcademicPlan.addMultipleCourses(sampleUser.id, [
    { courseId: createdCourses['CS102'].id, plannedSemester: 'Spring', plannedYear: 2025 },
    { courseId: createdCourses['MATH102'].id, plannedSemester: 'Spring', plannedYear: 2025 },
    { courseId: createdCourses['CS201'].id, plannedSemester: 'Fall', plannedYear: 2025 },
    { courseId: createdCourses['CS205'].id, plannedSemester: 'Fall', plannedYear: 2025 },
    { courseId: createdCourses['MATH201'].id, plannedSemester: 'Fall', plannedYear: 2025 }
  ]);
  console.log('✓ Sample academic plan created');

  console.log('\n========================================');
  console.log('Database initialization complete!');
  console.log('========================================');
  console.log('\nSample credentials:');
  console.log(`  Email: ${sampleUser.email}`);
  console.log('  Password: password123');
  console.log('\nNote: Remove sample data creation code for production use.\n');

} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
} finally {
  closeDatabase();
}
