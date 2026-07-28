/**
 * Standalone cron process entry point.
 *
 * Runs independently from the Next.js server (see docker-compose.yml's
 * `cron` service, or `npm run cron` locally) because serverless/edge Next.js
 * runtimes cannot host a long-lived setInterval-style scheduler.
 *
 * Usage:
 *   npm run cron        -> starts the recurring scheduler (every 5 min by default)
 *   npm run cron:once    -> runs a single sync pass and exits (useful for testing/CI)
 */
import { runSyncJob } from "./sync-job";
import { startScheduler } from "./scheduler";
import { logger } from "@/lib/logger";

const SCOPE = "cron-entrypoint";
const once = process.argv.includes("--once");

async function main() {
  if (once) {
    await runSyncJob();
    process.exit(0);
  }

  logger.info(SCOPE, "Starting cron process");
  await runSyncJob(); // run once immediately on boot, then follow the schedule
  startScheduler();

  process.on("SIGINT", () => {
    logger.info(SCOPE, "Received SIGINT, shutting down");
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    logger.info(SCOPE, "Received SIGTERM, shutting down");
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error(SCOPE, "Fatal error in cron process", { error: String(error) });
  process.exit(1);
});
