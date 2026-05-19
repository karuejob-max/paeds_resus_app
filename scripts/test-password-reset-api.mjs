/**
 * Call production (or local) auth.requestPasswordReset and print the JSON response.
 * Usage: node scripts/test-password-reset-api.mjs [email] [baseUrl]
 */
const email = process.argv[2] || "paedsresus254@gmail.com";
const base = (process.argv[3] || "https://www.paedsresus.com").replace(/\/$/, "");
const url = `${base}/api/trpc/auth.requestPasswordReset?batch=1`;

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ "0": { json: { email } } }),
});

const text = await res.text();
console.log("HTTP", res.status);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text.slice(0, 500));
}
