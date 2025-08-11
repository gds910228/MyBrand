"use client";

import React, { useMemo, useState } from "react";

type ColumnType = "text" | "number" | "rating" | "boolean" | "badge" | "link";

export interface ComparisonColumn {
  key: string; // 对应 data 中的字段
  label: string; // 表头显示
  type?: ColumnType; // 默认 text
  align?: "left" | "center" | "right"; // 默认 left
  higherIsBetter?: boolean; // 数值/评分/布尔参与“最佳”比较；number/rating: true=越大越好；boolean: true=为真即最佳
  highlight?: boolean; // 是否对该列启用“最佳”高亮（默认随 higherIsBetter 推断）
  width?: string; // 可选固定列宽，如 "140px"
}

export interface ComparisonRow {
  id: string;
  name: string; // 工具名
  url?: string; // 工具官网
  logo?: string; // 可选 Logo 地址
  // 其他任意字段用于列定义
  [key: string]: any;
}

export interface ComparisonTableProps {
  columns: ComparisonColumn[];
  data: ComparisonRow[];
  locale?: "en" | "zh";
  highlightWinners?: boolean; // 是否启用最佳高亮，默认 true
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
  dense?: boolean; // 紧凑模式
  className?: string;
}

/**
 * 评测对比表（横向对比多个工具）
 * - 横向滚动 + 粘性表头
 * - 支持排序（文本、数值、评分、布尔）
 * - 支持“最佳”高亮（数值/评分/布尔）
 * - 暗色/科技风 Tailwind 样式
 */
const ComparisonTable: React.FC<ComparisonTableProps> = ({
  columns,
  data,
  locale = "zh",
  highlightWinners = true,
  initialSortKey,
  initialSortDir = "desc",
  dense = false,
  className = "",
}) => {
  // 排序状态
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);

  // 计算最佳值索引（用于高亮）
  const winnersByColumn = useMemo(() => {
    const result = new Map<string, Set<string>>(); // key -> set(row.id)
    if (!highlightWinners || data.length === 0) return result;

    columns.forEach((col) => {
      const type = col.type ?? "text";
      const enable =
        typeof col.highlight === "boolean"
          ? col.highlight
          : ["number", "rating", "boolean"].includes(type) &&
            col.higherIsBetter !== undefined;

      if (!enable) return;

      // 收集可比较值
      const values: { id: string; value: number | boolean | null }[] = data.map(
        (row) => {
          const raw = row[col.key];
          if (type === "boolean") {
            return { id: row.id, value: typeof raw === "boolean" ? raw : null };
          }
          if (type === "number" || type === "rating") {
            const num =
              typeof raw === "number"
                ? raw
                : raw == null
                ? null
                : Number(raw);
            return { id: row.id, value: Number.isNaN(num as number) ? null : (num as number) };
          }
          return { id: row.id, value: null };
        }
      );

      // 过滤 null
      const comparable = values.filter((v) => v.value !== null);
      if (comparable.length === 0) return;

      // 找到最佳值
      let bestSet = new Set<string>();
      if (type === "boolean") {
        // 为真即最佳
        const bestVal = true;
        comparable.forEach((v) => {
          if (v.value === bestVal) bestSet.add(v.id);
        });
      } else {
        const nums = comparable.map((v) => v.value as number);
        const bestVal =
          col.higherIsBetter === false
            ? Math.min(...nums)
            : Math.max(...nums);
        comparable.forEach((v) => {
          if (v.value === bestVal) bestSet.add(v.id);
        });
      }

      result.set(col.key, bestSet);
    });

    return result;
  }, [columns, data, highlightWinners]);

  // 排序后的数据
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    const type = col.type ?? "text";
    const sortedData = [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      const toNum = (v: any) =>
        typeof v === "number" ? v : v == null ? NaN : Number(v);

      if (type === "number" || type === "rating") {
        const an = toNum(av);
        const bn = toNum(bv);
        if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
        if (Number.isNaN(an)) return 1;
        if (Number.isNaN(bn)) return -1;
        return an - bn;
      }

      if (type === "boolean") {
        const ab = !!av ? 1 : 0;
        const bb = !!bv ? 1 : 0;
        return ab - bb;
      }

      // text/link/badge 默认按字符串
      const as = (av ?? "").toString().toLowerCase();
      const bs = (bv ?? "").toString().toLowerCase();
      return as.localeCompare(bs);
    });

    if (sortDir === "desc") sortedData.reverse();
    return sortedData;
  }, [data, columns, sortKey, sortDir]);

  const t = (en: string, zh: string) => (locale === "zh" ? zh : en);

  const headerCell = (col: ComparisonColumn) => {
    const active = sortKey === col.key;
    const align =
      col.align === "center"
        ? "text-center"
        : col.align === "right"
        ? "text-right"
        : "text-left";
    return (
      <th
        key={col.key}
        style={{ width: col.width }}
        className={`sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-slate-900/50 ${align} px-4 py-3 font-semibold text-sm text-neutral-700 dark:text-neutral-200 border-b border-white/10 cursor-pointer select-none`}
        onClick={() => {
          if (sortKey !== col.key) {
            setSortKey(col.key);
            setSortDir("desc");
          } else {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
          }
        }}
        aria-sort={
          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <div className="inline-flex items-center gap-2">
          <span>{col.label}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${
              active ? "opacity-100" : "opacity-40"
            } ${active && sortDir === "asc" ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 12l-6-6h12l-6 6z" />
          </svg>
        </div>
      </th>
    );
  };

  const renderCell = (col: ComparisonColumn, row: ComparisonRow) => {
    const val = row[col.key];
    const type = col.type ?? "text";
    const align =
      col.align === "center"
        ? "text-center"
        : col.align === "right"
        ? "text-right"
        : "text-left";

    const isWinner =
      highlightWinners &&
      (col.highlight ?? ["number", "rating", "boolean"].includes(type)) &&
      winnersByColumn.get(col.key)?.has(row.id);

    const baseCellCls =
      "px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200";
    const winnerCls = isWinner
      ? "ring-1 ring-cyan-400/50 dark:ring-cyan-300/40 bg-cyan-50/50 dark:bg-cyan-900/20"
      : "";

    if (val == null) {
      return (
        <td className={`${baseCellCls} ${align} ${winnerCls}`}>
          <span className="opacity-60">—</span>
        </td>
      );
    }

    if (type === "number") {
      return (
        <td className={`${baseCellCls} ${align} ${winnerCls}`}>
          {typeof val === "number" ? val : Number(val)}
        </td>
      );
    }

    if (type === "rating") {
      const score =
        typeof val === "number"
          ? Math.max(0, Math.min(5, val))
          : Math.max(0, Math.min(5, Number(val)));
      const rounded = Math.round(score);
      return (
        <td className={`${baseCellCls} ${align} ${winnerCls}`}>
          <div className="inline-flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i + 1 <= rounded;
              return (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    filled
                      ? "text-yellow-400"
                      : "text-neutral-300 dark:text-neutral-600"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.036a1 1 0 00-1.175 0l-2.802 2.036c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81H6.93a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              );
            })}
            <span className="ml-1 text-xs opacity-70">{score.toFixed(1)}/5</span>
          </div>
        </td>
      );
    }

    if (type === "boolean") {
      const yes = !!val;
      return (
        <td className={`${baseCellCls} ${align} ${winnerCls}`}>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
              yes
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-neutral-500/15 text-neutral-400"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              {yes ? (
                <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
              ) : (
                <path d="M10 8.586L5.293 3.879 3.879 5.293 8.586 10l-4.707 4.707 1.414 1.414L10 11.414l4.707 4.707 1.414-1.414L11.414 10l4.707-4.707-1.414-1.414L10 8.586z" />
              )}
            </svg>
            {yes ? t("Yes", "支持") : t("No", "不支持")}
          </span>
        </td>
      );
    }

    if (type === "badge") {
      const arr: any[] = Array.isArray(val) ? val : [val];
      return (
        <td className={`${baseCellCls} ${align} ${winnerCls}`}>
          <div className="flex flex-wrap gap-1.5">
            {arr.filter(Boolean).map((item, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 text-xs rounded-full bg-neutral-500/15 text-neutral-700 dark:text-neutral-300"
              >
                {String(item)}
              </span>
            ))}
          </div>
        </td>
      );
    }

    if (type === "link") {
      // 支持 {label, href} 或 字符串（自动判定 http 前缀）
      if (typeof val === "object" && val && "href" in val) {
        return (
          <td className={`${baseCellCls} ${align} ${winnerCls}`}>
            <a
              href={(val as any).href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-cyan-300 hover:underline"
            >
              {(val as any).label ?? (val as any).href}
            </a>
          </td>
        );
      }
      const href = String(val);
      const isUrl = /^https?:\/\//i.test(href);
      return (
        <td className={`${baseCellCls} ${align} ${winnerCls}`}>
          {isUrl ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-cyan-300 hover:underline"
            >
              {t("Visit", "访问")}
            </a>
          ) : (
            <span>{href}</span>
          )}
        </td>
      );
    }

    // 默认文本
    return <td className={`${baseCellCls} ${align} ${winnerCls}`}>{String(val)}</td>;
  };

  return (
    <div className={`rounded-xl border border-white/15 bg-white/60 dark:bg-slate-900/60 backdrop-blur p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading text-neutral-900 dark:text-neutral-100">
          {t("Comparison", "对比表")}
        </h3>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {t("Click header to sort", "点击表头可排序")}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className={`min-w-[720px] w-full ${dense ? "text-sm" : "text-base"}`}>
          <thead>
            <tr className="bg-gradient-to-r from-slate-50/60 to-slate-100/60 dark:from-slate-800/50 dark:to-slate-800/20">
              {/* 固定“工具”列 */}
              <th className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-slate-900/50 px-4 py-3 text-left font-semibold text-sm text-neutral-700 dark:text-neutral-200 border-b border-white/10">
                {t("Tool", "工具")}
              </th>
              {columns.map((col) => headerCell(col))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-white/10 ${
                  idx % 2 === 1
                    ? "bg-white/40 dark:bg-slate-900/40"
                    : "bg-transparent"
                }`}
              >
                {/* 工具列：Logo + 名称 + 官网链接 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.logo ? (
                      // 使用原生 img 避免 Next/Image 域名限制
                      <img
                        src={row.logo}
                        alt={row.name}
                        width={28}
                        height={28}
                        className="rounded-md object-cover w-7 h-7 ring-1 ring-white/20"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 ring-1 ring-white/10" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {row.name}
                      </span>
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary dark:text-cyan-300 hover:underline"
                        >
                          {t("Website", "官网")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </td>

                {columns.map((col) => (
                  <React.Fragment key={col.key}>
                    {renderCell(col, row)}
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 图例说明 */}
      {highlightWinners && (
        <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          {t(
            "Highlighted cells indicate best-in-class for that column.",
            "高亮单元格表示该列中的最佳值。"
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;

/**
用法示例：

import ComparisonTable, { ComparisonColumn, ComparisonRow } from "@/components/ComparisonTable";

const columns: ComparisonColumn[] = [
  { key: "price", label: "价格/月(USD)", type: "number", higherIsBetter: false, highlight: true, align: "right", width: "140px" },
  { key: "rating", label: "综合评分", type: "rating", higherIsBetter: true, highlight: true, align: "center", width: "140px" },
  { key: "platforms", label: "平台", type: "badge" },
  { key: "api", label: "API", type: "boolean", higherIsBetter: true, highlight: true, align: "center", width: "100px" },
  { key: "docs", label: "文档", type: "link" },
];

const data: ComparisonRow[] = [
  {
    id: "t1",
    name: "Tool A",
    url: "https://a.com",
    logo: "https://logo.clearbit.com/a.com",
    price: 19,
    rating: 4.4,
    platforms: ["Web", "iOS"],
    api: true,
    docs: { label: "Docs", href: "https://a.com/docs" }
  },
  {
    id: "t2",
    name: "Tool B",
    url: "https://b.com",
    logo: "https://logo.clearbit.com/b.com",
    price: 0,
    rating: 4.1,
    platforms: ["Web", "Android"],
    api: false,
    docs: "https://b.com/docs"
  }
];

<ComparisonTable
  columns={columns}
  data={data}
  locale="zh"
  highlightWinners
  initialSortKey="rating"
  initialSortDir="desc"
/>

如需与 Notion 集成，可在服务层将 Database 的字段映射为上述 data/columns 结构后传入。
*/