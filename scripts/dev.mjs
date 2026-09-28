import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

const applications = [
  { name: "backend", directory: "pulse80-backend" },
  { name: "frontend", directory: "pulse80-frontend" },
];

const children = [];

const stopChildren = (signal) => {
  for (const child of children) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));

async function waitForBackend(child) {
  const graphqlUrl = process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";
  const healthUrl = new URL("/health", graphqlUrl);
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("Backend exited before its health check passed.");
    }

    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Backend did not become healthy at ${healthUrl} within 30 seconds.`);
}

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
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      process.exitCode = code;
      stopChildren("SIGTERM");
    }
  });

  if (application.name === "backend") {
    try {
      await waitForBackend(child);
      console.log("[pulse80] Backend health check passed.");
    } catch (error) {
      console.error(`[pulse80] ${error.message}`);
      process.exitCode = 1;
      stopChildren("SIGTERM");
      break;
    }
  }
}

if (children.length === 0) {
  console.error("[pulse80] No application has a dev command configured.");
  process.exitCode = 1;
}
