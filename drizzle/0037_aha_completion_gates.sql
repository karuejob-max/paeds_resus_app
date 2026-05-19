-- AHA-CERT-1: Two-part completion gates for BLS/ACLS/PALS
-- cognitiveModulesComplete: set by server when all online modules are finished
-- practicalSkillsSignedOff: set by an approved instructor after hands-on skills assessment
ALTER TABLE `enrollments`
  ADD COLUMN `cognitiveModulesComplete` boolean NOT NULL DEFAULT false,
  ADD COLUMN `practicalSkillsSignedOff` boolean NOT NULL DEFAULT false,
  ADD COLUMN `practicalSignedOffAt` timestamp NULL,
  ADD COLUMN `practicalSignedOffByUserId` int NULL,
  ADD COLUMN `practicalSignedOffByName` varchar(255) NULL;
