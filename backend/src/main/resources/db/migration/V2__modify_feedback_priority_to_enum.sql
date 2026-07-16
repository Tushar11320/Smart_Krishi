-- Flyway Database Migration
-- Version: V2
-- Description: Modify feedback priority column type to ENUM and preserve existing data

-- 1. Ensure any NULL values are set to the default 'MEDIUM' to satisfy NOT NULL constraint
UPDATE feedbacks SET priority = 'MEDIUM' WHERE priority IS NULL;

-- 2. Normalize case and trim whitespaces from existing priority strings
UPDATE feedbacks SET priority = UPPER(TRIM(priority));

-- 3. Fallback any invalid values that don't match the new ENUM options to 'MEDIUM'
UPDATE feedbacks SET priority = 'MEDIUM' 
WHERE priority NOT IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- 4. Alter the feedbacks table priority column to ENUM
ALTER TABLE feedbacks 
MODIFY COLUMN priority ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM';
