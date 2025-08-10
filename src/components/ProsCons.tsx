"use client";

import React from "react";

type Props = {
  pros?: string; // 多行文本，建议每行以 - 开头
  cons?: string; // 多行文本，建议每行以 - 开头
  locale?: "en" | "zh";
};

const labels = {
  en: { pros: "Pros", cons: "Cons" },
  zh: { pros: "优点", cons: "缺点" },
};

function parseLines(input?: string): string[] {
  if (!input) return [];
  return input
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^-\s*/, "")); // 去掉行首 -
}

export default function ProsCons({ pros, cons, locale = "en" }: Props) {
  const p = parseLines(pros);
  const c = parseLines(cons);

  if (p.length === 0 && c.length === 0) return null;

  const t = labels[locale];

  return (
    <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {p.length > 0 && (
        <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-400/20 bg-emerald-50 dark:bg-emerald-900/20 p-5">
          <h4 className="text-emerald-700 dark:text-emerald-300 font-semibold mb-3">
            {t.pros}
          </h4>
          <ul className="list-disc list-inside space-y-1 text-neutral-dark dark:text-dark-neutral-dark">
            {p.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {c.length > 0 && (
        <div className="rounded-xl border border-rose-200/60 dark:border-rose-400/20 bg-rose-50 dark:bg-rose-900/20 p-5">
          <h4 className="text-rose-700 dark:text-rose-300 font-semibold mb-3">
            {t.cons}
          </h4>
          <ul className="list-disc list-inside space-y-1 text-neutral-dark dark:text-dark-neutral-dark">
            {c.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}