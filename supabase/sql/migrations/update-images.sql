-- ==========================================
-- UPDATE IMAGES for existing creators & products
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Creator profile pictures
UPDATE users SET avatar_url = '/images/profiles/arjun.png' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE users SET avatar_url = '/images/profiles/priya.png' WHERE id = 'a2000000-0000-0000-0000-000000000002';
UPDATE users SET avatar_url = '/images/profiles/rahul.png' WHERE id = 'a3000000-0000-0000-0000-000000000003';
UPDATE users SET avatar_url = '/images/profiles/vikram.png' WHERE id = 'a4000000-0000-0000-0000-000000000004';
UPDATE users SET avatar_url = '/images/profiles/neha.png' WHERE id = 'a5000000-0000-0000-0000-000000000005';

-- Arjun's products
UPDATE products SET image_url = '/images/products/react-mastery.png' WHERE creator_id = 'a1000000-0000-0000-0000-000000000001' AND title = 'React Mastery Course';
UPDATE products SET image_url = '/images/products/nodejs-blueprint.png' WHERE creator_id = 'a1000000-0000-0000-0000-000000000001' AND title = 'Node.js Backend Blueprint';
UPDATE products SET image_url = '/images/products/saas-starter.png' WHERE creator_id = 'a1000000-0000-0000-0000-000000000001' AND title = 'SaaS Starter Kit';
UPDATE products SET image_url = '/images/products/dev-toolkit.png' WHERE creator_id = 'a1000000-0000-0000-0000-000000000001' AND title = 'Developer Productivity Toolkit';
UPDATE products SET image_url = '/images/products/system-design.png' WHERE creator_id = 'a1000000-0000-0000-0000-000000000001' AND title = 'System Design Interview Guide';

-- Priya's products
UPDATE products SET image_url = '/images/products/finance-masterclass.png' WHERE creator_id = 'a2000000-0000-0000-0000-000000000002' AND title = 'Personal Finance Masterclass';
UPDATE products SET image_url = '/images/products/mutual-fund.png' WHERE creator_id = 'a2000000-0000-0000-0000-000000000002' AND title = 'Mutual Fund Selection Framework';
UPDATE products SET image_url = '/images/products/tax-playbook.png' WHERE creator_id = 'a2000000-0000-0000-0000-000000000002' AND title = 'Tax Saving Playbook 2025';
UPDATE products SET image_url = '/images/products/budget-tracker.png' WHERE creator_id = 'a2000000-0000-0000-0000-000000000002' AND title = 'Monthly Budget Tracker (Notion)';
UPDATE products SET image_url = '/images/products/retirement-calc.png' WHERE creator_id = 'a2000000-0000-0000-0000-000000000002' AND title = 'Retirement Planning Calculator';

-- Rahul's products
UPDATE products SET image_url = '/images/products/startup-legal.png' WHERE creator_id = 'a3000000-0000-0000-0000-000000000003' AND title = 'Startup Legal Kit';
UPDATE products SET image_url = '/images/products/freelancer-contract.png' WHERE creator_id = 'a3000000-0000-0000-0000-000000000003' AND title = 'Freelancer Contract Pack';
UPDATE products SET image_url = '/images/products/tenant-rights.png' WHERE creator_id = 'a3000000-0000-0000-0000-000000000003' AND title = 'Tenant Rights Guide';
UPDATE products SET image_url = '/images/products/gst-handbook.png' WHERE creator_id = 'a3000000-0000-0000-0000-000000000003' AND title = 'GST Compliance Handbook';

-- Vikram's products
UPDATE products SET image_url = '/images/products/cricket-fitness.png' WHERE creator_id = 'a4000000-0000-0000-0000-000000000004' AND title = '12-Week Cricket Fitness Program';
UPDATE products SET image_url = '/images/products/sports-nutrition.png' WHERE creator_id = 'a4000000-0000-0000-0000-000000000004' AND title = 'Sports Nutrition Blueprint';
UPDATE products SET image_url = '/images/products/mental-toughness.png' WHERE creator_id = 'a4000000-0000-0000-0000-000000000004' AND title = 'Mental Toughness Playbook';
UPDATE products SET image_url = '/images/products/injury-prevention.png' WHERE creator_id = 'a4000000-0000-0000-0000-000000000004' AND title = 'Injury Prevention & Recovery Guide';
UPDATE products SET image_url = '/images/products/batting-masterclass.png' WHERE creator_id = 'a4000000-0000-0000-0000-000000000004' AND title = 'Cricket Batting Masterclass';

-- Neha's products
UPDATE products SET image_url = '/images/products/stock-course.png' WHERE creator_id = 'a5000000-0000-0000-0000-000000000005' AND title = 'Stock Market Complete Course';
UPDATE products SET image_url = '/images/products/options-trading.png' WHERE creator_id = 'a5000000-0000-0000-0000-000000000005' AND title = 'Options Trading Playbook';
UPDATE products SET image_url = '/images/products/stock-screener.png' WHERE creator_id = 'a5000000-0000-0000-0000-000000000005' AND title = 'Stock Screener Template';
UPDATE products SET image_url = '/images/products/ipo-framework.png' WHERE creator_id = 'a5000000-0000-0000-0000-000000000005' AND title = 'IPO Analysis Framework';
UPDATE products SET image_url = '/images/products/trading-journal.png' WHERE creator_id = 'a5000000-0000-0000-0000-000000000005' AND title = 'Trading Journal + Risk Calculator';

SELECT 'All image URLs updated!' AS result;
