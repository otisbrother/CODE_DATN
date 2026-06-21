-- Migration: ho so giang vien (avatar, headline, bio) cho khu "Nguoi Truyen Lua"
-- Chay: mysql -u root elearning_ai < database/migration_lecturer_profile.sql

ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(500) NULL AFTER status,
  ADD COLUMN headline   VARCHAR(160) NULL AFTER avatar_url,
  ADD COLUMN bio        TEXT         NULL AFTER headline;
