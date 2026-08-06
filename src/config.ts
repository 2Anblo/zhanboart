// ============================================================
// zhanbo.art Site Configuration
// ============================================================

// --- Site ---

export interface SiteConfig {
  language: string
  brandName: string
}

export const siteConfig: SiteConfig = {
  language: "zh-CN",
  brandName: "zhanbo",
}

// --- Navigation ---

export interface NavigationConfig {
  menuLabel: string
  closeLabel: string
  fullscreenMenuLinks: { label: string; href: string }[]
  menuSideInfo: string[]
}

export const navigationConfig: NavigationConfig = {
  menuLabel: "菜单",
  closeLabel: "关闭",
  fullscreenMenuLinks: [
    { label: "首页", href: "/" },
    { label: "日志", href: "/journal" },
    { label: "笔记", href: "/notes" },
    { label: "照片", href: "/photos" },
    { label: "音乐", href: "/music" },
    { label: "想法", href: "/thoughts" },
    { label: "归档", href: "/archive" },
  ],
  menuSideInfo: [
    "ZHANBO.ART 2026",
    "碎片 · 光线 · 记忆",
    "上海 — 私人博客",
  ],
}

// --- Homepage Hero ---

export interface HeroConfig {
  line: string
  ariaLabel: string
  posterSrc: string
  posterSrcLight?: string
  videoSrc?: string
  videoSrcLight?: string
  objectPosition: string
}

export const heroConfig: HeroConfig = {
  line: "屏幕亮着，房间没有开灯。",
  ariaLabel: "夜晚房间中的私人片段",
  posterSrc: "/images/hero/night-window.jpg",
  objectPosition: "57% center",
}

// --- Homepage Memory Strip ---

export type MemoryFragment =
  | { kind: "image"; src: string; alt: string; className: string }
  | { kind: "text"; eyebrow: string; text: string; className: string }
  | { kind: "trace"; label: string; value: string; className: string }

export const memoryStripConfig: MemoryFragment[] = [
  { kind: "image", src: "/images/hero/night-window.jpg", alt: "雨夜窗外的灯光", className: "memory-fragment--image-a" },
  { kind: "text", eyebrow: "23:48 / ROOM", text: "有些夜晚只是坐着，也足够接近自己。", className: "memory-fragment--text-a" },
  { kind: "trace", label: "LISTENING", value: "SELF CONTROL / 00:41:12", className: "memory-fragment--trace-a" },
  { kind: "image", src: "/images/rooms/room1-back.jpg", alt: "桌上的灯与纸页", className: "memory-fragment--image-b" },
  { kind: "text", eyebrow: "MEMORY / 07.15", text: "光从窗帘的缝隙里，留下很慢的灰尘。", className: "memory-fragment--text-b" },
  { kind: "image", src: "/images/gallery/white-ferrari.png", alt: "夜色里的车与树影", className: "memory-fragment--image-c" },
]

// --- Particle Sculpture (Journal Section) ---

export interface ParticleConfig {
  sectionLabel: string
  title: string
  paragraphs: string[]
  quote: string
}

export const particleConfig: ParticleConfig = {
  sectionLabel: "01 / 日志",
  title: "一些不需要被总结的东西",
  paragraphs: [
    "这个博客不是为了输出观点，也不是为了建立什么个人品牌。它更像是一个数字化的抽屉，里面放着一些随手写下的片段、偶尔拍到的光线、某个深夜听到的歌，还有那些还没来得及被分类的感受。",
    "我相信有些东西的价值恰恰在于它们不能被总结。一个下午的光影、一段旋律带来的情绪、走在街上突然涌上心头的记忆——这些体验一旦被提炼成要点，就失去了它们原本的质地。",
    "所以这里的文章不会总是有明确的结论。有时候只是一段观察，一个场景的记录，或者某个瞬间心里闪过的句子。如果你也在寻找一种不需要被理解的表达方式，也许这里会有一点点共鸣。",
  ],
  quote: "写下来，不是为了被理解，而是为了不再遗忘。",
}

// --- Lighthouse Video (Notes Section) ---

export interface LighthouseVideoConfig {
  sectionLabel: string
  dataPoints: string[]
  description: string
  videoPath: string
}

export const lighthouseVideoConfig: LighthouseVideoConfig = {
  sectionLabel: "笔记",
  dataPoints: [
    "2026.07.15 — 半夜听雨，突然觉得安静是一种能力",
    "在读：《时间的秩序》— 卡洛·罗韦利",
    "listening: Frank Ocean — Self Control",
    "有时候，不完整比完整更接近真实",
  ],
  description: "片段、句子、灵感、摘录——那些还没成形但值得被记下的东西。",
  videoPath: "/videos/lighthouse.mp4",
}

// --- Music Section ---

export interface MusicSectionConfig {
  sectionLabel: string
  title: string
  paragraphs: string[]
  ctaText: string
}

export const musicSectionConfig: MusicSectionConfig = {
  sectionLabel: "03 / 音乐",
  title: "声音和文字之间的空隙",
  paragraphs: [
    "有些歌适合在深夜单独听。不是作为背景音，而是作为房间里另一个沉默的参与者。",
    "这里的音乐文字不是乐评，也不是推荐清单。它们更像是在某首歌里迷路时留下的记号——关于一段旋律如何与某个时刻重叠，关于声音如何比语言更早抵达记忆。",
  ],
  ctaText: "查看全部音乐",
}

// --- Footer ---

export interface FooterLinkColumn {
  heading: string
  links: string[]
}

export interface FooterConfig {
  linkColumns: FooterLinkColumn[]
  tickerWords: string[]
  copyright: string
}

export const footerConfig: FooterConfig = {
  linkColumns: [
    {
      heading: "内容",
      links: ["日志", "笔记", "照片", "音乐", "归档"],
    },
    {
      heading: "关于",
      links: ["关于我", "现在", "RSS"],
    },
  ],
  tickerWords: [
    "FRAGMENTS",
    "MEMORY",
    "LIGHT",
    "NIGHT",
    "DREAMS",
    "SILENCE",
    "WAVES",
    "MORNING",
    "RAIN",
    "OCEAN",
    "STARS",
    "CURTAINS",
    "COFFEE",
    "VINYL",
    "NOTEBOOK",
  ],
  copyright: "© 2026 zhanbo.art",
}
