-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'BOTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleId" TEXT,
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN "profilePictureUrl" TEXT,
ADD COLUMN "googleProfileData" JSONB;

-- AlterTable - Make password optional for Google SSO users
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex  
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_authProvider_idx" ON "User"("email", "authProvider");