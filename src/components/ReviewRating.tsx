"use client";

import React from "react";

type Props = {
  overall?: number;
  easeOfUse?: number;
  features?: number;
  locale?: "en" | "zh";
};

const labels = {
  en: {
    title: "Ratings",
    overall: "Overall",
    ease: "Ease of Use",
    features: "Features",
  },
  zh: {
    title: "评分",
    overall: "综合评分",
    ease: "易用性",
    features: "功能强度",
  },
};

function clampTo5(n?: number) {
  if (typeof n !== "number" || isNaN(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function StarBar({ value }: { value: number }) {
  const v = clampTo5(value);
  return (
    <div className="relative h-2 w-full rounded bg-neutral-light dark:bg-dark-neutral-light overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full bg-primary dark:bg-dark-primary"
        style={{ width: `${(v / 5) * 100}%` }}
      />
    </div>
  );
}

export default function ReviewRating({
  overall = 0,
  easeOfUse = 0,
  features = 0,
  locale = "en",
}: Props) {
  const t = labels[locale];
  const hasAny =
    clampTo5(overall) > 0 ||
    clampTo5(easeOfUse) > 0 ||
    clampTo5(features) > 0;

  if (!hasAny) return null;

  return (
    <div className="my-8 rounded-xl border border-neutral-light dark:border-dark-neutral-light bg-white dark:bg-dark-bg-secondary p-5 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-neutral-darker dark:text-dark-neutral-darker">
        {t.title}
      </h3>

      {clampTo5(overall) > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-dark dark:text-dark-neutral-dark">
              {t.overall}
            </span>
            <span className="text-sm font-medium text-neutral-darker dark:text-dark-neutral-darker">
              {clampTo5(overall).toFixed(1)}/5
            </span>
          </div>
          <StarBar value={overall} />
        </div>
      )}

      {clampTo5(easeOfUse) > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-dark dark:text-dark-neutral-dark">
              {t.ease}
            </span>
            <span className="text-sm font-medium text-neutral-darker dark:text-dark-neutral-darker">
              {clampTo5(easeOfUse).toFixed(1)}/5
            </span>
          </div>
          <StarBar value={easeOfUse} />
        </div>
      )}

      {clampTo5(features) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-dark dark:text-dark-neutral-dark">
              {t.features}
            </span>
            <span className="text-sm font-medium text-neutral-darker dark:text-dark-neutral-darker">
              {clampTo5(features).toFixed(1)}/5
            </span>
          </div>
          <StarBar value={features} />
        </div>
      )}
    </div>
  );
}