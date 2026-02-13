# 🚀 Supabase Setup Guide for Sellar

Follow these steps to set up your Supabase database:

## Step 1: Create a Supabase Project

1. **Go to Supabase Dashboard** (already open in your browser)
   - If not logged in, sign up at https://supabase.com
   - Click "New Project"

2. **Fill in project details:**
   - **Name:** sellar (or any name you prefer)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to you
   - **Plan:** Free tier is perfect to start

3. **Wait for project setup** (~2 minutes)

## Step 2: Get Your API Credentials

1. Once your project is ready, click on **Project Settings** (gear icon in sidebar)
2. Go to **API** section
3. You'll see:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon/public key** (a long string starting with "eyJ...")

4. **Copy these values** - you'll need them next!

## Step 3: Update Your .env File

1. Open the `.env` file in your project
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file

## Step 4: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Open the file `supabase-init.sql` in this project
4. **Copy ALL the SQL code** from that file
5. **Paste it** into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: "Success. No rows returned"

## Step 5: Verify the Setup

1. Go to **Table Editor** in Supabase sidebar
2. You should see 4 tables:
   - ✅ users
   - ✅ wallets
   - ✅ transactions
   - ✅ products

## Step 6: Test the Connection

1. Restart your development server:
   ```bash
   # Stop the current server (Ctrl+C in terminal)
   npm run dev
   ```

2. Check the browser console for any errors
3. Try signing up for a test account (when auth is implemented)

## 🎉 You're Done!

Your Supabase database is now configured and ready to use!

## Optional: Add Sample Data

If you want to test with sample data, run this in SQL Editor:

```sql
-- Insert a test user (replace with your actual auth user ID later)
INSERT INTO users (id, email, handle, display_name, bio)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'testcreator',
  'Test Creator',
  'This is a test creator account'
);

-- Get the user ID (you'll need this for next steps)
SELECT id, handle FROM users WHERE handle = 'testcreator';
```

## Troubleshooting

**Can't connect?**
- Double-check your .env file has correct URL and key
- Make sure there are no extra spaces in the values
- Restart your dev server after changing .env

**SQL errors?**
- Make sure you copied the entire SQL file
- Run it all at once, not line by line
- If you get "already exists" errors, tables are already created ✅

**Need help?**
- Check Supabase docs: https://supabase.com/docs
- Verify your project is active in the dashboard

---

**Quick Commands:**

```bash
# Restart dev server
npm run dev

# Check if .env is properly configured
cat .env

# Open Supabase dashboard
open https://supabase.com/dashboard
```
