#!/bin/bash

# Supabase Setup Script for Sellar
# This script helps you set up your Supabase database

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Sellar - Supabase Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    echo "❌ .env file not found. Creating from template..."
    cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
    echo "✅ Created .env file"
else
    echo "✅ .env file exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to https://supabase.com and sign up/login"
echo "2. Create a new project (takes ~2 minutes)"
echo "3. Once ready, go to Project Settings → API"
echo "4. Copy your credentials:"
echo "   - Project URL"
echo "   - anon/public key"
echo ""
echo "5. Update your .env file with these values:"
echo "   VITE_SUPABASE_URL=your_project_url"
echo "   VITE_SUPABASE_ANON_KEY=your_anon_key"
echo ""
echo "6. Go to SQL Editor in Supabase dashboard"
echo "7. Copy and run the SQL from 'supabase/sql/init/supabase-init.sql'"
echo ""

read -p "Press Enter when you're ready to open the .env file for editing..."

# Open .env file in default editor
if command -v code &> /dev/null; then
    code "${PROJECT_ROOT}/.env"
elif command -v nano &> /dev/null; then
    nano "${PROJECT_ROOT}/.env"
elif command -v vim &> /dev/null; then
    vim "${PROJECT_ROOT}/.env"
else
    open "${PROJECT_ROOT}/.env"
fi

echo ""
echo "✅ Setup complete! Run 'npm run dev' to start your app"
