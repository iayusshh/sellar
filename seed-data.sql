-- ==========================================
-- SELLAR SEED DATA — 5 Creators + Products
-- Run this in your Supabase SQL Editor
-- ==========================================

-- First, add the new columns if not already present
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- ==========================================
-- 1. TECH CREATOR — Arjun Mehta
-- ==========================================
INSERT INTO users (id, email, handle, display_name, bio, social_links) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'arjun@techbytes.io', 'arjuntech', 'Arjun Mehta',
   'Full-stack developer & educator. Building products, breaking things, teaching everything.',
   '{"instagram": "https://instagram.com/arjuntech", "x": "https://x.com/arjundev", "linkedin": "https://linkedin.com/in/arjunmehta", "website": "https://arjuntech.dev"}');

INSERT INTO wallets (id, user_id, balance) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 24500.00);

INSERT INTO products (creator_id, title, description, price, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'React Mastery Course', 'Complete React 19 course with hooks, suspense, server components. 12+ hours of HD video.', 1499.00, true),
  ('a1000000-0000-0000-0000-000000000001', 'Node.js Backend Blueprint', 'Production-grade Node.js + Express + PostgreSQL API template with auth, testing, and deployment scripts.', 999.00, true),
  ('a1000000-0000-0000-0000-000000000001', 'SaaS Starter Kit', 'Full-stack SaaS boilerplate — Next.js + Supabase + Stripe + Tailwind. Ship in a weekend.', 2999.00, true),
  ('a1000000-0000-0000-0000-000000000001', 'Developer Productivity Toolkit', 'VS Code configs, shell scripts, Git aliases, and workflow automations I use daily.', 299.00, true),
  ('a1000000-0000-0000-0000-000000000001', 'System Design Interview Guide', '50+ system design problems with solutions. Diagrams, trade-offs, and real-world patterns.', 799.00, true);

-- ==========================================
-- 2. FINANCE CREATOR — Priya Sharma
-- ==========================================
INSERT INTO users (id, email, handle, display_name, bio, social_links) VALUES
  ('a2000000-0000-0000-0000-000000000002', 'priya@finwise.in', 'priyafinance', 'Priya Sharma',
   'CA turned personal finance educator. Helping millennials build wealth, one spreadsheet at a time.',
   '{"instagram": "https://instagram.com/priyafinance", "x": "https://x.com/priyasharmaCA", "linkedin": "https://linkedin.com/in/priyasharma"}');

INSERT INTO wallets (id, user_id, balance) VALUES
  ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 18200.00);

INSERT INTO products (creator_id, title, description, price, is_active) VALUES
  ('a2000000-0000-0000-0000-000000000002', 'Personal Finance Masterclass', 'Complete guide to budgeting, saving, investing, and tax planning for Indian salaried professionals.', 1299.00, true),
  ('a2000000-0000-0000-0000-000000000002', 'Mutual Fund Selection Framework', 'My exact framework for picking mutual funds. Includes screener template and comparison spreadsheet.', 499.00, true),
  ('a2000000-0000-0000-0000-000000000002', 'Tax Saving Playbook 2025', 'Every legal tax-saving strategy explained. Section 80C, 80D, HRA, NPS — with calculation sheets.', 699.00, true),
  ('a2000000-0000-0000-0000-000000000002', 'Monthly Budget Tracker (Notion)', 'Notion template for monthly expense tracking, savings goals, and net-worth dashboard.', 199.00, true),
  ('a2000000-0000-0000-0000-000000000002', 'Retirement Planning Calculator', 'Excel-based retirement corpus calculator with inflation adjustment and SIP projections.', 349.00, true);

-- ==========================================
-- 3. LAW CREATOR — Rahul Verma
-- ==========================================
INSERT INTO users (id, email, handle, display_name, bio, social_links) VALUES
  ('a3000000-0000-0000-0000-000000000003', 'rahul@legaledge.co', 'rahullaw', 'Adv. Rahul Verma',
   'Supreme Court advocate. Making law accessible through simple templates and plain English guides.',
   '{"x": "https://x.com/rahulvermalaw", "linkedin": "https://linkedin.com/in/advrahulverma", "website": "https://legaledge.co"}');

INSERT INTO wallets (id, user_id, balance) VALUES
  ('b3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 31400.00);

INSERT INTO products (creator_id, title, description, price, is_active) VALUES
  ('a3000000-0000-0000-0000-000000000003', 'Startup Legal Kit', 'Essential legal documents for startups — co-founder agreement, NDA, terms of service, privacy policy.', 2499.00, true),
  ('a3000000-0000-0000-0000-000000000003', 'Freelancer Contract Pack', '5 ready-to-use contract templates for freelancers. Covers scope, payment, IP, and dispute resolution.', 999.00, true),
  ('a3000000-0000-0000-0000-000000000003', 'Tenant Rights Guide', 'Know your rights as a tenant in India. Covers rent agreements, security deposits, and eviction laws.', 399.00, true),
  ('a3000000-0000-0000-0000-000000000003', 'GST Compliance Handbook', 'Step-by-step GST registration, filing, and compliance guide for small businesses.', 599.00, true);

-- ==========================================
-- 4. SPORTS CREATOR — Vikram Singh
-- ==========================================
INSERT INTO users (id, email, handle, display_name, bio, social_links) VALUES
  ('a4000000-0000-0000-0000-000000000004', 'vikram@fitforge.in', 'vikramsports', 'Vikram Singh',
   'Former national-level cricketer. Sports science grad. Building athletes through data-driven training.',
   '{"instagram": "https://instagram.com/vikramfitforge", "x": "https://x.com/vikramsports"}');

INSERT INTO wallets (id, user_id, balance) VALUES
  ('b4000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 9800.00);

INSERT INTO products (creator_id, title, description, price, is_active) VALUES
  ('a4000000-0000-0000-0000-000000000004', '12-Week Cricket Fitness Program', 'Periodized training plan for cricketers — strength, agility, endurance. Video demos included.', 1799.00, true),
  ('a4000000-0000-0000-0000-000000000004', 'Sports Nutrition Blueprint', 'Meal plans, macro calculations, and supplement guide for Indian athletes on a budget.', 599.00, true),
  ('a4000000-0000-0000-0000-000000000004', 'Mental Toughness Playbook', 'Psychology techniques used by elite athletes. Visualization, pre-game routines, pressure management.', 499.00, true),
  ('a4000000-0000-0000-0000-000000000004', 'Injury Prevention & Recovery Guide', 'Common sports injuries, prevention exercises, and rehab protocols. Based on sports science research.', 399.00, true),
  ('a4000000-0000-0000-0000-000000000004', 'Cricket Batting Masterclass', '3-hour video course breaking down batting technique, shot selection, and match situations.', 899.00, true);

-- ==========================================
-- 5. STOCK MARKET CREATOR — Neha Kapoor
-- ==========================================
INSERT INTO users (id, email, handle, display_name, bio, social_links) VALUES
  ('a5000000-0000-0000-0000-000000000005', 'neha@marketpulse.in', 'nehamarkets', 'Neha Kapoor',
   'SEBI-registered research analyst. 8 years in equity markets. Teaching retail investors to think like institutions.',
   '{"instagram": "https://instagram.com/nehamarkets", "x": "https://x.com/nehakapoorRA", "linkedin": "https://linkedin.com/in/nehakapoor", "website": "https://marketpulse.in"}');

INSERT INTO wallets (id, user_id, balance) VALUES
  ('b5000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 42100.00);

INSERT INTO products (creator_id, title, description, price, is_active) VALUES
  ('a5000000-0000-0000-0000-000000000005', 'Stock Market Complete Course', 'From candlesticks to company valuation. 20+ hours covering technical and fundamental analysis.', 3499.00, true),
  ('a5000000-0000-0000-0000-000000000005', 'Options Trading Playbook', 'Strategies for Nifty/Bank Nifty options — iron condors, straddles, spreads with real trade examples.', 1999.00, true),
  ('a5000000-0000-0000-0000-000000000005', 'Stock Screener Template', 'My personal Google Sheets screener with 15+ filters — PE, ROE, debt ratio, promoter holding, and more.', 499.00, true),
  ('a5000000-0000-0000-0000-000000000005', 'IPO Analysis Framework', 'How to evaluate IPOs before applying. Checklist, red flags, and valuation methods.', 349.00, true),
  ('a5000000-0000-0000-0000-000000000005', 'Trading Journal + Risk Calculator', 'Notion + Sheets combo for tracking trades, win rate, R:R ratio, and monthly P&L.', 299.00, true);

-- ==========================================
-- SAMPLE CLIENTS & PURCHASES (for testing)
-- ==========================================

-- Clients for Arjun (Tech)
INSERT INTO clients (id, creator_id, name, email, gender, location) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Rohit Kumar', 'rohit@gmail.com', 'male', 'Mumbai, India'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Sneha Patel', 'sneha.p@gmail.com', 'female', 'Bangalore, India'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Amit Joshi', 'amit.j@yahoo.com', 'male', 'Delhi, India');

-- Clients for Priya (Finance)
INSERT INTO clients (id, creator_id, name, email, gender, location) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Kavita Nair', 'kavita.n@gmail.com', 'female', 'Chennai, India'),
  ('c2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Sanjay Gupta', 'sanjay.g@outlook.com', 'male', 'Pune, India');

-- Clients for Neha (Stocks)
INSERT INTO clients (id, creator_id, name, email, gender, location) VALUES
  ('c5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Deepak Rao', 'deepak.rao@gmail.com', 'male', 'Hyderabad, India'),
  ('c5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000005', 'Ananya Singh', 'ananya.s@gmail.com', 'female', 'Mumbai, India'),
  ('c5000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000005', 'Rajesh Iyer', 'rajesh.i@hotmail.com', 'male', 'Bangalore, India');

-- Sample transactions (income) for wallets
INSERT INTO transactions (wallet_id, type, amount, source, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'income', 1499.00, 'React Mastery Course', 'completed'),
  ('b1000000-0000-0000-0000-000000000001', 'income', 2999.00, 'SaaS Starter Kit', 'completed'),
  ('b1000000-0000-0000-0000-000000000001', 'income', 999.00, 'Node.js Backend Blueprint', 'completed'),
  ('b2000000-0000-0000-0000-000000000002', 'income', 1299.00, 'Personal Finance Masterclass', 'completed'),
  ('b2000000-0000-0000-0000-000000000002', 'income', 499.00, 'Mutual Fund Selection Framework', 'completed'),
  ('b3000000-0000-0000-0000-000000000003', 'income', 2499.00, 'Startup Legal Kit', 'completed'),
  ('b3000000-0000-0000-0000-000000000003', 'income', 999.00, 'Freelancer Contract Pack', 'completed'),
  ('b5000000-0000-0000-0000-000000000005', 'income', 3499.00, 'Stock Market Complete Course', 'completed'),
  ('b5000000-0000-0000-0000-000000000005', 'income', 1999.00, 'Options Trading Playbook', 'completed'),
  ('b5000000-0000-0000-0000-000000000005', 'income', 499.00, 'Stock Screener Template', 'completed');

-- Pending withdrawal requests (for admin portal testing)
INSERT INTO transactions (wallet_id, type, amount, source, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'withdrawal', 5000.00, 'Bank Transfer', 'pending'),
  ('b5000000-0000-0000-0000-000000000005', 'withdrawal', 10000.00, 'Bank Transfer', 'pending');

-- Sample visits (for traffic tab)
INSERT INTO visits (creator_id, path, referrer, country, city, device) VALUES
  ('a1000000-0000-0000-0000-000000000001', '/arjuntech', 'https://google.com', 'India', 'Mumbai', 'mobile'),
  ('a1000000-0000-0000-0000-000000000001', '/arjuntech', 'https://x.com', 'India', 'Delhi', 'desktop'),
  ('a1000000-0000-0000-0000-000000000001', '/arjuntech', 'Direct', 'India', 'Bangalore', 'mobile'),
  ('a2000000-0000-0000-0000-000000000002', '/priyafinance', 'https://instagram.com', 'India', 'Chennai', 'mobile'),
  ('a2000000-0000-0000-0000-000000000002', '/priyafinance', 'https://google.com', 'India', 'Pune', 'desktop'),
  ('a5000000-0000-0000-0000-000000000005', '/nehamarkets', 'https://google.com', 'India', 'Hyderabad', 'desktop'),
  ('a5000000-0000-0000-0000-000000000005', '/nehamarkets', 'https://x.com', 'India', 'Mumbai', 'mobile'),
  ('a5000000-0000-0000-0000-000000000005', '/nehamarkets', 'https://linkedin.com', 'USA', 'New York', 'desktop'),
  ('a3000000-0000-0000-0000-000000000003', '/rahullaw', 'Direct', 'India', 'Delhi', 'desktop'),
  ('a4000000-0000-0000-0000-000000000004', '/vikramsports', 'https://instagram.com', 'India', 'Jaipur', 'mobile');

SELECT 'Seed data inserted successfully! 5 creators, 24 products, 8 clients, 12 transactions, 10 visits.' AS result;
