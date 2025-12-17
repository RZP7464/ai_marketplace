-- Add performance indexes for better query optimization
-- This migration is safe and will not delete any data

-- Indexes for credentials table
CREATE INDEX IF NOT EXISTS "credentials_merchant_id_idx" ON "credentials"("merchant_id");

-- Indexes for apis table
CREATE INDEX IF NOT EXISTS "apis_merchant_id_idx" ON "apis"("merchant_id");
CREATE INDEX IF NOT EXISTS "apis_merchant_id_api_type_idx" ON "apis"("merchant_id", "api_type");
CREATE INDEX IF NOT EXISTS "apis_auth_id_idx" ON "apis"("auth_id");

-- Indexes for users table
CREATE INDEX IF NOT EXISTS "users_merchant_id_idx" ON "users"("merchant_id");

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS "sessions_merchant_id_idx" ON "sessions"("merchant_id");
CREATE INDEX IF NOT EXISTS "sessions_merchant_id_createdAt_idx" ON "sessions"("merchant_id", "createdAt" DESC);

-- Indexes for chats table
CREATE INDEX IF NOT EXISTS "chats_session_id_idx" ON "chats"("session_id");
CREATE INDEX IF NOT EXISTS "chats_session_id_createdAt_idx" ON "chats"("session_id", "createdAt");
CREATE INDEX IF NOT EXISTS "chats_merchant_id_idx" ON "chats"("merchant_id");

