-- AlterTable: Add businessId to Transaction
ALTER TABLE "Transaction" ADD COLUMN "businessId" TEXT;

-- CreateEnum: GoalType
DO $$ BEGIN
    CREATE TYPE "GoalType" AS ENUM ('SHORT_TERM', 'LONG_TERM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Business
CREATE TABLE IF NOT EXISTS "Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0066FF',
    "icon" TEXT NOT NULL DEFAULT 'briefcase',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinancialGoal
CREATE TABLE IF NOT EXISTS "FinancialGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(18,2) NOT NULL,
    "savedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "type" "GoalType" NOT NULL DEFAULT 'SHORT_TERM',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "aiPredictionMonths" INTEGER,
    "aiLastAnalyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Business_userId_idx" ON "Business"("userId");
CREATE INDEX IF NOT EXISTS "FinancialGoal_userId_idx" ON "FinancialGoal"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_userId_businessId_idx" ON "Transaction"("userId", "businessId");

-- AddForeignKey: Business.userId -> User.id
ALTER TABLE "Business" DROP CONSTRAINT IF EXISTS "Business_userId_fkey";
ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: FinancialGoal.userId -> User.id
ALTER TABLE "FinancialGoal" DROP CONSTRAINT IF EXISTS "FinancialGoal_userId_fkey";
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Transaction.businessId -> Business.id
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_businessId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
