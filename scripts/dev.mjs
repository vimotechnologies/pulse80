import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

const applications = [
  { name: "frontend", directory: "pulse80-frontend" },
  { name: "backend", directory: "pulse80-backend" },
];

const children = [];

for (const application of applications) {
  const packageJson = JSON.parse(
    await readFile(new URL(`../${application.directory}/package.json`, import.meta.url)),
  );

  if (!packageJson.scripts?.dev) {
    console.log(
      `[pulse80] ${application.name} skipped: no dev command has been configured yet.`,
    );
    continue;
  }

  const child = spawn("npm", ["run", "dev"], {
    cwd: new URL(`../${application.directory}/`, import.meta.url),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      TMPDIR: "/tmp",
    },
  });

  children.push(child);
}

if (children.length === 0) {
  console.error("[pulse80] No application has a dev command configured.");
  process.exitCode = 1;
}

const stopChildren = (signal) => {
  for (const child of children) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      process.exitCode = code;
      stopChildren("SIGTERM");
    }
  });
}
