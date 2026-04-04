-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "language" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "spiciness" SET DATA TYPE VARCHAR(10);

-- CreateIndex
CREATE INDEX "Submission_isPublic_createdAt_idx" ON "Submission"("isPublic", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Submission_isPublic_likes_idx" ON "Submission"("isPublic", "likes" DESC);

-- CreateIndex
CREATE INDEX "Comment_submissionId_createdAt_idx" ON "Comment"("submissionId", "createdAt" DESC);
