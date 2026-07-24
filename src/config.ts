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
  fullscreenMenuLinks: { label: string; target: string }[]
  menuSideInfo: string[]
}

export const navigationConfig: NavigationConfig = {
  menuLabel: "菜单",
  closeLabel: "关闭",
  fullscreenMenuLinks: [
    { label: "入口", target: "hero" },
    { label: "日志", target: "consciousness" },
    { label: "笔记", target: "lighthouse" },
    { label: "音乐", target: "music" },
    { label: "关于", target: "footer" },
  ],
  menuSideInfo: [
    "ZHANBO.ART 2026",
    "碎片 · 光线 · 记忆",
    "上海 — 私人博客",
  ],
}

// --- Hero Room Gallery ---

export interface RoomConfig {
  name: string
  className: string
  theme: "light" | "dark"
  images: {
    back: string[]
    left: string[]
    right: string[]
  }
}

export interface HeroConfig {
  mainTitle: string
  rooms: RoomConfig[]
  metaLines: string[]
}

export const heroConfig: HeroConfig = {
  mainTitle: "zhanbo.art",
  rooms: [
    {
      name: "深夜写作",
      className: "room--waves",
      theme: "dark",
      images: {
        back: ["/images/rooms/room1-back.jpg"],
        left: ["/images/rooms/room1-left.jpg"],
        right: ["/images/rooms/room1-right.jpg"],
      },
    },
    {
      name: "安静阅读",
      className: "room--monk",
      theme: "light",
      images: {
        back: ["/images/rooms/room2-back.jpg"],
        left: ["/images/rooms/room2-left.jpg"],
        right: ["/images/rooms/room2-right.jpg"],
      },
    },
    {
      name: "记忆深处",
      className: "room--lighthouse",
      theme: "dark",
      images: {
        back: ["/images/rooms/room3-back.jpg"],
        left: ["/images/rooms/room3-left.jpg"],
        right: ["/images/rooms/room3-right.jpg"],
      },
    },
    {
      name: "白日梦",
      className: "room--orlando",
      theme: "light",
      images: {
        back: ["/images/rooms/room4-back.jpg"],
        left: ["/images/rooms/room4-left.jpg"],
        right: ["/images/rooms/room4-right.jpg"],
      },
    },
  ],
  metaLines: [
    "一个私人博客",
    "碎片 · 光线 · 记忆",
    "上海 — 2026",
  ],
}

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
