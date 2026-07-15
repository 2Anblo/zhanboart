# zhanbo.art 设计方案

## 1. 项目定位

`zhanbo.art` 是一个私人化博客项目，不承担官方工作主页、技术履历或项目展示的职责。它更像一个个人精神空间：记录生活、感受、照片、阅读、音乐、梦境、观察和一些难以归类的私人片段。

当前官方工作博客可以保持清晰、可靠、专业，服务于技术输出和职业身份；`zhanbo.art` 则应该有更强的情绪、画面和氛围。访问者不需要被正式介绍你是谁，而是通过你留下的文字、图片、音乐痕迹和页面气质，慢慢接近你。

核心表达：

> A quiet personal archive for fragments, light, night, music, and memory.

中文表达可以更收敛：

> 一些不需要被总结的东西。

## 2. 整体设计原则

这个站点不做传统个人主页，不做隆重的自我介绍，不做大段职业叙事，也不把技术能力作为第一视觉信号。

设计重点是三件事：

1. 内容像私人记录，而不是发布平台。
2. 前端视觉有明确情绪，但不压过阅读。
3. 深色模式和浅色模式不是同一套 UI 的反色，而是两种完全不同的精神场景。

深色模式是夜晚、房间、独处、沉思。

浅色模式是阳光、梦、神圣感、漂浮的清醒。

站点应该有视觉记忆点，但避免变成炫技作品集。动画要慢，光影要克制，交互要自然，文字始终是主体。

## 3. 信息架构

目录结构维持简单，第一版不需要复杂 CMS。

```text
/
/journal
/journal/[slug]
/notes
/photos
/archive
/now
/about
```

页面职责：

- `/`：最近内容和当前状态，不做传统 Hero。
- `/journal`：长文列表，适合生活记录、阶段总结、旅行、私人观察。
- `/journal/[slug]`：长文详情，强调阅读体验。
- `/notes`：短记录，承载片段、句子、灵感、摘录。
- `/photos`：照片记录，可按时间、地点或情绪组织。
- `/archive`：所有公开内容的时间归档。
- `/now`：最近在做什么、读什么、听什么、想什么。
- `/about`：极短说明，不写成简历。

内容目录建议：

```text
content/
  journal/
  notes/
  photos/
  now.md
public/
  images/
    journal/
    photos/
```

## 4. 内容模型

私人站点需要比技术博客更细腻的元数据。不要只记录标题、日期和标签，也可以记录地点、心情、光线、音乐。

长文 frontmatter：

```yaml
---
title: "某个下午"
date: "2026-07-15"
type: "journal"
mood: "quiet"
scene: "night-room"
location: "Shanghai"
tags: ["life", "walk", "memory"]
cover: "/images/journal/example.jpg"
visibility: "public"
---
```

短记录 frontmatter：

```yaml
---
date: "2026-07-15"
type: "note"
mood: "soft"
visibility: "public"
---
```

照片 frontmatter：

```yaml
---
title: "Light on the wall"
date: "2026-07-15"
type: "photo"
location: "Shanghai"
mood: "bright"
image: "/images/photos/light-on-wall.jpg"
visibility: "public"
---
```

`visibility` 建议保留三种状态：

```ts
type Visibility = "public" | "unlisted" | "draft";
```

- `public`：公开展示，进入 sitemap。
- `unlisted`：可访问，但不出现在列表和 sitemap。
- `draft`：只在本地开发环境显示。

## 5. 首页设计

首页不应该像工作博客那样从“我是谁”开始。它应该像打开一个房间，或走进一个梦。

首页结构：

```text
Header
Scene Layer
Recent Journal
Recent Notes
Recent Photos
Now Fragment
Footer
```

第一屏建议只保留：

- 左上角或顶部中央的 `zhanbo.art`
- 极简导航
- 一句短句
- 最近一条内容或当前状态
- 场景化背景

示例文案：

```text
things kept before they disappear
```

或：

```text
一些不需要被总结的东西
```

首页不要堆很多卡片。内容可以像时间里的片段：一篇文章、一张照片、几条短 note，以不完全对齐的方式出现，但移动端必须保持清晰线性阅读。

## 6. 深色模式场景：寂静深夜的房间

深色模式不是普通 dark theme，而是一个具体场景：深夜，一个人在房间里沉思。

关键词：

- 深夜
- 房间
- 孤独但不压抑
- 静止空气
- 显示器或窗外微光
- Frank Ocean 式的私密、潮湿、低饱和情绪

视觉方向：

- 背景接近黑色，但不是纯黑。
- 主色可以是墨蓝、暖黑、低饱和紫灰、暗酒红的少量点缀。
- 页面边缘有极轻的暗角。
- 背景可以有非常慢的光影漂移，像窗帘后的城市光。
- 鼠标移动时可以产生细微光晕，但不能像游戏特效。
- 文字颜色不要过白，使用柔和灰白。

建议色彩：

```css
--night-bg: #090A0D;
--night-surface: #111217;
--night-text: #E6E1D8;
--night-muted: #8D8792;
--night-blue: #25324A;
--night-violet: #3B3147;
--night-wine: #4A2633;
--night-glow: rgba(177, 188, 216, 0.18);
```

可实现的视觉组件：

- `NightRoomScene`：深色模式背景层。
- 缓慢移动的窗格光影。
- 极弱颗粒噪声。
- 页面底部或边缘有类似房间阴影的渐变。
- 文章页顶部可以出现一小块“窗外光”区域，不使用大 Hero。

注意事项：

- 不要做赛博朋克。
- 不要用高饱和霓虹。
- 不要把 Frank Ocean 做成直白引用或粉丝站符号。
- 音乐影响应该体现在节奏、留白、颜色和情绪，而不是贴满专辑元素。

## 7. 浅色模式场景：阳光明媚的梦

浅色模式不是普通 light theme，而是有一点神圣感的白日梦。它应该明亮、轻、漂浮、柔和，像阳光穿过薄窗帘，或一个醒来后仍残留的梦。

关键词：

- 阳光
- 梦
- 神圣感
- 空气感
- 白色、金色、淡蓝
- 柔和但不甜腻

视觉方向：

- 背景接近暖白，而不是纯白。
- 大面积留白，内容像漂浮在光里。
- 可以有很轻的金色光束、柔焦边缘、纸张质感。
- 文字使用深灰，不使用纯黑。
- 交互状态像光线变化，而不是按钮变色。

建议色彩：

```css
--day-bg: #FBF7EC;
--day-surface: #FFFDF6;
--day-text: #2A2926;
--day-muted: #7D7568;
--day-gold: #D8B15E;
--day-blue: #B8D7E8;
--day-rose: #E9C8B7;
--day-glow: rgba(255, 218, 142, 0.36);
```

可实现的视觉组件：

- `DaydreamScene`：浅色模式背景层。
- 缓慢移动的柔和光束。
- 轻微漂浮的 dust particles。
- 文章列表 hover 时产生很淡的金色照亮。
- 图片页可以使用更大的留白和轻微错位排布。

注意事项：

- 不要做奶油风模板。
- 不要全站米色卡片化。
- 神圣感来自光、比例和安静，不来自宗教符号堆叠。
- 保持私人、清醒、克制。

## 8. Frank Ocean 影响方式

这个站点可以受 Frank Ocean 影响，但不应该变成 Frank Ocean fan site。

可以借鉴：

- 留白和未说尽的感觉。
- 私密叙事，而不是完整解释。
- 夜晚、车窗、房间、海边、梦、记忆这些意象。
- 低饱和色彩和突然出现的温暖光。
- 内容之间保留断裂感，让片段自己成立。

不建议：

- 大量直接引用歌词。
- 使用专辑封面作为设计核心。
- 把页面做成音乐播放器或粉丝档案。
- 使用过于直白的橙色/绿色视觉符号。

可以在 `/now` 或首页状态里保留一个轻量模块：

```text
listening: Frank Ocean - Self Control
```

这个模块应该像私人状态，而不是展示徽章。

## 9. 组件设计

核心组件建议：

```text
src/components/site/Header.tsx
src/components/site/Footer.tsx
src/components/scene/SceneProvider.tsx
src/components/scene/NightRoomScene.tsx
src/components/scene/DaydreamScene.tsx
src/components/content/JournalList.tsx
src/components/content/NoteStream.tsx
src/components/content/PhotoGrid.tsx
src/components/content/ArchiveTimeline.tsx
src/components/content/NowPanel.tsx
src/components/markdown/MarkdownRenderer.tsx
```

场景层设计：

- 根据当前 theme 渲染不同 scene。
- scene 是背景，不参与内容布局。
- scene 必须支持 `prefers-reduced-motion`。
- scene 首屏加载不能阻塞文章内容。
- 移动端减少粒子数量和动画复杂度。

```tsx
<SceneProvider>
  {theme === "dark" ? <NightRoomScene /> : <DaydreamScene />}
  <main>{children}</main>
</SceneProvider>
```

## 10. 文章页设计

文章页必须优先保证阅读。

建议布局：

- 最大正文宽度：`680px - 760px`
- 行高：中文 `1.85` 左右
- 段落间距足够
- 标题不要过大
- 图片允许突破正文宽度，但不要影响移动端
- 文章元信息轻量展示：日期、地点、心情、阅读时间

文章页顶部示例：

```text
2026.07.15 / Shanghai / quiet

某个下午

正文开始……
```

不要在每篇文章顶部放巨大封面。私人博客的文章更像翻开一页记录，而不是发布一篇媒体文章。

## 11. Notes 设计

`Notes` 是私人站点区别于技术博客的重要部分。

它可以承载：

- 一句话
- 一段摘录
- 半成型想法
- 当天状态
- 音乐记录
- 照片旁白

桌面端可以做轻微错落，但不要变成瀑布流噪音。移动端使用时间顺序单列。

每条 note 可以显示：

```text
Jul 15, 2026
半夜听 Self Control，突然觉得有些东西不应该被解释完。
```

## 12. Photos 设计

照片页不追求社交媒体式瀑布流，而应该像私人相册。

建议：

- 图片有足够留白。
- 鼠标 hover 显示日期、地点、短 caption。
- 点击进入单张照片详情页可选，第一版可以不做。
- 图片不加厚重阴影。
- 深色模式下图片像在房间里被屏幕照亮。
- 浅色模式下图片像放在阳光下的纸面。

## 13. Archive 设计

归档页是时间感的核心。

不要做普通文章列表。可以做成按年份分组的时间线：

```text
2026
  Jul 15    Journal    某个下午
  Jul 12    Note       一句话
  Jun 28    Photo      Light on the wall
```

视觉上可以像一条安静的时间河流。深色模式更像夜晚回看记忆，浅色模式更像阳光下整理旧纸张。

## 14. 技术架构

可以沿用当前工作博客的技术基础：

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Markdown + gray-matter
- react-markdown
- remark-gfm
- next-themes
- Vercel
- 静态导出优先

可以复用：

- Markdown 读取逻辑
- sitemap / robots 思路
- ThemeProvider
- MarkdownRenderer
- 基础 UI primitive
- 图片资源管理

建议重写：

- 首页
- Header / Footer
- 内容模型
- 列表页
- 视觉系统
- About
- Archive

暂不建议第一版加入：

- 复杂后台
- 评论系统
- 登录系统
- 过度复杂的音乐播放器
- 大量 WebGL 交互

## 15. 性能与可访问性

视觉效果不能牺牲阅读和性能。

要求：

- 首屏文字不能等待 WebGL 加载。
- 动画背景必须可降级为 CSS 背景。
- 支持 `prefers-reduced-motion`。
- 移动端降低粒子、模糊和阴影成本。
- 所有图片设置明确尺寸或 aspect-ratio。
- 深色和浅色模式都要满足基本对比度。
- 页面不应因为字体加载产生明显布局跳动。

## 16. MVP 实施顺序

第一阶段：内容与结构

1. 初始化 `zhanbo.art` 项目。
2. 迁移当前项目的基础 Next.js、Tailwind、Markdown 能力。
3. 建立 `journal / notes / photos / archive / now / about` 路由。
4. 实现内容读取和基础列表。
5. 完成文章页阅读样式。

第二阶段：主题与氛围

1. 实现深色 `NightRoomScene`。
2. 实现浅色 `DaydreamScene`。
3. 设计两套 CSS token。
4. 优化首页最近内容布局。
5. 加入低成本动效和 reduced-motion 降级。

第三阶段：私人化细节

1. 增加 `mood / location / listening` 元数据。
2. 做 `/now` 页面。
3. 做照片页 hover 和轻量相册体验。
4. 做 Archive 时间线。
5. 加 RSS 和 sitemap。

## 17. 最终目标

`zhanbo.art` 应该像一个可以长期居住的地方，而不是一次性做完的作品。

它不需要解释你是谁，也不需要证明你会什么。它只需要持续留下东西：夜晚的想法、白天的梦、照片里的光、音乐留下的余温，以及那些暂时还没有名字的私人经验。
