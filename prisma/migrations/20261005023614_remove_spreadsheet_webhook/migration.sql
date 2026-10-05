/*
  Warnings:

  - You are about to drop the column `spreadsheetUrl` on the `SiteSetting` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "aboutTitle" TEXT NOT NULL,
    "aboutDescription" TEXT NOT NULL,
    "aboutImage" TEXT,
    "aboutBullets" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSetting" ("aboutBullets", "aboutDescription", "aboutImage", "aboutTitle", "id", "updatedAt") SELECT "aboutBullets", "aboutDescription", "aboutImage", "aboutTitle", "id", "updatedAt" FROM "SiteSetting";
DROP TABLE "SiteSetting";
ALTER TABLE "new_SiteSetting" RENAME TO "SiteSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
