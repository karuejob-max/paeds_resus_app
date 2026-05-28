-- NRP (Neonatal Resuscitation Program) — AHA/AAP 2025-aligned certification track
ALTER TABLE `enrollments` MODIFY COLUMN `programType` ENUM(
  'bls', 'acls', 'pals', 'fellowship', 'instructor', 'fellowship_diploma', 'heartsaver', 'nrp'
) NOT NULL;

ALTER TABLE `certificates` MODIFY COLUMN `programType` ENUM(
  'bls', 'acls', 'pals', 'fellowship', 'instructor', 'fellowship_diploma', 'heartsaver',
  'bls_cognitive', 'acls_cognitive', 'pals_cognitive', 'heartsaver_cognitive',
  'nrp', 'nrp_cognitive'
) NOT NULL;

ALTER TABLE `courses` MODIFY COLUMN `programType` ENUM(
  'bls', 'acls', 'pals', 'fellowship', 'instructor', 'fellowship_diploma', 'heartsaver', 'nrp'
) NOT NULL;
