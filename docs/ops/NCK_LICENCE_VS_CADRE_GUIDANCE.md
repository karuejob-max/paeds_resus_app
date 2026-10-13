# NCK licence number versus professional cadre

The NCK official registration page distinguishes registration from licensing: after the licensure examination, nurses apply for registration and licensing and receive a practice licence and a registration certificate. The NCK License Status page tells organisations to search the NCK Register using the **License Number** where possible and to filter by cadre.

Paeds Resus must therefore store these as separate fields:

- `cadre`: the professional category, such as KRCHN, KRPCCN, KRN, KRNM, or BScN.
- `credentialNumber`: the current regulator-issued practice licence number printed on the current NCK licence and usable for NCK register/status verification.
- `jurisdiction` and `issuer`: Kenya and Nursing Council of Kenya.
- `issuedAt`: first professional licence issue date.
- `expiresAt`: current licence validity end date.
- evidence: the current practice licence or regulator document.

A value such as `BSCN(9208)` should not be accepted as the current practice licence number merely because it was entered in that field. It looks like a cadre/registration/qualification-style identifier and must be reconciled against the actual current licence and the NCK register before verification. It should be preserved in audit history, not silently rewritten.

For providers with multiple cadres, use one credential record per separate current licence. Do not place a KRCHN cadre number or a KRPCCN cadre number in the current Licence Number field. If one NCK licence covers multiple cadres, record the regulator's single licence number once and capture the approved cadre(s) according to the evidence and the regulator record.

Sources:
- https://nckenya.com/registration/
- https://osp.nckenya.com/LicenseStatus
- https://osp.nckenya.com/
