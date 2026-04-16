#!/usr/bin/env node
/**
 * Migration Runner
 * Executes all pending migrations in order
 */

import { pathToFileURL } from "url";
import { initializeDatabase, closeDatabase } from "../database.js";
import { migrate as migrate001 } from "./001-catalog-seed.js";

const MIGRATIONS = [{ id: "001", name: "Catalog Seed", run: migrate001 }];

async function runMigrations() {
  console.log("Running database migrations...\n");

  // Initialize database schema if not exists
  initializeDatabase();

  // Run each migration
  for (const migration of MIGRATIONS) {
    console.log(`Running migration ${migration.id}: ${migration.name}`);
    try {
      await migration.run();
      console.log(`Migration ${migration.id} completed.\n`);
    } catch (error) {
      console.error(`Migration ${migration.id} failed:`, error.message);
      throw error;
    }
  }

  console.log("All migrations completed successfully!");
}

// CLI execution
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations()
    .then(() => {
      closeDatabase();
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error:", error);
      closeDatabase();
      process.exit(1);
    });
}

export { runMigrations };
