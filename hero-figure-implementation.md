# Hero Section 动态小男孩实现方案

## 需求描述
- Dark Mode（深色）：黑白勾勒的小男孩在书桌上戴着有线耳机写着东西，前倾坐姿
- Light Mode（浅色）：小男孩向后靠到椅背，依旧戴着有线耳机，休息姿态
- 和现有Hero设计风格统一，保持简洁不抢内容风头

---

## 方案一：**双SVG线稿 + CSS媒体查询切换**（最简单，性能最好）

### 思路：

1. 把小男孩的两个姿态分别导出为

   单色SVG

   （只有黑白线条）

   - 深色模式版本：坐姿前倾，握笔，有线耳机挂在头上
   - 浅色模式版本：向后靠在椅背，姿态放松，耳机依旧戴着

2. 把两个SVG都放到`.quiet-hero__scene`里，默认显示dark版本，通过`@media (prefers-color-scheme: light)`隐藏dark显示light

3. SVG放在房间背景图上方，用`mix-blend-mode`适配背景，加一点轻微浮动动画增加动态感

### 现有结构怎么改：

你现在的HTML结构已经很清晰，只需要加两行：

复制

```tsx
<div className="quiet-hero__scene" aria-hidden="true">
  <div className="quiet-hero__image quiet-hero__image--night" />
  <div className="quiet-hero__image quiet-hero__image--day" />
  {/* 新增：两个姿态的小男孩SVG */}
  <svg className="hero-figure hero-figure--dark" ...>{darkPath}</svg>
  <svg className="hero-figure hero-figure--light" ...>{lightPath}</svg>
  <div className="quiet-hero__window" />
  <div className="quiet-hero__grain" />
</div>
```

### CSS适配：

复制

```css
.hero-figure {
  position: absolute;
  /* 定位到你觉得舒适的位置，比如右下 */
  bottom: 12vh;
  right: 12vw;
  width: min(24rem, 38vw);
  height: auto;
  opacity: 0.65;
  z-index: 1;
  /* 轻微呼吸动画 */
  animation: figureFloat 8s ease-in-out infinite alternate;
}
/* dark模式下用白色线条 */
.hero-figure--dark path {
  stroke: rgba(230, 225, 216, 0.85);
  fill: transparent;
  stroke-width: 0.8;
}
/* light模式默认隐藏，切换显示，用深色线条 */
.hero-figure--light {
  display: none;
}
.hero-figure--light path {
  stroke: rgba(42, 41, 38, 0.75);
  fill: transparent;
  stroke-width: 0.8;
}

@media (prefers-color-scheme: light) {
  .hero-figure--dark {
    display: none;
  }
  .hero-figure--light {
    display: block;
  }
}

@keyframes figureFloat {
  from { transform: translate3d(0, 0, 0) rotate(-0.25deg); }
  to { transform: translate3d(0, -0.6rem, 0) rotate(0.25deg); }
}
```

### 优点：

✅ SVG体积极小（几KB）
✅ 完全CSS控制，响应式，不占JS资源
✅ 和你现有的明暗切换逻辑完全一致，不需要改主题JS
✅ 线条风格符合你"黑白勾勒"的需求

------

## 方案二：**单SVG + CSS形变动画**（进阶，一个SVG切换两种姿态）

如果你会用SVG形变，可以把两个姿势做在同一个SVG里，用CSS `transform` + SMIL动画或者CSS transition 切换姿态：

- 小男孩身体部分做`transform-origin: center bottom`
- dark模式：`rotate(-5deg) translateY(0)` 前倾
- light模式：`rotate(2deg) translateY(1.2rem)` 向后靠
- 颜色通过`stroke`属性直接改颜色

优点：只需要一个SVG，有过渡动画；缺点：对SVG形变要求高，两个姿态差异大的话不好做过渡。

------

## 方案三：**Canvas / Three.js 绘制**

如果想要更丰富的动态效果（比如笔在动，耳机线随风晃），可以用Canvas绘制，但对于Hero需求来说过度设计了，你现在只想先整改Hero，方案一是性价比最高的。

------

## 推荐步骤：

1. **找设计师画 / 自己用Figma导出**两个姿态的单色线稿SVG，确保是轮廓线条，关闭填充
2. 按照方案一把两个SVG插入到Hero组件中
3. 调整定位、透明度、透明度，让它和背景的房间图融合，不要抢文字风头
4. 加轻微浮动动画，让页面"活"起来就行，不需要太夸张

你的现有明暗切换是基于系统设置，如果你以后做手动主题切换按钮，只需要把媒体查询改成配合class切换就行，结构完全不用动。





 你有几种方式，我按"从快到慢"排列：

  方案 A：我直接用 SVG 代码画两个（推荐，最快）

  因为你要的是黑白线条勾勒、不抢风头的风格，简洁的几何线条完全够用——反而比精细插画更契合站点气质。我现在就可以给你画两个。

  方案 B：AI 生成后矢量化

  用 Midjourney / DALL·E 生成线稿，然后用 Vectorizer.ai 或 Illustrator 描边转
  SVG，再手动清理路径。但风格不可控，清理工作量大。

  方案 C：Figma / Illustrator 手画

  如果你会用，画两个轮廓导出 SVG。但需要你自己动手。

---
  我建议走方案 A，我直接给你写两个干净的线条 SVG。你要的话我现在就画，包含：

  - 深色版本：前倾坐姿，身体微弯，手臂前伸握笔，耳机在头上，坐在书桌前
  - 浅色版本：后靠椅背，身体放松后仰，手臂自然放着，耳机依旧戴着

  线条风格：单色 stroke、无填充、细线（1-1.5px）、极简轮廓。

  要我现在画吗？画完直接放到 public/images/hero/ 下，然后接入组件。
