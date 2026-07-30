import { syncAllActiveAccounts } from "@/services/email-sync.service";
import { logger } from "@/lib/logger";

const SCOPE = "sync-job";

export async function runSyncJob(): Promise<void> {
  const startedAt = Date.now();
  logger.info(SCOPE, "Sync job started");

  try {
    const results = await syncAllActiveAccounts();
    const totals = results.reduce(
      (acc, r) => ({
        fetched: acc.fetched + r.fetched,
        created: acc.created + r.created,
        analyzed: acc.analyzed + r.analyzed,
        failed: acc.failed + r.failed,
      }),
      { fetched: 0, created: 0, analyzed: 0, failed: 0 }
    );

    logger.info(SCOPE, "Sync job finished", {
      accounts: results.length,
      ...totals,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logger.error(SCOPE, "Sync job crashed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
