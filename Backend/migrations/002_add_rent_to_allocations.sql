-- Migration: Add rent column to allocations table with default 0
-- Compatible with MySQL versions without ADD COLUMN IF NOT EXISTS support

USE cms;

SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'allocations'
    AND COLUMN_NAME = 'rent'
);

SET @sql := IF(
  @exists = 0,
  'ALTER TABLE allocations ADD COLUMN rent DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT ''Optional rent amount''',
  'ALTER TABLE allocations MODIFY COLUMN rent DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT ''Optional rent amount'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE allocations SET rent = 0 WHERE rent IS NULL;

SELECT 'Migration complete: rent column ensured on allocations with default 0' AS status;
