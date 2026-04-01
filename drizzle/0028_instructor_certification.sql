-- Paeds Resus instructor journey: program type `instructor` + user instructor number / certified-at.
-- Prefer idempotent apply: pnpm run db:apply-0028

-- ALTER TABLE `users` ADD COLUMN `instructorNumber` varchar(32) NULL;
-- ALTER TABLE `users` ADD UNIQUE KEY `users_instructorNumber_unique` (`instructorNumber`);
-- ALTER TABLE `users` ADD COLUMN `instructorCertifiedAt` timestamp NULL DEFAULT NULL;

-- ALTER TABLE `enrollments` MODIFY COLUMN `programType` ENUM('bls','acls','pals','fellowship','instructor') NOT NULL;
-- ALTER TABLE `certificates` MODIFY COLUMN `programType` ENUM('bls','acls','pals','fellowship','instructor') NOT NULL;
-- ALTER TABLE `courses` MODIFY COLUMN `programType` ENUM('bls','acls','pals','fellowship','instructor') NOT NULL;
