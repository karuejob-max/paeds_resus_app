-- HI-CERT-1: Dedupe scheduled renewal emails per certificate row
ALTER TABLE `certificates` ADD COLUMN `renewalReminderSentAt` timestamp NULL;
