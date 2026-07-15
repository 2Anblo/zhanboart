import { useEffect, useRef, useCallback } from 'react';
import { heroConfig } from '../config';

export default function HeroRoomGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const roomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    current: 0,
    isMoving: false,
    mouseEnabled: true,
  });

  const rooms = heroConfig.rooms;

  const applyRoomTransform = useCallback(
    (transform: { translateX?: string; translateY?: string; translateZ?: string; rotX?: string; rotY?: string }) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const tx = transform.translateX || '0';
      const ty = transform.translateY || '0';
      const tz = transform.translateZ || '0';
      const rx = transform.rotX || '0';
      const ry = transform.rotY || '0';
      scroller.style.transform = `translate3d(${tx}, ${ty}, ${tz}) rotate3d(1,0,0,${rx}deg) rotate3d(0,1,0,${ry}deg)`;
    },
    []
  );

  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      const state = stateRef.current;
      if (state.isMoving) return;
      state.isMoving = true;

      const scroller = scrollerRef.current;
      const overlay = overlayRef.current;
      const subtitle = subtitleRef.current;
      if (!scroller || !overlay || !subtitle) {
        state.isMoving = false;
        return;
      }

      const prevIndex = state.current;
      const total = rooms.length;
      const nextIndex =
        direction === 'next'
          ? (prevIndex + 1) % total
          : (prevIndex - 1 + total) % total;

      const prevRoom = roomRefs.current[prevIndex];
      const nextRoom = roomRefs.current[nextIndex];
      if (!prevRoom || !nextRoom) {
        state.isMoving = false;
        return;
      }

      const slideDir = direction === 'next' ? '100%' : '-100%';

      // Pre-position incoming room
      nextRoom.style.transform = `translate3d(${slideDir}, 0, 0)`;
      nextRoom.style.opacity = '1';

      const resetTransform = { translateX: '0', translateY: '0', translateZ: '0', rotX: '0', rotY: '0' };
      const initTransform = { translateX: '0', translateY: '0', translateZ: '500px', rotX: '0', rotY: '0' };

      // Phase 1: Retreat to Z=0
      scroller.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      applyRoomTransform(resetTransform);

      // Phase 2: Slide sideways
      setTimeout(() => {
        scroller.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        applyRoomTransform({ ...resetTransform, translateX: slideDir });

        // Phase 3: Swap room, push into new room
        setTimeout(() => {
          prevRoom.classList.remove('room--current');
          nextRoom.classList.add('room--current');
          prevRoom.style.opacity = '0';

          applyRoomTransform({ ...initTransform, translateX: slideDir });

          // Update subtitle and theme
          const room = rooms[nextIndex];
          overlay.setAttribute('data-theme', room.theme);
          subtitle.style.opacity = '0';
          setTimeout(() => {
            subtitle.textContent = room.name;
            subtitle.style.opacity = '0.7';
          }, 150);

          // Phase 4: Silent reset
          setTimeout(() => {
            scroller.style.transition = 'none';
            nextRoom.style.transform = 'translate3d(0,0,0)';
            applyRoomTransform(initTransform);

            state.current = nextIndex;

            setTimeout(() => {
              scroller.style.transition = 'transform 0.3s ease-out';
              state.isMoving = false;
            }, 50);
          }, 350);
        }, 350);
      }, 300);
    },
    [applyRoomTransform, rooms]
  );

  useEffect(() => {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    if (!container || !scroller || rooms.length === 0) return;

    // Initialize first room
    const firstRoom = roomRefs.current[0];
    if (firstRoom) {
      firstRoom.classList.add('room--current');
      firstRoom.style.opacity = '1';
    }
    applyRoomTransform({ translateX: '0', translateY: '0', translateZ: '500px', rotX: '0', rotY: '0' });

    // Mouse tilt
    const handleMouseMove = (e: MouseEvent) => {
      const state = stateRef.current;
      if (state.isMoving || !state.mouseEnabled) return;

      const rotX = -(e.clientY / window.innerHeight - 0.5) * 4;
      const rotY = (e.clientX / window.innerWidth - 0.5) * 6;

      scroller.style.transform = `translate3d(0, 0, 500px) rotate3d(1,0,0,${rotX}deg) rotate3d(0,1,0,${rotY}deg)`;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, applyRoomTransform, rooms]);

  if (!heroConfig.mainTitle && rooms.length === 0) return null;

  return (
    <section id="hero" className="relative" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={containerRef} className="archive-container">
        <div ref={scrollerRef} className="archive-scroller">
          {rooms.map((room, i) => (
            <div
              key={room.name}
              ref={(el) => { roomRefs.current[i] = el; }}
              className={`room ${room.className}`}
            >
              <div className="room__side room__side--back">
                {room.images.back.map((src, j) => (
                  <img key={j} src={src} alt={room.name} loading="eager" />
                ))}
              </div>
              <div className="room__side room__side--left">
                {room.images.left.map((src, j) => (
                  <img key={j} src={src} alt={room.name} loading="eager" />
                ))}
              </div>
              <div className="room__side room__side--right">
                {room.images.right.map((src, j) => (
                  <img key={j} src={src} alt={room.name} loading="eager" />
                ))}
              </div>
              <div className="room__side room__side--top" />
              <div className="room__side room__side--bottom" />
            </div>
          ))}
        </div>
      </div>

      {/* Content overlay */}
      <div ref={overlayRef} className="archive-content" data-theme={rooms[0]?.theme || 'dark'}>
        {/* Navigation arrows */}
        <button
          className="nav-arrow nav-arrow--left"
          onClick={() => navigate('prev')}
          aria-label="Previous room"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="nav-arrow nav-arrow--right"
          onClick={() => navigate('next')}
          aria-label="Next room"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Title */}
        {heroConfig.mainTitle && (
          <div className="archive-title">{heroConfig.mainTitle}</div>
        )}
        <div ref={subtitleRef} className="archive-subtitle" style={{ opacity: 0.7 }}>
          {rooms[0]?.name || ''}
        </div>
        {heroConfig.metaLines.length > 0 && (
          <div className="archive-meta">
            {heroConfig.metaLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < heroConfig.metaLines.length - 1 && <br />}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
