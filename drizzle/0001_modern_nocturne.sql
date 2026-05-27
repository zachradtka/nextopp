CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "idx_opportunities_company_trgm" ON "opportunities" USING gin ("company" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_role_trgm" ON "opportunities" USING gin ("role" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_job_id_trgm" ON "opportunities" USING gin ("job_id" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_location_trgm" ON "opportunities" USING gin ("location" gin_trgm_ops);