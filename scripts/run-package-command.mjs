import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const [command, ...args] = process.argv.slice(2);

const binaries = {
  dev: ["next", ["dev"]],
  build: ["next", ["build"]],
  start: ["next", ["start"]],
  lint: ["eslint", []],
};

const selected = binaries[command];

if (!selected) {
  console.error(`Unknown command: ${command ?? ""}`);
  process.exit(1);
}

process.chdir(projectRoot);

const [binary, defaultArgs] = selected;
const executable = join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? `${binary}.cmd` : binary,
);

const result = spawnSync(executable, [...defaultArgs, ...args], {
  cwd: projectRoot,
  env: {
    ...process.env,
    INIT_CWD: projectRoot,
    PWD: projectRoot,
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
