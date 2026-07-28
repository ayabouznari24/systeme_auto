import cron from "node-cron";
import { DEFAULT_SYNC_INTERVAL_CRON } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { runSyncJob } from "./sync-job";

const SCOPE = "scheduler";

let task: cron.ScheduledTask | null = null;
let running = false;

/** Starts the recurring sync job (default: every 5 minutes). Idempotent. */
export function startScheduler(cronExpression: string = process.env.SYNC_CRON_SCHEDULE ?? DEFAULT_SYNC_INTERVAL_CRON) {
  if (task) {
    logger.warn(SCOPE, "Scheduler already running, ignoring duplicate start");
    return task;
  }

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  logger.info(SCOPE, `Scheduling email sync with cron expression "${cronExpression}"`);

  task = cron.schedule(cronExpression, async () => {
    if (running) {
      logger.warn(SCOPE, "Previous sync still running, skipping this tick");
      return;
    }
    running = true;
    try {
      await runSyncJob();
    } finally {
      running = false;
    }
  });

  return task;
}

export function stopScheduler() {
  task?.stop();
  task = null;
}
