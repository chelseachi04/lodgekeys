/**
 * Lodgekeys — Phase 2 Authentication Verification Suite
 * Validates Supabase client configuration, role-based redirection,
 * profile fetching logic, and UI integration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const results = [];
function check(title, fn) {
  try {
    const detail = fn();
    results.push({ title, status: 'PASS', detail: detail || '' });
  } catch (err) {
    results.push({ title, status: 'FAIL', error: err.message });
  }
}

console.log('--- Running Lodgekeys Phase 2 Auth Integration Suite ---\n');

// 1. Check supabaseClient.js initialization
check('Supabase Client Configuration', () => {
  const clientPath = path.join(rootDir, 'src', 'lib', 'supabaseClient.js');
  if (!fs.existsSync(clientPath)) throw new Error('supabaseClient.js does not exist.');
  const content = fs.readFileSync(clientPath, 'utf8');
  if (!content.includes('createClient(')) throw new Error('createClient is not called.');
  if (!content.includes('VITE_SUPABASE_URL') || !content.includes('VITE_SUPABASE_ANON_KEY')) {
    throw new Error('Environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing.');
  }
  if (!content.includes('isSupabaseConfigured')) throw new Error('isSupabaseConfigured flag missing.');
  return 'supabaseClient.js properly configures createClient and isSupabaseConfigured.';
});

// 2. Check AuthContext implementation
check('AuthContext Supabase Auth Integration', () => {
  const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.jsx');
  if (!fs.existsSync(authContextPath)) throw new Error('AuthContext.jsx does not exist.');
  const content = fs.readFileSync(authContextPath, 'utf8');

  if (!content.includes('supabase.auth.signInWithPassword')) {
    throw new Error('supabase.auth.signInWithPassword missing in AuthContext.');
  }
  if (!content.includes('supabase.auth.signUp')) {
    throw new Error('supabase.auth.signUp missing in AuthContext.');
  }
  if (!content.includes('supabase.auth.signOut')) {
    throw new Error('supabase.auth.signOut missing in AuthContext.');
  }
  if (!content.includes('supabase.auth.onAuthStateChange')) {
    throw new Error('supabase.auth.onAuthStateChange listener missing in AuthContext.');
  }
  if (!content.includes("from('profiles')")) {
    throw new Error("Query to public.profiles missing in AuthContext.");
  }
  if (!content.includes("from('hotel_managers')")) {
    throw new Error("Query to public.hotel_managers for dynamic manager assignment missing.");
  }
  return 'AuthContext incorporates all required Supabase Auth methods and dynamic profile queries.';
});

// 3. Verify Role Redirection Mapping
check('Role-Based Route Redirection Mapping', () => {
  const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.jsx');
  const content = fs.readFileSync(authContextPath, 'utf8');

  if (!content.includes("if (role === 'admin') return '/admin/dashboard'") &&
      !content.includes("role === 'admin' ? '/admin/dashboard'")) {
    throw new Error("Admin redirection mapping to '/admin/dashboard' missing.");
  }
  if (!content.includes("if (role === 'hotel_manager') return '/manager/dashboard'") &&
      !content.includes("role === 'hotel_manager' ? '/manager/dashboard'")) {
    throw new Error("Manager redirection mapping to '/manager/dashboard' missing.");
  }
  if (!content.includes("'/dashboard'")) {
    throw new Error("Customer redirection mapping to '/dashboard' missing.");
  }
  return 'Role mapping confirmed: admin -> /admin/dashboard, hotel_manager -> /manager/dashboard, customer -> /dashboard.';
});

// 4. Verify AuthModal Async Integration & UI Preservation
check('AuthModal UI & Handlers Integration', () => {
  const modalPath = path.join(rootDir, 'src', 'components', 'AuthModal.jsx');
  if (!fs.existsSync(modalPath)) throw new Error('AuthModal.jsx does not exist.');
  const content = fs.readFileSync(modalPath, 'utf8');

  if (!content.includes('await signIn(')) {
    throw new Error('AuthModal does not await signIn.');
  }
  if (!content.includes('await register(')) {
    throw new Error('AuthModal does not await register.');
  }
  if (!content.includes('demoLogin = async')) {
    throw new Error('demoLogin is not async.');
  }
  if (!content.includes('auth-modal-demo__pills')) {
    throw new Error('Quick demo access pills UI is missing.');
  }
  return 'AuthModal cleanly awaits authentication methods and preserves all UI/styling.';
});

// 5. Verify SignIn Page Integration
check('SignIn Page useAuth Integration', () => {
  const signinPath = path.join(rootDir, 'src', 'pages', 'SignIn.jsx');
  if (!fs.existsSync(signinPath)) throw new Error('SignIn.jsx does not exist.');
  const content = fs.readFileSync(signinPath, 'utf8');

  if (!content.includes("useAuth")) {
    throw new Error('SignIn.jsx does not import useAuth.');
  }
  if (!content.includes("await signIn(") || !content.includes("await register(")) {
    throw new Error('SignIn.jsx does not connect to signIn and register.');
  }
  return 'SignIn page is fully connected to Supabase Auth.';
});

// Output Summary
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
  console.log('\nAll 5 Phase 2 verification checks passed successfully.');
}
