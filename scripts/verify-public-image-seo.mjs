import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("client/public/manifest.json", "utf8"));
const checks = [
  [manifest.name.includes("Emergency Care Training"), "manifest name"],
  [manifest.description.includes("Kenya"), "manifest description"],
  [fs.readFileSync("client/src/App.tsx", "utf8").includes("<Route component={NotFound} />"), "404 route"],
  [fs.readFileSync("client/src/components/Footer.tsx", "utf8").includes("google-add-preferred-source-btn"), "Preferred Sources affordance"],
  [fs.readFileSync("client/index.html", "utf8").includes("news.google.com/swg/js/v1/publisher.js"), "Preferred Sources script"],
  [!/(Consolata|Mathari)/i.test(fs.readFileSync("client/src/pages/About.tsx", "utf8")), "About consent exclusion"],
  [!/(Consolata|Mathari)/i.test(fs.readFileSync("client/src/pages/Start.tsx", "utf8")), "Start consent exclusion"],
  [!/(Kenya and East Africa|East African Community|Kenya and LMICs|paediatric emergency-care organisation)/.test(fs.readFileSync("client/src/pages/About.tsx", "utf8")), "About stale copy"],
  [!/(Kenya and East Africa|East African Community|Kenya and LMICs|paediatric emergency-care organisation)/.test(fs.readFileSync("client/src/pages/Start.tsx", "utf8")), "Start stale copy"],
];
const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  console.error(failed.map(([, label]) => `FAIL: ${label}`).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${checks.length} public image/SEO assertions`);
