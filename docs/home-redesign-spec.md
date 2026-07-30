# zhanbo.art Homepage Redesign Spec

## Purpose

The homepage is an experience page, not a navigation page, feed, portfolio, or product-style landing page.

The redesign should make `zhanbo.art` feel more visually authored and closer to award-level interactive work, while keeping the site rooted in private expression. The visitor is not being welcomed or guided. They are quietly peeking into a private mental space.

Core direction:

> 私人表达优先，炫技是表达方式，不是目的。

## Reference Boundary

`https://earendil.com/` is a reference for system-level texture, not visual copying.

Borrow:

- fixed ambient environment layer
- sparse text
- edge chrome
- dark/light as two lighting states of one space
- slow theme interpolation
- grain, texture, and tiny interaction details

Do not borrow:

- ocean or starfield symbolism
- centered logo ritual
- corporate declaration hero
- English serif statement as the main identity
- the exact visual surface

For `zhanbo.art`, translate those ideas into a night room, screen glow, narrow lamp light, dust, wall reflection, and memory residue.

## Homepage Structure

The homepage should be short, concentrated, and re-enterable. Target perceived length: 2.5-4 viewport heights.

1. Silent Hero
2. Horizontal Memory Strip
3. Afterglow / Footer

The homepage does not need list entrances for journal, notes, photos, or music. Content navigation remains in the existing menu button and `/menu` page.

## Silent Hero

The hero is a full-screen cinematic image/video entrance.

It should feel like a night room where the main lights are off. The room is lit by a monitor and a narrow lamp above or near the monitor.

Current placeholder line:

> 屏幕亮着，房间没有开灯。

This line is temporary and should remain configurable.

Hero rules:

- no site name in the first viewport
- no `scroll` text
- no arrow
- no `enter`
- no category links
- no visible explanation of the site
- no next-section teaser
- no warm host behavior

If the visitor does nothing, the page stays quiet.

### Hero Media Direction

The main media should be cinematic and mostly real-feeling, with only subtle surreal treatment.

Scene guidance:

- dark room
- monitor cold light as one primary source
- narrow warm lamp light above or near the monitor
- wall or dark clean area available for text
- partial desk edge, screen edge, curtain, doorway, reflection, or object silhouettes
- slow motion, low movement, no fast cuts
- dark areas should keep texture and depth

Avoid:

- cyberpunk city
- neon glitch
- obvious AI deformation
- visible brand emphasis
- front-facing person as the subject
- desk setup showcase
- pure abstract particle stock video

### Media Replacement

The implementation must be config-driven and support painless asset replacement.

Expected config fields:

```ts
hero: {
  line: string;
  videoSrc: string;
  posterSrc: string;
  videoSrcLight?: string;
  posterSrcLight?: string;
}
```

Default behavior should use one main video for both themes. Light and dark differences should primarily come from overlays, color treatment, veils, masks, grain, and lighting interpolation rather than hard-switching to unrelated media.

## First Scroll Moment

The strongest visual moment should happen when the first scroll breaks the silent hero.

Desired feeling:

- the room is disturbed
- the line withdraws, softens, blurs, or recedes
- the hero media subtly changes scale or depth
- dark areas open to reveal the memory strip
- the menu becomes clearer

This is the main award-level moment. Later sections should remain quieter.

Do not turn every section into a visual stunt.

## Menu Strategy

Keep the existing menu button and `/menu` route.

In the silent hero:

- menu is present but low-contrast
- desktop opacity can sit around `0.35-0.5`
- hover/focus brings it to full clarity
- first scroll can raise it to `0.8-1`
- no wide nav row in the hero
- no large hamburger treatment or pill background

Accessibility still matters:

- keyboard focus must be visible
- mobile menu must remain discoverable enough to access content
- reduced-motion users should not wait through delayed essential navigation

## Horizontal Memory Strip

The memory strip is not a content index. It is a curated emotional collage.

Data should live in `src/config.ts`, not be automatically generated from Markdown.

It may include:

- photos
- text fragments
- date/time fragments
- music traces
- blurred video stills
- system-log-like marks
- real content traces selected by hand

It should not include:

- full article cards
- title lists
- tag clouds
- `read more`
- category CTAs
- portfolio carousel behavior

Suggested ratio:

- 80% emotional/visual material
- 20% real content traces

### Visual Language

The strip combines room wall / desk space with screen-interface residue.

Images should not be clean uniform cards. They can feel like:

- projected image residue on a wall
- a small screen window
- a photo caught by monitor light
- a blurred memory frame

Rules:

- no unified card grid
- no thick rounded cards
- no repeated captions
- no hover-to-gallery behavior by default
- allow large dark gaps and negative space
- only one or two elements may be clickable, if any

### Motion

The strip should feel like a damped scan across a dark wall, not a carousel.

Implementation direction:

- GSAP ScrollTrigger pinned section
- vertical wheel input drives horizontal transform
- Lenis smooth scroll remains integrated
- no snap-to-section
- no page-by-page lock
- multiple depth layers with different speeds
- subtle parallax, generally in the 20-40px range

Reduced motion:

- disable pinned horizontal motion
- present the collage as a quiet vertical/static composition

Mobile:

- shorten horizontal distance or fall back to vertical layout
- avoid awkward scroll traps

## Dark / Light Mode

Dark and light are two lighting states of the same mental room.

### Dark

Dark mode is a room with the lights off, not pure black UI.

Use:

- layered near-black backgrounds
- monitor blue-gray light
- narrow warm lamp edge
- wall and desk texture
- soft dust/grain
- low-brightness text

Avoid:

- pure black as the main surface
- high-contrast neon
- RGB glow
- product-launch darkness

### Light

Light mode is not daytime and not cream-blog style. It is a bleached memory after night.

Use:

- low-contrast fogged neutrals
- paper/dust texture
- pale gray text
- lifted exposure
- softened video contrast
- very faint warmth from the lamp

Avoid:

- sunny lifestyle blog
- cream card template
- beige-heavy card UI
- ordinary light theme inversion

Theme switching should feel like lighting interpolation, around 900-1200ms, not a hard skin swap.

## Content Pages

Content pages inherit the atmosphere, not the strong homepage motion.

Rules:

- no hero video on article/detail pages
- no horizontal memory strip on detail pages
- no strong WebGL distraction while reading
- no huge cover at the top of every article
- keep grain, veil, paper/dark-wall texture very subtle
- preserve dark/light room logic

The transition into content should feel like moving from the room toward a page, not jumping into another website.

## Existing Components

Keep useful capabilities, but rewrite the homepage experience structure.

Likely keep:

- `Navigation`
- `/menu`
- `useLenis`
- theme infrastructure
- GSAP / ScrollTrigger setup
- config-driven content patterns

Likely replace or substantially reshape:

- `HeroRoomGallery`
- `LighthouseVideo`
- `ParticleSculpture` as a dominant section
- any homepage section that behaves like a content directory

`FooterTicker` can remain only if it feels like afterglow, not a terminal gimmick.

## Performance And Accessibility

Requirements:

- first hero text must not wait for WebGL or video readiness
- video must have poster fallback
- ambient layers must degrade to CSS backgrounds
- `prefers-reduced-motion` must be honored
- mobile should reduce blur, shadow, particles, and pinned motion
- all images need explicit dimensions or aspect ratios
- dark and light modes must keep basic contrast
- static export must remain compatible

## Implementation Plan

1. Write and approve this spec.
2. Build a Hero first pass: config-driven video hero, silent first viewport, one line, low-contrast menu, first-scroll withdrawal.
3. Build the Memory Strip: curated config array, pinned horizontal motion, depth layers, reduced-motion fallback.
4. Polish atmosphere: grain, veils, light interpolation, mouse light/fold effects, mobile tuning.
5. Align content pages: quiet ambient texture only, no strong homepage effects.

## Acceptance Checklist

- The first viewport feels like a private night room, not a landing page.
- There is no scroll prompt, arrow, site-name hero, or category entrance in the hero.
- The first scroll is the strongest transition moment.
- The memory strip reads as emotional collage, not content navigation.
- Menu remains accessible but visually quiet in the hero.
- Dark mode has textured room depth, not pure black UI.
- Light mode feels like bleached memory, not a cream template.
- Reading pages remain calm.
- Reduced motion and mobile fallbacks are designed, not accidental.
- Hero media and memory strip content are controlled from config.
