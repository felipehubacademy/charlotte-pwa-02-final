-- Quick Fix: Disable RLS temporarily for testing
-- Execute no Supabase Dashboard se o fix anterior não funcionar

-- Disable RLS completely for testing
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Check table status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'push_subscriptions';

-- This will allow all operations without RLS restrictions
-- IMPORTANT: Only for development/testing! 