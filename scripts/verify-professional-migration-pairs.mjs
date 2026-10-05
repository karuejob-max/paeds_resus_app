import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const required = ["0169", "0170", "0171", "0172", "0173", "0175"];
const failures = [];

for (const number of required) {
  const apply = fs.readdirSync(path.join(root, "scripts")).find((file) => file.startsWith(`apply-${number}-`) && file.endsWith(".mjs"));
  const verify = fs.readdirSync(path.join(root, "scripts")).find((file) => file.startsWith(`verify-${number}-`) && file.endsWith(".mjs"));

  if (!apply) failures.push(`${number}: missing apply script`);
  if (!verify) failures.push(`${number}: missing verify script`);
  if (!packageJson.scripts?.[`db:apply-${number}`]) failures.push(`${number}: missing package script db:apply-${number}`);
  if (!packageJson.scripts?.[`db:verify-${number}`]) failures.push(`${number}: missing package script db:verify-${number}`);
}

if (failures.length) {
  console.error("Professional migration/verifier pairing check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[migration-pairs] PASS: ${required.length} professional integrity migrations have apply/verify scripts and package commands.`);
