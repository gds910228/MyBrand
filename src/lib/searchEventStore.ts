/**
 * 搜索事件存储（feat-search-discovery-20260928，T13；能力块 E）。
 *
 * 空 Key 降级：按需求「空 Key 降级为内存存储即可」，本模块即内存实现，
 * 以固定容量环形缓冲保存最近的搜索事件。
 *
 * **为什么钉在 `globalThis`**（评审 spec_review_v1 D-5 / 决策 D-09）：
 * `next dev` 下 `/api/search`（写）与 `/api/admin/search-analytics`（读）可能落在
 * **不同的模块实例**上，模块级变量不共享，会导致 S14/S15 直接失败（写入后读不到）。
 * 钉到 `globalThis` 保证同一 Node 进程内单例。
 *
 * **遗留项**：内存存储仅适用于 dev / 单实例。多实例或需要长期留存时应替换为
 * 持久化存储（Notion 库 / Redis / 数据仓库）。见 deploy_report 遗留问题清单。
 */
import type { SearchEvent } from '@/lib/searchAnalytics';

/** 环形缓冲容量：只保留最近 N 条，防止内存无界增长。 */
export const MAX_STORED_EVENTS = 1000;

interface EventStoreState {
  events: SearchEvent[];
}

const GLOBAL_KEY = '__misotech_search_event_store__';

function getState(): EventStoreState {
  const g = globalThis as unknown as Record<string, EventStoreState | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { events: [] };
  }
  return g[GLOBAL_KEY]!;
}

/**
 * 记录一条事件。
 * **绝不抛异常**：分析是旁路能力，任何失败都不应影响主查询链路（调用方亦为 fire-and-forget）。
 */
export function recordEvent(event: SearchEvent): void {
  try {
    const state = getState();
    state.events.push(event);
    if (state.events.length > MAX_STORED_EVENTS) {
      state.events.splice(0, state.events.length - MAX_STORED_EVENTS);
    }
  } catch (error) {
    console.warn('[searchEventStore] failed to record event:', error);
  }
}

/** 读取全部已存事件（时间升序）。 */
export function listEvents(): SearchEvent[] {
  return [...getState().events];
}

/** 已存事件条数。 */
export function eventCount(): number {
  return getState().events.length;
}

/** 清空存储。 */
export function clearEvents(): void {
  getState().events = [];
}

/** 测试专用别名（语义更明确）。 */
export function resetSearchEventsForTest(): void {
  clearEvents();
}
