-- CreateTable
CREATE TABLE "MappedAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountCode" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "sarsItem" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
