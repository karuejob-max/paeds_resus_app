-- Run this in your MySQL client (Aiven console, MySQL Workbench, etc.) if pnpm db:fix-users cannot connect from your machine.
-- Run each ALTER separately; if you get "Duplicate column name", that column already exists — skip and run the next.

ALTER TABLE `users` ADD COLUMN `phone` varchar(20);
ALTER TABLE `users` ADD COLUMN `providerType` enum('nurse','doctor','pharmacist','paramedic','lab_tech','respiratory_therapist','midwife','other');
ALTER TABLE `users` ADD COLUMN `userType` enum('individual','institutional','parent') DEFAULT 'individual';
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255);
