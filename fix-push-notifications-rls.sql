-- Fix RLS policies for push_subscriptions table
-- Execute este SQL no Supabase Dashboard

-- 1. Temporarily disable RLS to clean up
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

-- 3. Re-enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create more permissive policies that work with service_role

-- Allow service_role to do everything (for API operations)
CREATE POLICY "Service role full access"
    ON push_subscriptions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON push_subscriptions FOR SELECT
    USING (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Allow authenticated users to insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Allow authenticated users to update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Allow authenticated users to delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
    ON push_subscriptions FOR DELETE
    USING (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND user_id = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Test the policies by checking current role and permissions
SELECT 
    'Current auth role: ' || COALESCE(auth.role(), 'none') as auth_info,
    'Current user: ' || COALESCE(current_setting('request.jwt.claims', true)::json->>'sub', 'none') as user_info;

-- Show the newly created policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'push_subscriptions'; 