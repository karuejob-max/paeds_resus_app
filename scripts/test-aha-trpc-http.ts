/**
 * Smoke-test AHA course resolution via running dev server.
 * Run: pnpm run dev  (separate terminal)
 *      pnpm exec tsx scripts/test-aha-trpc-http.ts
 */
const base = process.env.API_BASE ?? "http://localhost:3000";

async function trpcQuery(procedure: string, input: unknown) {
  const url = `${base}/api/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${procedure} HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  return body?.result?.data?.json ?? body;
}

async function main() {
  const anchor = await trpcQuery("learning.getAhaCourseAnchor", { programType: "bls" });
  console.log("getAhaCourseAnchor(bls):", anchor);

  const bySlug = await trpcQuery("learning.getCourseDetails", {
    courseId: 0,
    programType: "bls",
  });
  console.log("getCourseDetails(0, bls):", {
    id: bySlug?.id,
    moduleCount: bySlug?.modules?.length ?? 0,
  });

  const stale = await trpcQuery("learning.getCourseDetails", {
    courseId: 1,
    programType: "bls",
  });
  console.log("getCourseDetails(1, bls):", {
    id: stale?.id,
    programType: stale?.programType,
    moduleCount: stale?.modules?.length ?? 0,
  });

  if (!stale?.modules?.length) {
    console.error("FAIL: expected modules on resolved BLS course");
    process.exit(1);
  }
  console.log("OK — stale id=1 resolves to course with modules");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
