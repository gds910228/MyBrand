"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ViewType = "grid" | "list";

export default function BlogViewManager({ currentView }: { currentView?: ViewType }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sp = new URLSearchParams(searchParams?.toString() || "");

    // 如果 URL 已有 view 参数，则写入本地存储后退出
    if (currentView === "grid" || currentView === "list") {
      try {
        localStorage.setItem("blog:view", currentView);
      } catch {}
      return;
    }

    // 无 view 参数：优先从本地存储读取，否则按屏幕宽度选择默认
    let saved: ViewType | null = null;
    try {
      const v = localStorage.getItem("blog:view");
      if (v === "grid" || v === "list") saved = v;
    } catch {}

    const nextView: ViewType = saved ?? (window.innerWidth < 768 ? "list" : "grid");

    if (!sp.get("view")) {
      sp.set("view", nextView);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [currentView, pathname, router, searchParams]);

  return null;
}