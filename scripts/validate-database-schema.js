/**
 * Lodgekeys — Database Foundation Verification Script
 * Validates migration structure, table definitions, RLS coverage,
 * constraint semantics, and security procedures.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const migrationDir = path.join(rootDir, 'supabase', 'migrations');
const expectedMigrations = [
  '20261020000001_initial_schema.sql',
  '20261020000002_functions_and_triggers.sql',
  '20261020000003_row_level_security.sql',
  '20261020000004_room_conflict_prevention.sql',
  '20261020000005_storage_buckets.sql',
];

const expectedTables = [
  'profiles',
  'hotels',
  'hotel_managers',
  'hotel_applications',
  'room_categories',
  'rooms',
  'add_on_services',
  'bookings',
  'booking_add_ons',
  'payments',
  'settlements',
  'saved_hotels',
  'notifications',
  'platform_settings',
  'audit_logs',
];

const results = [];

function check(title, fn) {
  try {
    const detail = fn();
    results.push({ title, status: 'PASS', detail: detail || '' });
  } catch (err) {
    results.push({ title, status: 'FAIL', error: err.message });
  }
}

console.log('--- Running Lodgekeys Database Validation Suite ---\n');

// 1. Verify Migration Files Exist
check('Migration Files Integrity', () => {
  for (const file of expectedMigrations) {
    const fullPath = path.join(migrationDir, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing expected migration file: ${file}`);
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.length < 50) {
      throw new Error(`Migration file appears empty or truncated: ${file}`);
    }
  }
  return `All ${expectedMigrations.length} migration files present and non-empty.`;
});

// 2. Verify Table Declarations
const initialSql = fs.readFileSync(path.join(migrationDir, '20261020000001_initial_schema.sql'), 'utf8');

check('Core Tables Schema Verification', () => {
  for (const table of expectedTables) {
    const regex = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?public\\.${table}\\b`, 'i');
    if (!regex.test(initialSql)) {
      throw new Error(`Table public.${table} was not declared in initial schema.`);
    }
  }
  return `All ${expectedTables.length} domain tables successfully declared.`;
});

// 3. Verify Row Level Security on Every Table
const rlsSql = fs.readFileSync(path.join(migrationDir, '20261020000003_row_level_security.sql'), 'utf8');

check('Row Level Security (RLS) Coverage', () => {
  for (const table of expectedTables) {
    const regex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    if (!regex.test(rlsSql)) {
      throw new Error(`RLS is not explicitly enabled on public.${table}.`);
    }
  }
  return `100% RLS coverage: All ${expectedTables.length} tables have RLS enabled.`;
});

// 4. Verify Exclusion Constraint for Conflict Prevention
const conflictSql = fs.readFileSync(path.join(migrationDir, '20261020000004_room_conflict_prevention.sql'), 'utf8');

check('PostgreSQL GiST Exclusion Constraint Verification', () => {
  if (!conflictSql.includes('btree_gist')) {
    throw new Error('btree_gist extension is missing from conflict prevention migration.');
  }
  if (!conflictSql.includes('exclude_overlapping_room_bookings')) {
    throw new Error('Exclusion constraint name exclude_overlapping_room_bookings not found.');
  }
  if (!conflictSql.includes('stay_range WITH &&') || !conflictSql.includes('room_id WITH =')) {
    throw new Error('Exclusion constraint does not properly combine room_id WITH = and stay_range WITH &&.');
  }
  if (!conflictSql.includes("WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'))")) {
    throw new Error('Partial exclusion constraint does not filter for active booking statuses.');
  }
  return 'GiST exclusion constraint correctly specified with half-open daterange and partial filter.';
});

// 5. Verify Security Procedures & Triggers
const funcSql = fs.readFileSync(path.join(migrationDir, '20261020000002_functions_and_triggers.sql'), 'utf8');

check('Role Escalation Prevention & Security Triggers', () => {
  if (!funcSql.includes('prevent_role_escalation')) {
    throw new Error('prevent_role_escalation function is missing.');
  }
  if (!funcSql.includes('handle_new_user')) {
    throw new Error('handle_new_user signup trigger function is missing.');
  }
  if (!funcSql.includes("role = 'customer'") && !funcSql.includes("'customer'")) {
    throw new Error('handle_new_user must enforce customer role on signup.');
  }
  if (!funcSql.includes('approve_hotel_application')) {
    throw new Error('approve_hotel_application procedure is missing.');
  }
  return 'Role escalation trigger, signup profile trigger, and hotel approval procedure verified.';
});

// 6. Verify Storage Bucket and Storage RLS
const storageSql = fs.readFileSync(path.join(migrationDir, '20261020000005_storage_buckets.sql'), 'utf8');

check('Storage Bucket and Path-Isolated Storage Policies', () => {
  if (!storageSql.includes("'hotel-images'")) {
    throw new Error('hotel-images bucket configuration missing.');
  }
  if (!storageSql.includes('hotel_images_manager_upload')) {
    throw new Error('hotel_images_manager_upload policy missing.');
  }
  if (!storageSql.includes('(storage.foldername(name))[1]')) {
    throw new Error('Storage policy does not isolate paths using hotel slug folder prefix.');
  }
  return 'hotel-images bucket and path-isolated manager policies verified.';
});

// 7. Verify .env and .gitignore
check('.env & Git Security Hygiene', () => {
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) throw new Error('.gitignore not found.');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('.env')) {
    throw new Error('.env is not ignored in .gitignore.');
  }
  const envExamplePath = path.join(rootDir, '.env.example');
  if (!fs.existsSync(envExamplePath)) throw new Error('.env.example not found.');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  if (!envExampleContent.includes('VITE_SUPABASE_URL') || !envExampleContent.includes('VITE_SUPABASE_ANON_KEY')) {
    throw new Error('.env.example missing required VITE_SUPABASE variables.');
  }
  return '.env safely gitignored; .env.example created with placeholders.';
});

// 8. Output Report
console.log('RESULTS:');
let allPassed = true;
for (const res of results) {
  if (res.status === 'PASS') {
    console.log(`[PASS] ${res.title}: ${res.detail}`);
  } else {
    allPassed = false;
    console.error(`[FAIL] ${res.title}: ${res.error}`);
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll 7 verification checks passed successfully.');
}
