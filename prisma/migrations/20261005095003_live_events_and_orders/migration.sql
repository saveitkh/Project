-- CreateTable
CREATE TABLE "LiveEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liveSessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "username" TEXT,
    "text" TEXT,
    "payloadJson" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestedPin" BOOLEAN NOT NULL DEFAULT false,
    "pinReason" TEXT,
    CONSTRAINT "LiveEvent_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liveSessionId" TEXT NOT NULL,
    "liveEventId" TEXT,
    "username" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "detectedProductCode" TEXT,
    "detectedQuantity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    CONSTRAINT "OrderSuggestion_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderSuggestion_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tiktokAccountId" TEXT,
    "preLiveAuditId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "dataSource" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "adapterMode" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "metricsJson" TEXT,
    "apiErrorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_tiktokAccountId_fkey" FOREIGN KEY ("tiktokAccountId") REFERENCES "TikTokAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_preLiveAuditId_fkey" FOREIGN KEY ("preLiveAuditId") REFERENCES "PreLiveAudit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LiveSession" ("apiErrorMessage", "createdAt", "customerId", "dataSource", "endedAt", "id", "metricsJson", "startedAt", "status", "tiktokAccountId") SELECT "apiErrorMessage", "createdAt", "customerId", "dataSource", "endedAt", "id", "metricsJson", "startedAt", "status", "tiktokAccountId" FROM "LiveSession";
DROP TABLE "LiveSession";
ALTER TABLE "new_LiveSession" RENAME TO "LiveSession";
CREATE INDEX "LiveSession_customerId_idx" ON "LiveSession"("customerId");
CREATE TABLE "new_RiskFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptVersionId" TEXT,
    "productReviewId" TEXT,
    "liveEventId" TEXT,
    "statement" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "saferAlternative" TEXT NOT NULL,
    "evidenceSource" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskFinding_scriptVersionId_fkey" FOREIGN KEY ("scriptVersionId") REFERENCES "ScriptVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskFinding_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskFinding_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RiskFinding" ("category", "confidence", "createdAt", "evidenceSource", "id", "productReviewId", "reasoning", "riskLevel", "saferAlternative", "scriptVersionId", "statement") SELECT "category", "confidence", "createdAt", "evidenceSource", "id", "productReviewId", "reasoning", "riskLevel", "saferAlternative", "scriptVersionId", "statement" FROM "RiskFinding";
DROP TABLE "RiskFinding";
ALTER TABLE "new_RiskFinding" RENAME TO "RiskFinding";
CREATE INDEX "RiskFinding_scriptVersionId_idx" ON "RiskFinding"("scriptVersionId");
CREATE INDEX "RiskFinding_productReviewId_idx" ON "RiskFinding"("productReviewId");
CREATE INDEX "RiskFinding_liveEventId_idx" ON "RiskFinding"("liveEventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LiveEvent_liveSessionId_idx" ON "LiveEvent"("liveSessionId");

-- CreateIndex
CREATE INDEX "LiveEvent_type_idx" ON "LiveEvent"("type");

-- CreateIndex
CREATE INDEX "OrderSuggestion_liveSessionId_idx" ON "OrderSuggestion"("liveSessionId");

-- CreateIndex
CREATE INDEX "OrderSuggestion_status_idx" ON "OrderSuggestion"("status");
