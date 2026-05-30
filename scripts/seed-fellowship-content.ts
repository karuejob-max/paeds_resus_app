import { parseSeedCliArgs, seedFellowshipContent } from "./fellowship-seed-lib";

const options = parseSeedCliArgs(process.argv.slice(2));

seedFellowshipContent(options).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
