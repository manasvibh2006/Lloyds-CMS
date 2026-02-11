-- Migration: Add allocation_code column to allocations table
-- This is a NON-DESTRUCTIVE migration (adds column only)

USE cms;

-- Step 1: Add allocation_code column (nullable initially)
ALTER TABLE allocations 
ADD COLUMN IF NOT EXISTS allocation_code VARCHAR(6) NULL
COMMENT 'Format: BFRRBB (Building-Floor-Room-Bed)';

-- Step 2: Add index for faster lookups (after backfill completes)
-- This will be added after we generate codes for existing allocations
-- ALTER TABLE allocations ADD UNIQUE INDEX idx_allocation_code (allocation_code);

SELECT 'Migration complete: allocation_code column added' AS status;
