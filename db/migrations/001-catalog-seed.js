/**
 * Migration 001: Catalog Seed
 * Populates courses, degrees, and requirements for Computer Science and Cybersecurity
 * Based on York University 2023-2024 Academic Catalog
 */

import { pathToFileURL } from "url";
import { getDatabase, closeDatabase } from "../database.js";
import { Course } from "../Course.js";
import { DegreeRequirement } from "../DegreeRequirement.js";

const CATALOG_YEAR = 2024;

// Computer Science and related courses from the catalog
const COURSES = [
  // Computer Science Core
  {
    code: "CSC123",
    name: "Internet History, Technology, and Security",
    credits: 3,
    description:
      "Explore the history of the Internet, its architecture, and security fundamentals.",
  },
  {
    code: "CSC213",
    name: "Programming for Everyone I",
    credits: 3,
    description:
      "Introduction to programming using Python. No prior experience required.",
  },
  {
    code: "CSC223",
    name: "Programming for Everyone II",
    credits: 3,
    description:
      "Continuation of CSC213. Data gathering, analysis, and visualization using Python.",
  },
  {
    code: "CSC313",
    name: "Web Development",
    credits: 3,
    description:
      "Modern web development techniques including HTML, CSS, JavaScript, and backend technologies.",
  },
  {
    code: "CSC413",
    name: "Application Development I",
    credits: 3,
    description:
      "First course in application development sequence. Project-based learning.",
  },
  {
    code: "CSC423",
    name: "Application Development II",
    credits: 3,
    description:
      "Second course in application development sequence. Advanced topics and team projects.",
  },
  {
    code: "CSC483",
    name: "Capstone Project",
    credits: 3,
    description:
      "Culmination of Computer Science major. Group-based project integrating all learned skills.",
  },

  // Computer Information Systems
  {
    code: "CIS123",
    name: "Introduction to Information Technology",
    credits: 3,
    description:
      "Overview of information technology concepts and applications.",
  },
  {
    code: "CIS153",
    name: "Object Oriented Programming",
    credits: 3,
    description: "Object-oriented programming principles and practices.",
  },

  // Mathematics (required for CS/Cybersecurity)
  {
    code: "MTH013",
    name: "Basic Math Skills with Algebra",
    credits: 3,
    description: "Foundational mathematics with algebra review.",
  },
  {
    code: "MTH133",
    name: "Intermediate Algebra",
    credits: 3,
    description: "Intermediate algebra preparation for college mathematics.",
  },
  {
    code: "MTH145",
    name: "Math in the Real World",
    credits: 3,
    description: "Applied mathematics for real-world problem solving.",
  },
  {
    code: "MTH173",
    name: "College Algebra",
    credits: 3,
    description: "College-level algebra for STEM majors.",
  },
  {
    code: "MTH181",
    name: "Trigonometry",
    credits: 1,
    description: "Trigonometric functions and applications.",
  },
  {
    code: "MTH184",
    name: "Pre-Calculus",
    credits: 4,
    description: "Preparation for calculus including algebra and trigonometry.",
  },
  {
    code: "MTH213",
    name: "College Geometry",
    credits: 3,
    description: "Geometric principles and proofs.",
  },
  {
    code: "MTH214",
    name: "Calculus with Analytic Geometry I",
    credits: 4,
    description: "First semester calculus with analytic geometry.",
  },
  {
    code: "MTH223",
    name: "Elements of Statistics",
    credits: 3,
    description: "Introduction to statistical methods and applications.",
  },
  {
    code: "MTH224",
    name: "Calculus with Analytic Geometry II",
    credits: 4,
    description: "Second semester calculus.",
  },
  {
    code: "MTH243",
    name: "Introduction to Mathematical Thought",
    credits: 3,
    description: "Introduction to abstract mathematical thinking.",
  },
  {
    code: "MTH313",
    name: "Probability and Statistics",
    credits: 3,
    description: "Probability theory and statistical inference.",
  },
  {
    code: "MTH334",
    name: "Calculus with Analytic Geometry III",
    credits: 4,
    description: "Third semester calculus.",
  },
  {
    code: "MTH343",
    name: "Differential Equations",
    credits: 3,
    description: "Ordinary differential equations and applications.",
  },
  {
    code: "MTH353",
    name: "Linear Algebra",
    credits: 3,
    description: "Vector spaces, matrices, and linear transformations.",
  },
  {
    code: "MTH413",
    name: "Abstract Algebra",
    credits: 3,
    description: "Groups, rings, and fields.",
  },
  {
    code: "MTH453",
    name: "Analysis",
    credits: 3,
    description: "Real analysis and mathematical proofs.",
  },

  // Sciences (required for CS/Cybersecurity)
  {
    code: "PHY214",
    name: "Physics I",
    credits: 4,
    description: "Calculus-based physics for science and engineering majors.",
  },
  {
    code: "PHY224",
    name: "Physics II",
    credits: 4,
    description: "Continuation of Physics I.",
  },
  {
    code: "CHM214",
    name: "Chemistry I",
    credits: 4,
    description: "General chemistry for science majors.",
  },

  // General Education / Core
  {
    code: "BIB121",
    name: "Story of Jesus",
    credits: 2,
    description: "Biblical study of the life and teachings of Jesus.",
  },
  {
    code: "BIB132",
    name: "Story of the Church",
    credits: 2,
    description: "History and development of the Christian Church.",
  },
  {
    code: "BIB232",
    name: "Story of Israel",
    credits: 2,
    description: "Old Testament survey focusing on Israel.",
  },
  {
    code: "BIB242",
    name: "Christian Faith and Life",
    credits: 2,
    description: "Christian theology and practical living.",
  },
  {
    code: "COM113",
    name: "Basic Speech",
    credits: 3,
    description: "Fundamentals of public speaking and communication.",
  },
  {
    code: "ENG113",
    name: "English Composition I",
    credits: 3,
    description: "Writing and composition fundamentals.",
  },
  {
    code: "ENG123",
    name: "English Composition II",
    credits: 3,
    description: "Advanced composition and research writing.",
  },
  {
    code: "YCS101",
    name: "Freshman Seminar",
    credits: 1,
    description: "Introduction to college life and academic success.",
  },
  {
    code: "PSY113",
    name: "General Psychology",
    credits: 3,
    description: "Introduction to psychological principles.",
  },
  {
    code: "PSY143",
    name: "Human Growth & Development",
    credits: 3,
    description: "Lifespan human development.",
  },
  {
    code: "HST213",
    name: "History of the U.S. to 1877",
    credits: 3,
    description: "American history from colonization to Reconstruction.",
  },
  {
    code: "HST223",
    name: "History of the U.S. since 1877",
    credits: 3,
    description: "American history from Reconstruction to present.",
  },
  {
    code: "HST253",
    name: "Western Civilization to 1648",
    credits: 3,
    description: "European history from ancient times to Peace of Westphalia.",
  },
  {
    code: "HST263",
    name: "Western Civilization since 1648",
    credits: 3,
    description: "European history from 1648 to present.",
  },
  {
    code: "GEO214",
    name: "Cultural Geography",
    credits: 3,
    description: "World cultures and geographic patterns.",
  },
  {
    code: "NSC153",
    name: "General Science A",
    credits: 3,
    description: "Integrated science concepts for non-science majors.",
  },
  {
    code: "NSC163",
    name: "General Science B",
    credits: 3,
    description: "Continuation of General Science A.",
  },
  {
    code: "ENG273",
    name: "Artistic Expression through Writing",
    credits: 3,
    description:
      "Exploration of creative and artistic expression through various forms of writing.",
  },
];

// Cybersecurity-specific courses (to be added when catalog details are available)
const CYBERSECURITY_COURSES = [
  {
    code: "CYB101",
    name: "Introduction to Cybersecurity",
    credits: 3,
    description: "Fundamentals of cybersecurity concepts and practices.",
  },
  {
    code: "CYB201",
    name: "Network Security",
    credits: 3,
    description: "Security principles for networked systems.",
  },
  {
    code: "CYB301",
    name: "Ethical Hacking",
    credits: 3,
    description: "Penetration testing and ethical hacking methodologies.",
  },
  {
    code: "CYB302",
    name: "Digital Forensics",
    credits: 3,
    description: "Investigation and analysis of digital evidence.",
  },
  {
    code: "CYB401",
    name: "Security Policy and Governance",
    credits: 3,
    description: "Cybersecurity policy, compliance, and governance.",
  },
  {
    code: "CYB483",
    name: "Cybersecurity Capstone",
    credits: 3,
    description: "Culminating project in cybersecurity.",
  },
];

// Computer Science degree requirements (120 hours, 36 upper division)
const COMPUTER_SCIENCE_REQUIREMENTS = [
  // Core Computer Science
  { courseId: null, code: "CSC123", type: "required" },
  { courseId: null, code: "CSC213", type: "required" },
  { courseId: null, code: "CSC223", type: "required" },
  { courseId: null, code: "CSC313", type: "required" },
  { courseId: null, code: "CSC413", type: "required" },
  { courseId: null, code: "CSC423", type: "required" },
  { courseId: null, code: "CSC483", type: "required" },

  // Programming/IT
  { courseId: null, code: "CIS153", type: "required" },

  // Mathematics
  { courseId: null, code: "MTH173", type: "core" },
  { courseId: null, code: "MTH214", type: "core" },
  { courseId: null, code: "MTH224", type: "core" },
  { courseId: null, code: "MTH243", type: "core" },
  { courseId: null, code: "MTH353", type: "core" },
  { courseId: null, code: "MTH223", type: "elective" },

  // Sciences
  { courseId: null, code: "PHY214", type: "core" },

  // General Education Core
  { courseId: null, code: "BIB121", type: "required" },
  { courseId: null, code: "COM113", type: "required" },
  { courseId: null, code: "ENG113", type: "required" },
  { courseId: null, code: "ENG123", type: "required" },
  { courseId: null, code: "YCS101", type: "required" },

  // Religious Studies
  { courseId: null, code: "BIB132", type: "required" },
  { courseId: null, code: "BIB232", type: "required" },
  { courseId: null, code: "BIB242", type: "required" },

  // General Education Areas
  { courseId: null, code: "ENG273", type: "elective" }, // Artistic Expression
  { courseId: null, code: "GEO214", type: "elective" }, // Cultural Perspectives
  { courseId: null, code: "HST213", type: "elective" }, // Historical Foundations
  { courseId: null, code: "PSY113", type: "elective" }, // Human Behavior
  { courseId: null, code: "NSC153", type: "elective" }, // Scientific Inquiry
];

// Cybersecurity degree requirements (120 hours, 36 upper division)
const CYBERSECURITY_REQUIREMENTS = [
  // Core Computer Science (shared with CS)
  { courseId: null, code: "CSC123", type: "required" },
  { courseId: null, code: "CSC213", type: "required" },
  { courseId: null, code: "CSC223", type: "required" },
  { courseId: null, code: "CSC313", type: "required" },

  // Cybersecurity Core
  { courseId: null, code: "CYB101", type: "required" },
  { courseId: null, code: "CYB201", type: "required" },
  { courseId: null, code: "CYB301", type: "required" },
  { courseId: null, code: "CYB302", type: "required" },
  { courseId: null, code: "CYB401", type: "required" },
  { courseId: null, code: "CYB483", type: "required" },

  // Mathematics
  { courseId: null, code: "MTH173", type: "core" },
  { courseId: null, code: "MTH214", type: "core" },
  { courseId: null, code: "MTH224", type: "core" },
  { courseId: null, code: "MTH353", type: "core" },

  // Sciences
  { courseId: null, code: "PHY214", type: "core" },

  // General Education Core
  { courseId: null, code: "BIB121", type: "required" },
  { courseId: null, code: "COM113", type: "required" },
  { courseId: null, code: "ENG113", type: "required" },
  { courseId: null, code: "ENG123", type: "required" },
  { courseId: null, code: "YCS101", type: "required" },

  // Religious Studies
  { courseId: null, code: "BIB132", type: "required" },
  { courseId: null, code: "BIB232", type: "required" },
  { courseId: null, code: "BIB242", type: "required" },
];

// Course prerequisites based on catalog descriptions
const PREREQUISITES = [
  { course: "CSC223", prerequisite: "CSC213" },
  { course: "CSC313", prerequisite: "CSC223" },
  { course: "CSC413", prerequisite: "CSC223" },
  { course: "CSC423", prerequisite: "CSC413" },
  { course: "CSC483", prerequisite: "CSC413" },
  { course: "CIS153", prerequisite: "CSC123" },
  { course: "MTH214", prerequisite: "MTH173" },
  { course: "MTH224", prerequisite: "MTH214" },
  { course: "MTH334", prerequisite: "MTH224" },
  { course: "MTH343", prerequisite: "MTH224" },
  { course: "MTH353", prerequisite: "MTH214" },
  { course: "MTH413", prerequisite: "MTH353" },
  { course: "MTH453", prerequisite: "MTH334" },
  { course: "PHY214", prerequisite: "MTH214" },
  { course: "CHM214", prerequisite: "MTH173" },
  { course: "ENG123", prerequisite: "ENG113" },
  { course: "CYB201", prerequisite: "CSC123" },
  { course: "CYB301", prerequisite: "CYB201" },
  { course: "CYB302", prerequisite: "CYB201" },
  { course: "CYB401", prerequisite: "CYB301" },
  { course: "CYB483", prerequisite: "CYB401" },
];

export async function migrate() {
  const db = getDatabase();
  const createdCourses = {};

  console.log("Migration 001: Catalog Seed");
  console.log("===========================\n");

  try {
    // Begin transaction
    db.exec("BEGIN TRANSACTION");

    // Step 1: Create all courses
    console.log("Creating courses...");
    for (const courseData of COURSES) {
      try {
        const course = Course.create({
          courseCode: courseData.code,
          courseName: courseData.name,
          creditHours: courseData.credits,
          description: courseData.description,
        });
        createdCourses[courseData.code] = course;
        console.log(`  ✓ ${courseData.code} - ${courseData.name}`);
      } catch (error) {
        if (error.message.includes("UNIQUE constraint")) {
          // Course already exists, fetch it
          const existing = Course.findByCode(courseData.code);
          if (existing) {
            createdCourses[courseData.code] = existing;
          }
        } else {
          throw error;
        }
      }
    }

    // Create Cybersecurity courses
    console.log("\nCreating Cybersecurity courses...");
    for (const courseData of CYBERSECURITY_COURSES) {
      try {
        const course = Course.create({
          courseCode: courseData.code,
          courseName: courseData.name,
          creditHours: courseData.credits,
          description: courseData.description,
        });
        createdCourses[courseData.code] = course;
        console.log(`  ✓ ${courseData.code} - ${courseData.name}`);
      } catch (error) {
        if (error.message.includes("UNIQUE constraint")) {
          const existing = Course.findByCode(courseData.code);
          if (existing) {
            createdCourses[courseData.code] = existing;
          }
        } else {
          throw error;
        }
      }
    }

    // Step 2: Set up prerequisites
    console.log("\nSetting up prerequisites...");
    for (const prereq of PREREQUISITES) {
      const course = createdCourses[prereq.course];
      const prerequisite = createdCourses[prereq.prerequisite];

      if (course && prerequisite) {
        try {
          Course.addPrerequisite(course.id, prerequisite.id);
          console.log(`  ✓ ${prereq.course} requires ${prereq.prerequisite}`);
        } catch (error) {
          if (!error.message.includes("UNIQUE constraint")) {
            throw error;
          }
        }
      }
    }

    // Step 3: Set course availability
    console.log("\nSetting course availability...");
    const fallSpringCourses = [
      "CSC213",
      "CSC223",
      "CSC313",
      "CSC413",
      "CSC423",
      "MTH173",
      "MTH214",
      "MTH224",
    ];
    const allSemesterCourses = [
      "CSC123",
      "CIS123",
      "CIS153",
      "BIB121",
      "ENG113",
      "ENG123",
    ];

    for (const code of fallSpringCourses) {
      const course = createdCourses[code];
      if (course) {
        Course.setAvailability(course.id, "Fall", true);
        Course.setAvailability(course.id, "Spring", true);
      }
    }

    for (const code of allSemesterCourses) {
      const course = createdCourses[code];
      if (course) {
        Course.setAvailability(course.id, "Fall", true);
        Course.setAvailability(course.id, "Spring", true);
        Course.setAvailability(course.id, "Summer", true);
      }
    }

    // Step 4: Create degree requirements for Computer Science
    console.log("\nCreating Computer Science degree requirements...");
    for (const req of COMPUTER_SCIENCE_REQUIREMENTS) {
      const course = createdCourses[req.code];
      if (course) {
        try {
          DegreeRequirement.addRequirement({
            major: "Computer Science",
            courseId: course.id,
            requirementType: req.type,
            catalogYear: CATALOG_YEAR,
          });
          console.log(`  ✓ [${req.type}] ${req.code}`);
        } catch (error) {
          if (!error.message.includes("UNIQUE constraint")) {
            throw error;
          }
        }
      }
    }

    // Step 5: Create degree requirements for Cybersecurity
    console.log("\nCreating Cybersecurity degree requirements...");
    for (const req of CYBERSECURITY_REQUIREMENTS) {
      const course = createdCourses[req.code];
      if (course) {
        try {
          DegreeRequirement.addRequirement({
            major: "Cybersecurity",
            courseId: course.id,
            requirementType: req.type,
            catalogYear: CATALOG_YEAR,
          });
          console.log(`  ✓ [${req.type}] ${req.code}`);
        } catch (error) {
          if (!error.message.includes("UNIQUE constraint")) {
            throw error;
          }
        }
      }
    }

    // Commit transaction
    db.exec("COMMIT");

    console.log("\n===========================");
    console.log("Migration completed successfully!");
    console.log(`Catalog Year: ${CATALOG_YEAR}`);
    console.log(`Total Courses: ${Object.keys(createdCourses).length}`);
    console.log("Degrees: Computer Science, Cybersecurity");
    console.log("===========================\n");
  } catch (error) {
    db.exec("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  migrate()
    .then(() => {
      closeDatabase();
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      closeDatabase();
      process.exit(1);
    });
}
