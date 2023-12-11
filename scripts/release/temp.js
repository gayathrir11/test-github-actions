import { execSync } from "child_process";

console.log(`Creating release version bump PR...`);
execSync(`npm version patch`, { stdio: "inherit" });