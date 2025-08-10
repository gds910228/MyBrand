"use client";

import React from "react";
import Link from "next/link";

type Props = {
  website?: string;
  pricing?: string;
  locale?: "en" | "zh";
};

const labels = {
  en: { title: "Tool Info", website: "Website", pricing: "Pricing" },
  zh: { title: "工具信息", website: "官网", pricing: "定价" },
};

export default function ToolInfoBox({ website, pricing, locale = "en" }: Props) {
  if (!website && !pricing) return null;
  const t = labels[locale];

  return (
    <div className="my-8 rounded-xl border border-neutral-light dark:border-dark-neutral-light bg-white dark:bg-dark-bg-secondary p-5 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-neutral-darker dark:text-dark-neutral-darker">
        {t.title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {website && (
          <div>
            <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium mb-1">
              {t.website}
            </div>
            <Link
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-dark-primary break-all hover:underline"
            >
              {website}
            </Link>
          </div>
        )}

        {pricing && (
          <div>
            <div className="text-sm text-neutral-medium dark:text-dark-neutral-medium mb-1">
              {t.pricing}
            </div>
            <div className="text-neutral-dark dark:text-dark-neutral-dark">
              {pricing}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}