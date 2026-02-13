import { supabase } from './src/integrations/supabase/client';

console.log('🔍 Verifying Supabase Setup...\n');

async function verifySupabase() {
  try {
    // Test 1: Check connection
    console.log('1️⃣  Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count');
    
    if (error && error.code === '42P01') {
      console.log('❌ Tables not found. Did you run supabase-init.sql?\n');
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
    
    console.log('\n3️⃣  Checking authentication...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ User is authenticated:', session.user.email);
    } else {
      console.log('ℹ️  No active session (this is normal for new setup)');
    }

    console.log('\n✅ All checks passed!');
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
