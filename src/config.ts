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
    { label: "照片", target: "waves-gallery" },
    { label: "音乐", target: "music" },
    { label: "此刻", target: "waves-video" },
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

// --- Waves Video (Now Section) ---

export interface WavesVideoConfig {
  sectionLabel: string
  title: string
  ctaText: string
  videoPath: string
}

export const wavesVideoConfig: WavesVideoConfig = {
  sectionLabel: "04 / 现在",
  title: "此刻",
  ctaText: "返回顶部",
  videoPath: "/videos/waves.mp4",
}

// --- Image Gallery ---

export interface GalleryItem {
  src: string
  caption: string
  description: string
}

export interface GalleryConfig {
  sectionLabel: string
  sectionTitle: string
  items: GalleryItem[]
  lightboxCloseHint: string
}

export const galleryConfig: GalleryConfig = {
  sectionLabel: "03 / 照片",
  sectionTitle: "光与影的存档",
  items: [
    {
      src: "/images/gallery/item1.jpg",
      caption: "百叶窗的光",
      description: "下午三四点的阳光透过百叶窗，在墙上画出整齐的光影条纹。这样的时刻总让人想起小时候午后的教室，安静得只能听见吊扇转动的声音。",
    },
    {
      src: "/images/gallery/item2.jpg",
      caption: "雨夜街头",
      description: "雨天晚上的街道有一种特殊的氛围。地面反射着霓虹和路灯，行人匆匆，每一把伞下都是一个独立的小世界。",
    },
    {
      src: "/images/gallery/item3.jpg",
      caption: "阅读时光",
      description: "一个完美的阅读角落：舒适的椅子、温暖的灯光、一本打开的书，还有一只在打盹的猫。这就是周末下午最理想的样子。",
    },
    {
      src: "/images/gallery/item4.jpg",
      caption: "清晨咖啡",
      description: "第一杯咖啡总是最好的。晨光从窗户斜射进来，咖啡的香气和热气一起升腾，新的一天就这样安静地开始了。",
    },
    {
      src: "/images/gallery/item5.jpg",
      caption: "黑胶唱片",
      description: "数字音乐很方便，但黑胶有一种不可替代的仪式感。放下唱针的那一刻，沙沙的底 noise 成了音乐的一部分。",
    },
    {
      src: "/images/gallery/item6.jpg",
      caption: "城市黄昏",
      description: "站在高处看城市沉入黄昏，天际线从金色变成深蓝。这是一天中最让人平静的时刻，仿佛整座城市都在深呼吸。",
    },
    {
      src: "/images/gallery/item7.jpg",
      caption: "干花",
      description: "鲜花很美，但干花有一种凋零之后的美。它们不再是盛开的模样，却保留了时间的痕迹，像是被定格的记忆。",
    },
    {
      src: "/images/gallery/item8.jpg",
      caption: "手写的温度",
      description: "在这个一切都数字化的时代，手写的东西变得越来越珍贵。墨水在纸上留下的痕迹，是打字无法替代的温度。",
    },
    {
      src: "/images/gallery/item9.jpg",
      caption: "海边日落",
      description: "海边的日落总是让人词穷。天空的颜色每一秒都在变化，海浪一遍遍地冲刷沙滩，而太阳只是安静地沉入地平线。",
    },
  ],
  lightboxCloseHint: "按 Esc 或点击外部关闭",
}

// --- Music Section ---

export interface MusicSectionConfig {
  sectionLabel: string
  title: string
  paragraphs: string[]
  ctaText: string
}

export const musicSectionConfig: MusicSectionConfig = {
  sectionLabel: "05 / 音乐",
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

