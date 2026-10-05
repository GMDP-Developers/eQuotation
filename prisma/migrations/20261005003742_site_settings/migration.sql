-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "aboutTitle" TEXT NOT NULL,
    "aboutDescription" TEXT NOT NULL,
    "aboutImage" TEXT,
    "aboutBullets" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
