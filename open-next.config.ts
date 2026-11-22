import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Cloudflare Workers 适配配置（OpenNext）。
 *
 * 增量缓存：先用 static-assets（构建期预渲染产物直读，回退 isolate 内存缓存），
 * 零额外权限即可上线。后续若需跨 isolate 持久 ISR 缓存，切换为 R2：
 *   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
 *   incrementalCache: r2IncrementalCache,
 *   并在 wrangler.jsonc 增加 r2_buckets 绑定 NEXT_INC_CACHE_R2_BUCKET（需令牌补 R2:Edit 权限）。
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
