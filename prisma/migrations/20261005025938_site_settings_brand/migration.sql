-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "aboutTitle" TEXT NOT NULL,
    "aboutDescription" TEXT NOT NULL,
    "aboutImage" TEXT,
    "aboutBullets" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT 'eQuotation',
    "brandSubtitle" TEXT NOT NULL DEFAULT 'Service Request',
    "brandLogo" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSetting" ("aboutBullets", "aboutDescription", "aboutImage", "aboutTitle", "id", "updatedAt") SELECT "aboutBullets", "aboutDescription", "aboutImage", "aboutTitle", "id", "updatedAt" FROM "SiteSetting";
DROP TABLE "SiteSetting";
ALTER TABLE "new_SiteSetting" RENAME TO "SiteSetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
