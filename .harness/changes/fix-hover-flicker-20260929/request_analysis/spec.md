# 缺陷修复：悬停时元素高频抖动/闪烁（hover 自激振荡）

- **变更目录**：`.harness/changes/fix-hover-flicker-20260929/`
- **类型**：fix
- **触发**：用户报告「启动项目进入站点，适配有问题，鼠标指向每一处，都在猛地闪跳」
- **性质**：⚠️ **既有缺陷**（不是 feat-search-discovery 引入的）
- **状态**：✅ 已修复并验证

---

## 一、结论先行

| 项 | 结论 |
|---|---|
| 现象 | 鼠标停在卡片/标签**下边缘**时，元素以约 5–8Hz 疯狂上下跳，画面 5–19% 像素持续剧烈变化 |
| 根因 | **悬停时让元素自身位移**（`whileHover={{ y: -N }}` / `transform: translateY(-N)`），而该元素**同时就是悬停命中区** → 自激振荡 |
| 是否本次搜索改造引入 | **否**。`Hero.tsx` / `BlogCard.tsx` / `globals.css` 与用户提供的原始 zip **逐字节相同**（见 §三 证据） |
| 修复 | 让「静止的外层」承担命中判定，位移交给内层；CSS 类去掉位移 |
| 验证 | 三个复现点全部由 **2/4 振荡 → 0/4 振荡**；视觉位移效果保留（截图对比） |

---

## 二、根因说明（自激回路）

```
指针位于元素下边缘 N px 内
      ↓
: hover 命中 → 元素上移 N px
      ↓
元素的命中区随之上移 → 指针落到元素**之外**
      ↓
: hover 失效 → 元素复位到原位
      ↓
指针重新落在元素内 → hover 命中 → 上移 …… （无限循环）
```

因为位移由过渡动画驱动（150–300ms），循环频率约 5–8Hz，表现为**高频抖动/闪烁**，
而不是一次性动画。这与「鼠标指向每一处都在闪」的观感完全吻合：
凡是带「悬停上移」的元素，只要指针掠过其下边缘就会触发。

> 只有当位移方向会让**元素脱离指针**时才会发生。`hover:scale(>1)` 不会——
> 放大只会让命中区变大，指针始终留在元素内。这也是为什么同为卡片的
> `ProjectCard`（只有 scale、无上移）测得 **0/4 稳定**。

---

## 三、受影响范围与「非本次引入」的证据

### 3.1 受影响清单（修复前实测）

| 组件 | 写法 | 幅度 | 帧间像素变化 | 探测结果 |
|---|---|---|---|---|
| `src/components/Hero.tsx` 英雄卡 | `whileHover={{ y: -12 }}` | ≈10px | **9–19%** | **2/4 振荡** |
| `src/components/BlogCard.tsx:61` | `whileHover={{ y: -8, scale: 1.01 }}` | ≈8px | 5–6.6% | **2/4 振荡** |
| `src/styles/globals.css` `.neon-hover` | `transform: translateY(-3px)` | 3px | 0.3% | **2/4 振荡** |
| `src/components/ProjectCard.tsx` | 仅 `scale` | — | 0% | 0/4 稳定 ✓ |

### 3.2 非本次引入的证据

```bash
# 与用户提供的原始附件逐字节比对
$ diff -q /tmp/origcheck/MyBrand/src/components/Hero.tsx      src/components/Hero.tsx      → 无差异
$ diff -q /tmp/origcheck/MyBrand/src/components/BlogCard.tsx  src/components/BlogCard.tsx  → 无差异
$ diff -q /tmp/origcheck/MyBrand/src/styles/globals.css       src/styles/globals.css       → 无差异
```

搜索改造（feat-search-discovery-20260928）的全部改动文件清单见该变更的 `summary.md` §3，
**不包含**上述三个文件；`layout.tsx` / `tailwind.config.js` 亦未改动。

---

## 四、修复方案

**原则：让「悬停命中区」静止，让位移发生在内层。**

### 4.1 BlogCard（`src/components/BlogCard.tsx`）
```diff
-    <motion.div
-      whileHover={{ y: -8, scale: 1.01 }}
-      className="group tech-card rounded-xl overflow-hidden h-full flex flex-col"
-    >
+    <motion.div
+      initial={{ opacity: 0, y: 20 }}
+      whileInView={{ opacity: 1, y: 0 }}
+      viewport={{ once: true }}
+      transition={{ duration: transitions.smooth.duration / 1000, ease: easing.easeOut }}
+      className="group h-full"
+    >
+      <div className="tech-card rounded-xl overflow-hidden h-full flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.01]">
```
- 外层 `motion.div` 只保留入场动画，**不再位移** → 命中区固定
- 视觉整体（含 `.tech-card` 背景/边框）在内层，位移量 `-translate-y-2` = **-8px，与原值一致**

### 4.2 Hero 英雄卡（`src/components/Hero.tsx`）
```diff
-          <motion.div
-            className="... tech-card mb-8 lg:mb-0 group"
-            whileHover={{ y: -12, transition: { duration: transitions.fast.duration / 1000 } }}
-          >
+          <motion.div
+            className="... mb-8 lg:mb-0 group"        ← 外层静止，承担命中判定
+          >
+            <div className="absolute inset-0 tech-card transition-transform duration-150 ease-out group-hover:-translate-y-3">
```
- `-translate-y-3` = **-12px**，`duration-150` 对应原 `transitions.fast.duration = 150ms`
- 原有的 `absolute inset-0` 子元素（渐变覆盖层、`Image fill`、角标）均以新的内层为定位父级，**定位关系不变**

### 4.3 `.neon-hover`（`src/styles/globals.css`）
```diff
   .neon-hover:hover {
     box-shadow: 0 0 0 1px rgba(56,189,248,0.4), 0 4px 20px rgba(168,85,247,0.3), 0 0 40px rgba(56,189,248,0.15);
-    transform: translateY(-3px);
   }
```
- 该类用于标签丸、博客列表行、错误页按钮等。**移除位移，保留霓虹辉光**作为悬停反馈。
- 不移除的原因：它是全局工具类，给其中某个元素单独加静止外层需要改多处调用点；
  而这类元素以「发光」为主要反馈，去掉 3px 位移的视觉损失最小、风险最低。

---

## 五、验证证据

### 5.1 修复前后对比（同一仪器：`repro7.mjs`，逐帧像素比对 + 元素 top 值追踪）

| 探测点 | 修复前 | 修复后 |
|---|---|---|
| Hero 中心 | 稳定 | 稳定 |
| Hero 下边缘-1 | ★ 振荡，top ∈ {219.7,225.5,221.4,217.5,…} 11 种取值 | ✅ 稳定，top 恒为 **213.5** |
| Hero 下边缘-3 | ★ 振荡，帧差 9.4–19.3% | ✅ 稳定，帧差 ≤1.15% |
| BlogCard 下边缘-1 | ★ 振荡，top ∈ {199.6,201,199.7,…} 13 种取值 | ✅ 稳定，top 恒为 **190.7**，帧差 **0.00%** |
| BlogCard 下边缘-3 | ★ 振荡，帧差 5.7–6.6% | ✅ 稳定 |
| `.neon-hover` 下边缘 | ★ 振荡，top ∈ {434.5,432.3,435,432.1,…} | ✅ 稳定，top 恒为 **435** |
| ProjectCard（对照） | 0/4 稳定 | 0/4 稳定（未改动） |

**判定统计**：

| 组件 | 修复前 | 修复后 |
|---|---|---|
| Hero `.tech-card` | 2/4 振荡 | **0/4** |
| BlogCard `.tech-card` | 2/4 振荡 | **0/4** |
| `.neon-hover` 标签丸 | 2/4 振荡 | **0/4** |

### 5.2 视觉未回归（截图比对）

| 截图 | 说明 |
|---|---|
| `/tmp/browsercheck/home.png` | 首页静止态：Hero 卡片、角标、LIVE 徽标、渐变标题、按钮、统计栏全部正常 |
| `/tmp/browsercheck/home-hover.png` | 首页悬停态：卡片**仍然上移**（top 332 → 320）并放大，角标高亮 —— **原设计效果完整保留** |
| `/tmp/browsercheck/blog.png` | 博客列表：标签丸、排序/视图控件、标签搜索框布局正常 |

### 5.3 回归门禁

| 门禁 | 结果 |
|---|---|
| `npx tsc --noEmit` | ✅ 无输出 |
| scoped ESLint（改动文件） | ✅ 无新增 error（`Hero.tsx:152` 为既有遗留，位置/规则与改动前一致） |
| 全量 `npm run lint` | ✅ 报错文件清单与改动前**逐项一致**（13 个，均为未触碰的既有文件） |
| `npm test` | ✅ **22 文件 / 313 用例全绿** |
| `npm run build` | ✅ `BUILD_EXIT=0` |
| 搜索验收矩阵 S1–S24 | ✅ **23/23 通过**（无回归） |

---

## 六、遗留与建议

| # | 项 | 说明 |
|---|---|---|
| L-1 | 其他「悬停位移」写法 | 本次按**实测**修复了 3 处振荡点。`CaseStudyCTA` / `ServiceCard` 有 `hover:translate-x-*`（2–4px 水平位移），理论上在**左边缘**也可能自激；实测未复现（元素较宽、位移极小）。如需彻底杜绝，建议统一约定：**悬停位移一律由静止外层承担命中判定**。 |
| L-2 | `.tech-card:hover::before/after` 角标 | `.tech-card` 现在位于会位移的内层。指针落在位移后的 N px 缝隙时，CSS `:hover` 为 false 而外层命中为 true，角标会淡出（**稳定，不再振荡**）。属极小的视觉不一致，未处理。 |
| L-3 | 建议补充 ESLint 规则 | 目前无法静态拦截「元素自身悬停位移」这一模式。可考虑在评审清单中加入该检查项（本次已写入 `coding/` 报告）。 |
