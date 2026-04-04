-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "lastLikeReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Insert initial settings row
INSERT INTO "SystemSettings" ("id", "lastLikeReset") VALUES ('global', CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;
