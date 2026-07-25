import { spawnSync } from "node:child_process";

const hasTinaCloudCredentials = Boolean(process.env.NEXT_PUBLIC_TINA_CLIENT_ID && process.env.TINA_TOKEN);
const args = ["tinacms", "build"];

if (!hasTinaCloudCredentials) {
  args.push("--local", "--skip-cloud-checks");
}

const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
