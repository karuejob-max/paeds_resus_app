import { describe, expect, it } from "vitest";
import { runResusGpsAuditForInstitution } from "./resusgps-auditor";

/** Flatten every literal and SQL fragment inside a drizzle condition into one string. */
function flatten(node: any, seen = new Set<unknown>()): string {
  if (node == null || typeof node !== "object" || seen.has(node)) return "";
  seen.add(node);
  let out = "";
  if (Array.isArray(node.value)) out += node.value.join(" ");
  else if (typeof node.value === "string" || typeof node.value === "number") out += ` ${node.value} `;
  for (const chunk of node.queryChunks ?? []) out += flatten(chunk, seen);
  return out;
}

describe("ResusGPS audit scope", () => {
  it("only considers linked, non-removed staff (never pending, rejected or removed rows)", async () => {
    let staffCondition: unknown = null;
    const db: any = {
      select: () => ({
        from: () => ({
          where: (cond: unknown) => {
            staffCondition = cond;
            return Promise.resolve([]); // no staff -> returns early with an empty result
          },
        }),
      }),
    };
    const result = await runResusGpsAuditForInstitution(db, 12);
    expect(result.success).toBe(true);
    expect(result.scannedCasesCount).toBe(0);

    const sqlText = flatten(staffCondition).toLowerCase();
    expect(sqlText).toContain("linked");
    expect(sqlText).toContain("is null"); // removedAt IS NULL
    expect(sqlText).toContain(" 12 "); // scoped to the requested institution
  });
});
