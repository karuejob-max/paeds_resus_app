-- B2B: admin-approved users may be linked as session instructors (trainingSchedules.instructorId)
ALTER TABLE `users` ADD COLUMN `instructorApprovedAt` timestamp NULL DEFAULT NULL;
