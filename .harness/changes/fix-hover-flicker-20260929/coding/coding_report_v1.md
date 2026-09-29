# 编码报告：悬停自激振荡修复

- **变更**：fix-hover-flicker-20260929
- **类型**：fix（缺陷修复）
- **对应 spec**：`request_analysis/spec.md`

---

## 1. 改动文件清单

> 仓库无 `.git`，按既有做法以改动文件清单等价替代提交记录。

### 修改（3 个，均为既有文件；无新增文件）

| 文件 | 变更 |
|---|---|
| `src/components/Hero.tsx` | 英雄卡：`whileHover={{ y: -12 }}` 从「卡片自身」移到「静止外层 + 内层 CSS 位移」 |
| `src/components/BlogCard.tsx` | 博客卡：`whileHover={{ y: -8, scale: 1.01 }}` 改为同样的外层静止 / 内层位移结构 |
| `src/styles/globals.css` | `.neon-hover:hover` 移除 `transform: translateY(-3px)`，保留霓虹辉光 |

**未改动**：`layout.tsx`、`tailwind.config.js`、`package.json`、`ProjectCard.tsx`（实测无振荡）、搜索相关全部文件。

---

## 2. 关键取舍（决策记录）

| ID | 待决议项 | 候选方案 | 采纳 | 依据 |
|---|---|---|---|---|
| F-01 | 如何消除振荡 | (a) 去掉悬停位移；(b) 静止外层 + 内层位移；(c) 给命中区加透明补偿内边距 | **(b)** | (a) 丢失设计意图；(c) 会改变元素视觉高度（`overflow-hidden` 下补偿需靠 padding，视觉会变）。 (b) 完整保留位移量与观感，且从机制上根除振荡 |
| F-02 | `.neon-hover` 是否也做「外层+内层」改造 | (a) 改造全部调用点（标签丸/列表行/按钮约 10+ 处）；(b) 仅去掉位移保留辉光 | **(b)** | `.neon-hover` 是全局工具类，逐个加静止外层需改动十余处调用点、风险与收益不成比例；该类以「发光」为主要反馈，去掉 3px 位移的视觉损失最小 |
| F-03 | 是否顺带修 `hover:translate-x-*`（CaseStudyCTA/ServiceCard） | (a) 一并改；(b) 先验证 | **(b) 暂不改** | 按「用证据说话」原则：实测未复现振荡（元素宽、位移仅 2–4px），不顺手改需求外代码。已记入 spec 遗留项 L-1 |
| F-04 | 本次是否并入搜索变更目录 | (a) 并入 feat-search-discovery；(b) 单开变更目录 | **(b)** | Rules「需求外的代码不顺手改，要改单开变更」；且该缺陷与搜索改造无因果关系，混在一起会污染追溯 |

---

## 3. 实现要点

### 3.1 为什么是「外层静止」而不是「去掉动画」
自激回路的充要条件是：**命中区随位移一起移动**。
只要让「承担 `:hover` 判定的元素」不参与位移，无论位移多大都不会振荡。
因此修复保留了 `-8px` / `-12px` 的原始位移量，仅改变了「谁移动」。

### 3.2 为什么用 CSS `group-hover` 而非 framer-motion variants
- `group-hover:-translate-y-2` 的位移由 CSS 完成，与命中判定（外层 `:hover`）天然解耦；
- 若用 framer 的 `whileHover="hover"` + variants，需把入场动画（`whileInView`）与悬停变体
  合并在同一元素上，`initial` / `animate` / `whileInView` / variants 四者语义会相互干扰，
  风险更高；
- CSS 写法的位移时长可直接用 Tailwind 的 `duration-*` 精确对齐原值
  （Hero `duration-150` = 原 `transitions.fast.duration = 150ms`）。

### 3.3 定位关系不变
Hero 的内层是 `absolute inset-0`，因此其原有的 `absolute inset-0` 子元素
（渐变覆盖层、`Image fill`、四角装饰、LIVE 徽标）**定位父级仍是一个 positioned 元素**，
DOM 层级与定位行为无变化 —— 截图比对已确认视觉一致。

---

## 4. 门禁证据

| 门禁 | 命令 | 结果 |
|---|---|---|
| 类型 | `npx tsc --noEmit` | ✅ 无输出 |
| ESLint（scoped） | `npx eslint src/components/Hero.tsx src/components/BlogCard.tsx` | ✅ 唯一报错 `Hero.tsx:152:94` 为**既有遗留**（位置/规则与改动前一致）。`globals.css` 不应传给 eslint（`next lint` 只处理 JS/TS），已排除误报 |
| ESLint（全量） | `npm run lint` | ✅ 报错文件清单与改动前**逐项一致**（13 个） |
| 测试 | `npm test` | ✅ 22 文件 / **313 用例全绿** |
| 构建 | `npm run build` | ✅ `BUILD_EXIT=0` |
| 搜索回归 | `run_acceptance.mjs` | ✅ **S1–S24 全通过（23/23）** |

---

## 5. 复现/验证工具

本次为定位该缺陷，在**项目之外**（`/tmp/browsercheck/`）搭建了浏览器自动化验证环境，
**未向项目 `package.json` 添加任何依赖**：

| 脚本 | 作用 |
|---|---|
| `repro.mjs` | 基础悬停探测（rect / scrollWidth 采样） |
| `repro2.mjs` | 指针下元素身份逐帧比对 |
| `repro3.mjs` | 逐帧像素比对（基线 vs 悬停） |
| `repro4.mjs` | 连续鼠标扫掠 + 像素差异热点定位 |
| `repro5.mjs` | 固定点时间序列（区分「一次性过渡」与「持续振荡」） |
| `repro6.mjs` | 多断点横向溢出检查（响应式适配） |
| **`repro7.mjs`** | **最终判定工具**：给定选择器，探测中心/上下边缘，直接追踪元素 top 值是否持续跳变 |

> 建议将 `repro7.mjs` 的思路（元素 top 值在静止悬停下必须收敛为单一取值）纳入
> 交互效果的验收清单 —— 这类缺陷用视觉检查很难稳定复现，但用该指标可 100% 判定。
