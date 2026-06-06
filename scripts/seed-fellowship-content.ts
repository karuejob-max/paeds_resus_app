import { parseSeedCliArgs, seedFellowshipContent } from "./fellowship-seed-lib";

const options = parseSeedCliArgs(process.argv.slice(2));

seedFellowshipContent(options)
  .then(() => process.exit(0))
  .catch((err) => {
  console.error(err);
  process.exitCode = 1;
  process.exit(1);
});
