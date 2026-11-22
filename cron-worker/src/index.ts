/**
 * 定时发布触发器(替代 Vercel Cron)。
 *
 * 每小时整点调用主站的 /api/cron/publish(见 src/app/api/cron/publish/route.ts):
 * 扫描 Notion 中 status=scheduled 且 scheduledAt<=now 的文章,逐篇转 published。
 * 鉴权走 Authorization: Bearer <CRON_SECRET>,与 Vercel Cron 行为一致。
 *
 * 部署:cd cron-worker && npx wrangler deploy
 * 配密:npx wrangler secret put CRON_SECRET(与主站 Worker 同值)
 */
interface Env {
  CRON_SECRET?: string;
}

const TARGET = 'https://misitebo.win/api/cron/publish';

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const secret = env.CRON_SECRET;
    if (!secret) {
      console.error('[cron] CRON_SECRET not set - endpoint would refuse; skip this run.');
      return;
    }
    ctx.waitUntil(
      (async () => {
        try {
          const res = await fetch(TARGET, {
            headers: { Authorization: `Bearer ${secret}` },
          });
          const body = await res.text();
          console.log(`[cron] ${TARGET} -> ${res.status} ${body.slice(0, 300)}`);
        } catch (e) {
          console.error('[cron] fetch failed:', e instanceof Error ? e.message : String(e));
        }
      })(),
    );
  },
};
