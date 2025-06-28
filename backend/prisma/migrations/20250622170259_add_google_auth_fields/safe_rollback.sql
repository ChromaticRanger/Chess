-- Safe rollback script for Google authentication fields migration
-- This script safely handles users who may not have passwords (Google SSO users)

-- First, check if there are any users without passwords
-- DO NOT run this script if Google SSO users exist without a way to authenticate

-- Drop indexes first (in reverse order)
DROP INDEX IF EXISTS "User_email_authProvider_idx";
DROP INDEX IF EXISTS "User_googleId_idx";
DROP INDEX IF EXISTS "User_googleId_key";

-- WARNING: The following operations will remove Google SSO capability
-- Ensure you have a plan for users who only authenticate via Google

-- Option 1: Delete Google-only users (use with caution)
-- DELETE FROM "User" WHERE "password" IS NULL AND "authProvider" IN ('GOOGLE', 'BOTH');

-- Option 2: Set a temporary password for Google users (recommended for testing)
-- UPDATE "User" SET "password" = 'TEMP_PASSWORD_CHANGE_ME' WHERE "password" IS NULL;

-- Remove Google-specific columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "googleProfileData";
ALTER TABLE "User" DROP COLUMN IF EXISTS "profilePictureUrl";
ALTER TABLE "User" DROP COLUMN IF EXISTS "authProvider";
ALTER TABLE "User" DROP COLUMN IF EXISTS "googleId";

-- Restore password column as NOT NULL (only after handling Google users)
-- ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;

-- Drop the AuthProvider enum type
DROP TYPE IF EXISTS "AuthProvider";

-- NOTE: Uncomment the SET NOT NULL line above only after ensuring all users have passwords