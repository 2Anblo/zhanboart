# zhanbo.art - Technical Specification

## Dependencies

All dependencies are pre-installed by the template:

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.0 | UI framework |
| react-dom | ^19.2.0 | React DOM renderer |
| vite | (bundled) | Build tool |
| @vitejs/plugin-react | ^5.1.1 | Vite React plugin |
| tailwindcss | ^3.4 | Utility CSS |
| gsap | ^3.14.2 | Animation engine (ScrollTrigger, timelines) |
| lenis | ^1.3.21 | Smooth scroll |
| three | ^0.183.2 | 3D particle sculpture |
| @types/three | ^0.183.1 | Three.js types |
| typescript | ^5.7 | Type checking |

## Component Inventory

### Pre-built (from template)

| Component | Source | Notes |
|-----------|--------|-------|
| Navigation | `src/components/Navigation.tsx` | Fixed nav with logo + menu button |
| FullScreenMenu | `src/components/FullScreenMenu.tsx` | Overlay menu with GSAP animations |
| HeroRoomGallery | `src/sections/HeroRoomGallery.tsx` | 3D CSS room gallery |
| ParticleSculpture | `src/sections/ParticleSculpture.tsx` | Three.js particles + editorial text |
| LighthouseVideo | `src/sections/LighthouseVideo.tsx` | Video with liquid glass panel |
| ImageGallery | `src/sections/ImageGallery.tsx` | 3×3 grid with lightbox |
| WavesVideo | `src/sections/WavesVideo.tsx` | Video with typography overlay |
| FooterTicker | `src/sections/FooterTicker.tsx` | Links + terminal ticker |
| useLenis | `src/hooks/useLenis.ts` | Smooth scroll hook |

All components read from `src/config.ts` for content. No layout components needed.

### Customization

All customization is done via `src/config.ts` — no component modifications required. The template is designed for content injection through the config file.

## Animation Implementation

| Animation | Library | Implementation | Complexity |
|-----------|---------|----------------|------------|
| 3D Room Gallery | Vanilla CSS + JS | CSS perspective, transform3d, mousemove handler | High |
| Room Transitions | Vanilla JS | 4-phase timed animation with setTimeout chaining | High |
| Mouse Tilt | Vanilla JS | mousemove → rotate3d calculation, real-time | Medium |
| Particle Sculpture | Three.js | Custom GLSL shaders (simplex noise), Points geometry | High |
| Ambient Dust | Three.js | BufferGeometry with 1500 particles | Low |
| Scroll-triggered fades | GSAP + ScrollTrigger | fromTo with scrollTrigger config | Low |
| Text stagger entrance | GSAP + ScrollTrigger | stagger on querySelectorAll | Low |
| Video scale-in | GSAP + ScrollTrigger | scale 0.95→1 | Low |
| Gallery card entrance | GSAP + ScrollTrigger | Individual card animations | Low |
| Lightbox | React state | CSS fadeIn animation, ESC key handler | Low |
| Terminal Ticker | GSAP + Vanilla JS | Custom render loop, rate-based sweep animation | High |
| Menu open/close | GSAP Timeline | Paused timeline, play/reverse on state change | Medium |
| Logo hover | GSAP | rotationY with yoyo stagger | Low |
| Smooth scroll | Lenis | Integrated with GSAP ticker | Low |

## State & Logic

### Room Gallery State

- **State container**: useRef (not useState, to avoid re-render during animation)
- **Current room index**: Tracks which room is displayed
- **IsMoving flag**: Prevents overlapping transitions
- **MouseEnabled flag**: Disabled during room transitions

### Menu State

- **isOpen**: React useState boolean
- **GSAP timeline**: Stored in ref, played/reversed on state change

### Gallery Lightbox State

- **selectedIndex**: React useState<number | null>
- **ESC key handler**: useEffect with window event listener

### Ticker State

- **Lines array**: Ref containing per-line state (el, chars, word, rates, tweens, timeouts)
- **DICTIONARY**: Array of words from config
- **Render loop**: RAF with visibility gating and 30fps throttling
- **Lifecycle management**: All timeouts and tweens cleaned up on unmount

### Lenis Integration

- **Ref pattern**: Lenis instance stored in ref, returned from hook
- **GSAP ticker sync**: Lenis RAF called from gsap.ticker
- **ScrollTrigger sync**: Lenis scroll event updates ScrollTrigger

## Other Key Decisions

### Config-Driven Architecture

All content lives in `src/config.ts`. Components import their config subset. This allows complete content customization without touching component code.

### Visibility-Gated Rendering

Performance-critical sections (Three.js canvas, terminal ticker) use IntersectionObserver to pause rendering when off-screen. This prevents GPU and CPU waste on invisible content.

### Ref-Based Animation State

Room gallery uses useRef for animation state (current room, isMoving) rather than useState. This avoids React re-renders during 60fps mouse tracking and complex multi-phase transitions.

### Image Loading

- Room images: `loading="eager"` (visible immediately)
- Gallery images: `loading="lazy"` (below fold)

### No Backend

Static site with all content in config. No API calls, no dynamic data fetching.
