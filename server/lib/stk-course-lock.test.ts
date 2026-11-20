import { expect, it } from "vitest";
import { withStkCourseLock } from "./stk-course-lock";
it("serializes same learner/course requests and releases after failure", async () => {
  const events: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>(r => (release = r));
  const a = withStkCourseLock("same", async () => {
    events.push("a");
    await gate;
    throw new Error("test");
  });
  const b = withStkCourseLock("same", async () => {
    events.push("b");
    return 2;
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(events).toEqual(["a"]);
  release();
  await expect(a).rejects.toThrow("test");
  expect(await b).toBe(2);
  expect(events).toEqual(["a", "b"]);
  expect(await withStkCourseLock("same", async () => 3)).toBe(3);
});
