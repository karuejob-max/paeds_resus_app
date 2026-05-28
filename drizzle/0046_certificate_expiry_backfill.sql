UPDATE `certificates`
SET `expiryDate` = DATE_ADD(`issueDate`, INTERVAL 2 YEAR)
WHERE `expiryDate` IS NULL
  AND `programType` IN (
    'bls', 'acls', 'pals', 'heartsaver', 'nrp',
    'bls_cognitive', 'acls_cognitive', 'pals_cognitive', 'heartsaver_cognitive', 'nrp_cognitive',
    'fellowship'
  );

UPDATE `certificates`
SET `expiryDate` = DATE_ADD(`issueDate`, INTERVAL 2 YEAR)
WHERE `programType` IN (
    'bls', 'acls', 'pals', 'heartsaver', 'nrp',
    'bls_cognitive', 'acls_cognitive', 'pals_cognitive', 'heartsaver_cognitive', 'nrp_cognitive',
    'fellowship'
  )
  AND `expiryDate` IS NOT NULL
  AND TIMESTAMPDIFF(DAY, `issueDate`, `expiryDate`) < 700;
