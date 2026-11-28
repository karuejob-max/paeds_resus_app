const OFFICIAL = /^[0-9]{4,6}$/;

/**
 * Decide, without touching the database, what an import would do.
 * `existing` is every row currently in kmhflFacilities: { id, name, code, county, facilityType, operationalStatus }.
 * `incoming` is the parsed file: { name, code, county, facilityType, operationalStatus }.
 * Returns { inserts, updates, converted, skipped }. `updates` and `converted` carry the row id and new values.
 */
export function planImport(incoming, existing) {
  const byCode = new Map();
  const sampleByName = new Map();
  for (const row of existing) {
    if (OFFICIAL.test(String(row.code ?? "").trim())) byCode.set(String(row.code).trim(), row);
    else {
      const key = String(row.name ?? "").trim().toLowerCase();
      if (!sampleByName.has(key)) sampleByName.set(key, []);
      sampleByName.get(key).push(row);
    }
  }
  const seen = new Set();
  const plan = { inserts: [], updates: [], converted: [], skipped: 0, duplicates: 0 };
  for (const row of incoming) {
    const code = String(row.code ?? "").trim();
    const name = String(row.name ?? "").trim();
    if (!name || !OFFICIAL.test(code)) { plan.skipped += 1; continue; }
    if (seen.has(code)) { plan.duplicates += 1; continue; }
    seen.add(code);
    const next = { name, code, county: row.county ?? null, facilityType: row.facilityType ?? null, operationalStatus: row.operationalStatus ?? "operational" };

    const match = byCode.get(code);
    if (match) {
      const changed = match.name !== next.name || (match.county ?? null) !== next.county || (match.facilityType ?? null) !== next.facilityType || match.operationalStatus !== next.operationalStatus;
      if (changed) plan.updates.push({ id: match.id, ...next });
      continue;
    }
    const candidates = sampleByName.get(name.toLowerCase()) ?? [];
    const sample = candidates.find((c) => !c.claimed && (!c.county || !next.county || String(c.county).toLowerCase() === next.county.toLowerCase()));
    if (sample) {
      sample.claimed = true;
      plan.converted.push({ id: sample.id, ...next });
      continue;
    }
    plan.inserts.push(next);
  }
  return plan;
}
