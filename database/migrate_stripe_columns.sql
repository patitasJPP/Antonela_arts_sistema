-- Migracion: Agregar columnas faltantes para Stripe
-- Ejecutar en Neon SQL Editor

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE ordenes_compra ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
