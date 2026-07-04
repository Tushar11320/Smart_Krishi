-- Fix invalid datetime values in buyer_profiles and user_addresses
-- Root cause: SQL direct inserts don't trigger JPA @UpdateTimestamp,
--             leaving updated_at as MySQL zero-date (0000-00-00)
--             which Hibernate refuses to load → login fails with 400
USE smart_krishi;

-- Relax strict mode so the session can read/update the zero-date rows
SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION';

-- Fix buyer_profiles for all demo users (identify by user_id, not by the bad datetime)
UPDATE buyer_profiles
SET updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%.demo@smartkrishi.test'
);

-- Fix user_addresses for all demo users
UPDATE user_addresses
SET updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%.demo@smartkrishi.test'
);

-- Also fix any other demo-user-related rows that might have the same issue
-- (seller_profiles created_at / updated_at are fine since NOW() was used in seed)

-- Restore strict mode
SET SESSION sql_mode = DEFAULT;

-- Verify: all updated_at must now be valid non-zero timestamps
SELECT 'buyer_profiles' AS tbl, id, user_id, updated_at
FROM buyer_profiles
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%.demo@smartkrishi.test'
)
UNION ALL
SELECT 'user_addresses', id, user_id, updated_at
FROM user_addresses
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%.demo@smartkrishi.test'
);
