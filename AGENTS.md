# AGENTS.md — zhanbo.art

> 一个私人博客。碎片、光线、记忆。

## 项目定位

`zhanbo.art` 不是工作主页，不是技术履历，也不是项目展示。它是一个私人精神空间：记录生活、感受、照片、阅读、音乐、梦境、观察和一些难以归类的私人片段。

核心表达：**一些不需要被总结的东西。**

## 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 16 App Router | 框架，静态导出 (`output: "export"`) |
| React 19 + TypeScript 5.9 | UI + 类型系统 |
| Tailwind CSS 3.4 | 样式系统 |
| GSAP + ScrollTrigger | 动画引擎 |
| Lenis | 平滑滚动 |
| Three.js | 3D 粒子雕塑背景 |
| gray-matter + react-markdown + remark-gfm | Markdown 内容处理 |

## 目录结构

```
app/                    # Next.js App Router 路由
  page.tsx              # 首页（组装各 Section）
  layout.tsx            # 根布局（极简，无 Provider 堆叠）
  journal/              # 日志列表 + 详情
  notes/                # 笔记列表 + 详情
  photos/               # 照片列表 + 详情
  archive/              # 时间归档
  robots.ts / sitemap.ts # SEO

src/
  components/           # 复用组件
    HomeExperience.tsx  # 首页体验组装
    ContentDetailPage.tsx
    ContentListPage.tsx
    ContentNav.tsx
    EntryList.tsx
    FullScreenMenu.tsx
    Navigation.tsx
    markdown/MarkdownRenderer.tsx
  sections/             # 首页各区块
    HeroRoomGallery.tsx      # 3D CSS 房间画廊
    ParticleSculpture.tsx    # Three.js 粒子 + 文字
    LighthouseVideo.tsx      # 视频 + 液态玻璃面板
    ImageGallery.tsx         # 3×3 照片网格 + Lightbox
    WavesVideo.tsx           # 视频 + 排版叠加
    FooterTicker.tsx         # 链接 + 终端滚动文字
  hooks/
    useLenis.ts         # 平滑滚动 Hook
  lib/
    content.ts          # Markdown 内容读取逻辑
  config.ts             # 全站内容配置（所有文案、图片路径）
  index.css             # 全局样式 + Tailwind

content/                # Markdown 内容源
  journal/              # 长文
  notes/                # 短记录
  photos/               # 照片

public/                 # 静态资源
  images/
    rooms/              # 房间画廊图片（4 个房间 × 3 面墙）
    gallery/            # 照片网格图片（9 张）
  videos/               # 背景视频
```

## 关键架构决策

### 配置驱动

所有内容集中在 `src/config.ts`。组件只导入自己的配置子集。修改内容不需要触碰组件代码。

### Ref 优先的动画状态

Room Gallery 的动画状态（当前房间、是否移动中）使用 `useRef` 而非 `useState`，避免 60fps 鼠标追踪和复杂多阶段过渡时触发 React 重渲染。

### 可见性门控渲染

Three.js Canvas、终端 Ticker 等性能敏感组件使用 `IntersectionObserver`，离屏时暂停渲染，减少 GPU/CPU 浪费。

### 静态导出

`next.config.ts` 设置 `output: "export"`，无后端，无 API 调用，纯静态站点。

## 内容模型

Markdown frontmatter 支持的字段：

```yaml
---
title: "标题"
date: "2026-07-15"
type: "journal"    # journal | notes | photos
mood: "quiet"
location: "Shanghai"
tags: ["life", "memory"]
image: "/images/photos/example.jpg"
caption: "图片描述"
visibility: "public"   # public | unlisted | draft
---
```

- `public`：公开展示，进入 sitemap
- `unlisted`：可访问，但不出现在列表和 sitemap
- `draft`：仅本地开发环境显示

内容读取逻辑在 `src/lib/content.ts`，支持按类型过滤、排序、搜索。

## 设计原则

1. **内容像私人记录，而不是发布平台。**
2. **前端视觉有明确情绪，但不压过阅读。**
3. **深色模式和浅色模式是两种完全不同的精神场景。**

- 深色 = 深夜、房间、独处、沉思（Frank Ocean 式的私密、低饱和）
- 浅色 = 阳光、梦、神圣感、漂浮的清醒

### 设计禁忌

- 不要做赛博朋克、高饱和霓虹
- 不要把 Frank Ocean 做成直白引用或粉丝站
- 不要做奶油风模板、全站米色卡片化
- 不要加复杂后台、评论系统、登录系统
- 不要每篇文章顶部放大封面

## 性能与可访问性

- 首屏文字不能等待 WebGL 加载
- 动画背景必须可降级为 CSS 背景
- 支持 `prefers-reduced-motion`
- 移动端降低粒子、模糊和阴影成本
- 所有图片设置明确尺寸或 aspect-ratio
- 深色和浅色模式都要满足基本对比度
- Room 图片 `loading="eager"`，Gallery 图片 `loading="lazy"`

## Git 工作流

### 仓库根目录确认

**每次执行任何 git 操作前，必须先确认当前工作目录是仓库根目录（即 `D:\workspace\zhanboart\`，包含 `.git/` 的目录）。**

确认方式：
- 执行 `git rev-parse --show-toplevel` 检查输出是否为仓库根路径
- 或检查当前目录是否存在 `.git/` 子目录
- 如果不在根目录，先 `cd` 到根目录再执行 git 命令

### 每次修改必须 commit + push

**每次完成任何文件修改后，必须立即 commit 并 push 到远程仓库。**

标准流程：
```bash
# 1. 确认在仓库根目录
git rev-parse --show-toplevel

# 2. 查看修改
git status

# 3. 运行 lint 和 build 验证（必须通过后才能提交）
npm run lint
npm run build

# 4. 添加修改
git add .

# 5. 提交（使用清晰的提交信息，描述本次修改内容）
git commit -m "<descriptive message>"

# 6. 推送
git push
```

提交信息规范：
- 使用简洁的英文或中文描述本次修改
- 例如：`Add AGENTS.md with project guidelines`、`Update hero room config`、`Fix navigation animation`
- 禁止使用模糊信息如 `update`、`fix stuff`、`wip`

### 禁止

- 禁止在非根目录执行 git 命令
- 禁止积累多次修改后一次性提交
- 禁止只 commit 不 push（除非用户明确要求不推送）
- **禁止在 `npm run lint` 或 `npm run build` 报错时提交并 push 代码**

## 开发命令

```bash
npm install
npm run dev      # 开发
npm run build    # 静态构建（输出到 out/）
npm run lint     # ESLint
```

## 修改指南

### 修改文案 / 图片路径

编辑 `src/config.ts` 对应配置对象即可，无需改组件。

### 添加新文章

在 `content/journal/`、`content/notes/` 或 `content/photos/` 下新建 `.md` 文件，按内容模型填写 frontmatter。

### 修改路由 / 页面结构

编辑 `app/` 下的对应 `page.tsx`。详情页模板在 `src/components/ContentDetailPage.tsx`。

### 修改动画

- GSAP 动画：在对应 `src/sections/*.tsx` 中找 `gsap.fromTo` 或 `ScrollTrigger.create`
- Three.js：在 `ParticleSculpture.tsx` 中，注意清理几何体/材质避免内存泄漏
- Ticker：在 `FooterTicker.tsx` 中，注意 `requestAnimationFrame` 生命周期

### 修改样式

优先使用 Tailwind utility class。全局变量和自定义动画在 `src/index.css`。

## 依赖注意

- `three` 版本锁定在 `^0.183.2`，升级需验证 GLSL shader 兼容性
- `gsap` 使用 `ScrollTrigger` 插件，需在模块中 `gsap.registerPlugin(ScrollTrigger)`
- `lenis` 与 GSAP ticker 同步，见 `useLenis.ts`
