import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(projectRoot, '.env'));
loadEnvFile(path.join(projectRoot, '.env.local'));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Verifying Supabase Setup...\n');

async function verifySupabase() {
  try {
    // Test 1: Check connection
    console.log('1️⃣  Testing Supabase connection...');
    const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' });
    
    if (error && error.code === '42P01') {
      console.log('❌ Tables not found. Did you run supabase/sql/init/supabase-init.sql?\n');
      return false;
    }
    
    if (error) {
      console.log('❌ Connection error:', error.message, '\n');
      return false;
    }
    
    console.log('✅ Connection successful!\n');

    // Test 2: Verify all tables exist
    console.log('2️⃣  Checking database tables...');
    const tables = ['users', 'wallets', 'transactions', 'products'];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' not found or not accessible`);
        return false;
      }
      console.log(`✅ Table '${table}' exists`);
    }
    
    console.log('\n✅ Table checks passed!');
    console.log('\n📊 Database Summary:');
    
    // Count records in each table
    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`   ${table}: ${count || 0} records`);
    }
    
    console.log('\n🎉 Supabase is properly configured and ready to use!\n');
    return true;
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return false;
  }
}

verifySupabase().then((success) => {
  process.exit(success ? 0 : 1);
});
