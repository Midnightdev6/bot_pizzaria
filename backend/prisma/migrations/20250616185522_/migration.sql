/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `menu_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "menu_items_name_key" ON "menu_items"("name");
