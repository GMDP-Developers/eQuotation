-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "capacityUnit" TEXT NOT NULL,
    "ipAddress" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BARU',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ServiceRequest" ("capacity", "capacityUnit", "companyName", "contactName", "createdAt", "email", "id", "ipAddress", "notes", "phone", "position", "serviceType", "updatedAt") SELECT "capacity", "capacityUnit", "companyName", "contactName", "createdAt", "email", "id", "ipAddress", "notes", "phone", "position", "serviceType", "updatedAt" FROM "ServiceRequest";
DROP TABLE "ServiceRequest";
ALTER TABLE "new_ServiceRequest" RENAME TO "ServiceRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
