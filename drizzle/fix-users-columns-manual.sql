-- Run this in your MySQL client (Aiven console, MySQL Workbench, etc.) if pnpm db:fix-users cannot connect from your machine.
-- Run each ALTER separately; if you get "Duplicate column name", that column already exists — skip and run the next.

ALTER TABLE `users` ADD COLUMN `phone` varchar(20);
ALTER TABLE `users` ADD COLUMN `institutionalRole` enum('director','coordinator','finance_officer','department_head','staff_member');
ALTER TABLE `users` ADD COLUMN `providerType` enum('nurse','doctor','pharmacist','paramedic','lab_tech','respiratory_therapist','midwife','other');
ALTER TABLE `users` ADD COLUMN `userType` enum('individual','institutional','parent') DEFAULT 'individual';
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255);
ALTER TABLE `users` ADD COLUMN `instructorApprovedAt` timestamp NULL;
ALTER TABLE `users` ADD COLUMN `instructorNumber` varchar(32) UNIQUE;
ALTER TABLE `users` ADD COLUMN `instructorCertifiedAt` timestamp NULL;
ALTER TABLE `users` ADD COLUMN `resusGpsAccessExpiresAt` timestamp NULL;
