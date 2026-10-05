-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProtectionReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "preLiveAuditId" TEXT,
    "incidentId" TEXT,
    "liveSessionId" TEXT,
    "overallRiskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "topRisksJson" TEXT NOT NULL,
    "recommendedActionsJson" TEXT NOT NULL,
    "remainingUnknownsJson" TEXT NOT NULL,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtectionReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProtectionReport_preLiveAuditId_fkey" FOREIGN KEY ("preLiveAuditId") REFERENCES "PreLiveAudit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProtectionReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProtectionReport_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProtectionReport" ("createdAt", "customerId", "id", "incidentId", "overallRiskScore", "pdfPath", "preLiveAuditId", "recommendedActionsJson", "remainingUnknownsJson", "riskLevel", "topRisksJson") SELECT "createdAt", "customerId", "id", "incidentId", "overallRiskScore", "pdfPath", "preLiveAuditId", "recommendedActionsJson", "remainingUnknownsJson", "riskLevel", "topRisksJson" FROM "ProtectionReport";
DROP TABLE "ProtectionReport";
ALTER TABLE "new_ProtectionReport" RENAME TO "ProtectionReport";
CREATE INDEX "ProtectionReport_customerId_idx" ON "ProtectionReport"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
