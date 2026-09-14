-- CreateTable
CREATE TABLE "automation" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'email',
    "target" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_orgId_idx" ON "automation"("orgId");

-- CreateIndex
CREATE INDEX "automation_userId_idx" ON "automation"("userId");

-- AddForeignKey
ALTER TABLE "automation" ADD CONSTRAINT "automation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation" ADD CONSTRAINT "automation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
