-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "venue" TEXT,
    "event" TEXT,
    "round" TEXT,
    "whitePlayer" TEXT,
    "whiteRating" INTEGER,
    "blackPlayer" TEXT,
    "blackRating" INTEGER,
    "moveHistory" JSONB NOT NULL,
    "result" TEXT,
    "pgn" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Game_userId_idx" ON "Game"("userId");

-- CreateIndex
CREATE INDEX "Game_whitePlayer_idx" ON "Game"("whitePlayer");

-- CreateIndex
CREATE INDEX "Game_blackPlayer_idx" ON "Game"("blackPlayer");

-- CreateIndex
CREATE INDEX "Game_date_idx" ON "Game"("date");

-- CreateIndex
CREATE INDEX "Game_event_idx" ON "Game"("event");

-- CreateIndex
CREATE INDEX "Game_venue_idx" ON "Game"("venue");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
