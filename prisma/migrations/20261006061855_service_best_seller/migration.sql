-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "imagePreview" TEXT,
    "imageFull" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bestSeller" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("active", "createdAt", "description", "id", "imageFull", "imagePreview", "name", "sortOrder", "subtitle", "updatedAt") SELECT "active", "createdAt", "description", "id", "imageFull", "imagePreview", "name", "sortOrder", "subtitle", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
