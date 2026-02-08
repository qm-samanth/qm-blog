-- Add first_name and last_name columns to users table
ALTER TABLE users ADD COLUMN first_name varchar(100);
ALTER TABLE users ADD COLUMN last_name varchar(100);
