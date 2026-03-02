-- Add photo column to inventory_items table
-- Run this SQL command in your PostgreSQL database

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS photo VARCHAR(255);



