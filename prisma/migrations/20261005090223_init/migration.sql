-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "market" TEXT,
    "protectionPlan" TEXT NOT NULL DEFAULT 'BASIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TikTokAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "usernameHandle" TEXT NOT NULL,
    "officialApiLinked" BOOLEAN NOT NULL DEFAULT false,
    "officialAuthStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TikTokAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreLiveAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tiktokAccountId" TEXT,
    "liveTitle" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "promotionalClaims" TEXT NOT NULL,
    "plannedScript" TEXT NOT NULL,
    "talkingPoints" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "plannedDurationMins" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreLiveAudit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PreLiveAudit_tiktokAccountId_fkey" FOREIGN KEY ("tiktokAccountId") REFERENCES "TikTokAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preLiveAuditId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Practice Session',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeSession_preLiveAuditId_fkey" FOREIGN KEY ("preLiveAuditId") REFERENCES "PreLiveAudit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScriptVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceSessionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "scriptText" TEXT NOT NULL,
    "overallRiskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptVersion_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptVersionId" TEXT,
    "productReviewId" TEXT,
    "statement" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "saferAlternative" TEXT NOT NULL,
    "evidenceSource" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskFinding_scriptVersionId_fkey" FOREIGN KEY ("scriptVersionId") REFERENCES "ScriptVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RiskFinding_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "claims" TEXT NOT NULL,
    "supportingDocuments" TEXT NOT NULL DEFAULT '[]',
    "productImages" TEXT NOT NULL DEFAULT '[]',
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tiktokAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "dataSource" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "metricsJson" TEXT,
    "apiErrorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_tiktokAccountId_fkey" FOREIGN KEY ("tiktokAccountId") REFERENCES "TikTokAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tiktokAccountId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "officialNotificationText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Incident_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Incident_tiktokAccountId_fkey" FOREIGN KEY ("tiktokAccountId") REFERENCES "TikTokAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProtectionReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "preLiveAuditId" TEXT,
    "incidentId" TEXT,
    "overallRiskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "topRisksJson" TEXT NOT NULL,
    "recommendedActionsJson" TEXT NOT NULL,
    "remainingUnknownsJson" TEXT NOT NULL,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProtectionReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProtectionReport_preLiveAuditId_fkey" FOREIGN KEY ("preLiveAuditId") REFERENCES "PreLiveAudit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProtectionReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppealCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "preparedText" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppealCase_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "TikTokAccount_customerId_idx" ON "TikTokAccount"("customerId");

-- CreateIndex
CREATE INDEX "PreLiveAudit_customerId_idx" ON "PreLiveAudit"("customerId");

-- CreateIndex
CREATE INDEX "PracticeSession_preLiveAuditId_idx" ON "PracticeSession"("preLiveAuditId");

-- CreateIndex
CREATE INDEX "ScriptVersion_practiceSessionId_idx" ON "ScriptVersion"("practiceSessionId");

-- CreateIndex
CREATE INDEX "RiskFinding_scriptVersionId_idx" ON "RiskFinding"("scriptVersionId");

-- CreateIndex
CREATE INDEX "RiskFinding_productReviewId_idx" ON "RiskFinding"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductReview_customerId_idx" ON "ProductReview"("customerId");

-- CreateIndex
CREATE INDEX "LiveSession_customerId_idx" ON "LiveSession"("customerId");

-- CreateIndex
CREATE INDEX "Incident_customerId_idx" ON "Incident"("customerId");

-- CreateIndex
CREATE INDEX "Evidence_incidentId_idx" ON "Evidence"("incidentId");

-- CreateIndex
CREATE INDEX "ProtectionReport_customerId_idx" ON "ProtectionReport"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "AppealCase_incidentId_key" ON "AppealCase"("incidentId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
