import { NextResponse } from 'next/server';

/**
 * HTML 安全的 JSON 响应（feat-search-discovery-20260928，健壮性加固；验收项 S12）。
 *
 * 背景：`JSON.stringify` 不会转义 `<` `>` `&`，因此把用户输入（如查询串
 * `<script>alert(1)</script>`）原样回显时，**响应报文里会出现字面量 `<script>`**。
 *
 * 严格说 `Content-Type: application/json` 不是可执行上下文，单独的 JSON 回显不构成 XSS。
 * 但存在两类真实风险：
 * 1. 中间层 / 浏览器插件 / 日志查看器把 JSON 当 HTML 渲染；
 * 2. 前端若把该字段直接插入 `dangerouslySetInnerHTML`，回显即成为反射型 XSS 的入口。
 *
 * 因此采用业界通行的**无损转义**做法：把 `<` `>` `&` 以及 JS 行分隔符
 * `U+2028` / `U+2029` 序列化为 `\uXXXX` 形式。
 * **JSON 解析后得到的字符串与原文完全一致**（无损），但报文里不再出现可执行片段。
 */

/** 需要转义的字符 → `\uXXXX` 字面量（注意是反斜杠 + u，不是真实字符）。 */
const ESCAPE_MAP: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/** 匹配需要转义的字符。 */
const NEEDS_ESCAPE = /[<>&\u2028\u2029]/g;

/**
 * 序列化为 HTML 安全的 JSON 字符串。
 *
 * 先走标准 `JSON.stringify` 保证结构正确，再对结果做**字符串级**替换——
 * 这些字符在 JSON 输出中只会以字面量形式出现在字符串值里，不会构成结构字符，
 * 因此该替换不会破坏 JSON 结构。
 */
export function safeJsonStringify(body: unknown): string {
  const json = JSON.stringify(body) ?? 'null';
  return json.replace(NEEDS_ESCAPE, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/** 构造 HTML 安全的 JSON 响应。 */
export function safeJson(
  body: unknown,
  init?: { status?: number; headers?: HeadersInit },
): NextResponse {
  return new NextResponse(safeJsonStringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init?.headers || {}),
    },
  });
}
