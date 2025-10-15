-- CreateIndex
CREATE INDEX "AdjustmentDocument_extractionStatus_projectId_idx" ON "AdjustmentDocument"("extractionStatus", "projectId");

-- CreateIndex
CREATE INDEX "TaxAdjustment_createdAt_idx" ON "TaxAdjustment"("createdAt");

-- CreateIndex
CREATE INDEX "TaxAdjustment_status_projectId_idx" ON "TaxAdjustment"("status", "projectId");
