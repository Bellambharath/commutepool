/*
  Warnings:

  - A unique constraint covering the columns `[owner_id,route_id,period,week_start_date]` on the table `weekly_offers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "weekly_requests" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_offers_owner_id_route_id_period_week_start_date_key" ON "weekly_offers"("owner_id", "route_id", "period", "week_start_date");
