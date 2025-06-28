-- Rollback script for Google authentication fields migration
-- This script undoes the changes made in migration.sql

-- Drop indexes first (in reverse order)
DROP INDEX IF EXISTS "User_email_authProvider_idx";
DROP INDEX IF EXISTS "User_googleId_idx";
DROP INDEX IF EXISTS "User_googleId_key";

-- Remove columns from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "googleProfileData";
ALTER TABLE "User" DROP COLUMN IF EXISTS "profilePictureUrl";
ALTER TABLE "User" DROP COLUMN IF EXISTS "authProvider";
ALTER TABLE "User" DROP COLUMN IF EXISTS "googleId";

-- Restore password column as NOT NULL
-- Note: This assumes all existing users have passwords
-- In production, you might need to handle users without passwords differently
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;

-- Drop the AuthProvider enum type
DROP TYPE IF EXISTS "AuthProvider";