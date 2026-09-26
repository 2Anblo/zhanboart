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

// --- Homepage Landing Stage ---
// One pinned stage, scrolled through as chapters.

export interface ThemedImage {
  dark: string
  light: string
  alt: string
}

export interface LandingChapter {
  id: string
  index: string
  label: string
}

export interface LandingFragment {
  title: string
  body: string
}

export interface LandingConfig {
  chapters: LandingChapter[]
  hero: {
    image: ThemedImage
    title: string
    titleLight: string
    subtitle: string[]
    cta: { label: string; href: string }
    chip: string
    body: string
  }
  journal: {
    image: ThemedImage
    title: string[]
    chip: string
    fallback: string
    cta: string
  }
  photos: {
    halftone: ThemedImage
    groups: { chip: string; title: string[]; body: string }[]
    cta: string
  }
  music: {
    image: ThemedImage
    title: string[]
    chip: string
    body: string
    cta: string
  }
  fragments: {
    image: ThemedImage
    title: string
    script: string
    items: LandingFragment[]
  }
  finale: {
    figure: ThemedImage
    wordmark: string
    tagline: string[]
    meta: string
    links: { label: string; href: string }[]
  }
}

export const landingConfig: LandingConfig = {
  chapters: [
    { id: "journal", index: "Ch. 1", label: "日志" },
    { id: "photos", index: "Ch. 2", label: "照片" },
    { id: "music", index: "Ch. 3", label: "音乐" },
    { id: "fragments", index: "Ch. 4", label: "碎片" },
  ],
  hero: {
    image: {
      dark: "/images/hero/night-window.jpg",
      light: "/images/rooms/room2-right.jpg",
      alt: "窗外的光",
    },
    title: "屏幕亮着，房间没有开灯。",
    titleLight: "窗帘拉开，光落在墙上。",
    subtitle: ["一些不需要被总结的东西，", "碎片、光线和记忆。"],
    cta: { label: "开始阅读", href: "#journal" },
    chip: "zhanbo.art",
    body: "这里不是工作主页，也不是项目展示。它更像一个数字化的抽屉：随手写下的片段，偶尔拍到的光线，某个深夜听到的歌。",
  },
  journal: {
    image: {
      dark: "/images/rooms/room1-back.jpg",
      light: "/images/rooms/room4-right.jpg",
      alt: "台灯下摊开的本子",
    },
    title: ["写下来，", "是为了不再遗忘。"],
    chip: "最新日志",
    fallback: "有些夜晚只是坐着，也足够接近自己。",
    cta: "全部日志",
  },
  photos: {
    halftone: {
      dark: "/images/hero/night-window.jpg",
      light: "/images/rooms/room2-right.jpg",
      alt: "以网点呈现的一张旧照片",
    },
    groups: [
      {
        chip: "照片",
        title: ["光停留过的地方，", "会留下一点形状。"],
        body: "不是作品集。只是那些让我停下来的瞬间：窗帘的缝隙，路灯下的车，屏幕里的一帧。",
      },
      {
        chip: "关于颗粒",
        title: ["记忆不是高清的，", "它有噪点。"],
        body: "越久远的画面，越像由一颗颗小点组成。靠近时散开，退后才看得清。",
      },
    ],
    cta: "进入照片",
  },
  music: {
    image: {
      dark: "/images/rooms/room3-right.jpg",
      light: "/images/rooms/room4-left.jpg",
      alt: "转动的黑胶唱片",
    },
    title: ["声音比语言", "更早抵达记忆"],
    chip: "音乐",
    body: "有些歌适合在深夜单独听。不是作为背景音，而是作为房间里另一个沉默的参与者。",
    cta: "去听一听",
  },
  fragments: {
    image: {
      dark: "/images/rooms/room3-back.jpg",
      light: "/images/rooms/room4-back.jpg",
      alt: "黄昏的海平线",
    },
    title: "夜里想过的事",
    script: "after midnight",
    items: [
      { title: "23:48 / 房间", body: "有些夜晚只是坐着，也足够接近自己。" },
      { title: "07.15 / 窗帘", body: "光从窗帘的缝隙里，留下很慢的灰尘。" },
      { title: "关于语言", body: "任何语言都不过是人与人之间的桥。意思抵达了，口音就不重要。" },
      { title: "LISTENING", body: "Self Control，第三次循环。副歌前那一秒的安静最好。" },
      { title: "关于完整", body: "有时候，不完整比完整更接近真实。" },
    ],
  },
  finale: {
    figure: {
      dark: "/images/dark-mode.png",
      light: "/images/light-mode.png",
      alt: "戴耳机的人",
    },
    wordmark: "zhanbo.",
    tagline: ["一些不需要被总结的东西。"],
    meta: "ZHANBO.ART · URBANA — SHANGHAI · 2026",
    links: [
      { label: "日志", href: "/journal" },
      { label: "照片", href: "/photos" },
      { label: "音乐", href: "/music" },
      { label: "归档", href: "/archive" },
    ],
  },
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
