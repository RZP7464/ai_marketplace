-- CreateTable
CREATE TABLE "ai_configurations" (
    "id" SERIAL NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gemini',
    "api_key" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_configurations_merchant_id_idx" ON "ai_configurations"("merchant_id");

-- CreateIndex
CREATE INDEX "ai_configurations_provider_idx" ON "ai_configurations"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "ai_configurations_merchant_id_provider_key" ON "ai_configurations"("merchant_id", "provider");

-- AddForeignKey
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

