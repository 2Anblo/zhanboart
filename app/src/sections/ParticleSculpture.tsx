import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { particleConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

// Simplex noise GLSL (standard 3D implementation)
const simplexNoiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const vertexShader = `
${simplexNoiseGLSL}
uniform float uTime;
varying float vNoise;

void main() {
  float noise = snoise(vec3(position.x * 0.2, position.y * 0.2, position.z * 0.2 + uTime * 0.05));
  vNoise = noise;
  vec3 newPosition = position + normal * (noise * 2.5);
  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
  gl_PointSize = (8.0 * (1.0 + noise)) * (15.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
varying float vNoise;

void main() {
  vec2 xy = gl_PointCoord.xy - vec2(0.5);
  float ll = length(xy);
  if (ll > 0.5) discard;
  vec3 colorMain = vec3(0.05, 0.05, 0.05);
  vec3 colorShadow = vec3(0.3, 0.35, 0.35);
  vec3 finalColor = mix(colorShadow, colorMain, vNoise + 0.5);
  float alpha = (0.5 - ll) * 2.0;
  alpha *= smoothstep(-1.0, 0.5, vNoise);
  gl_FragColor = vec4(finalColor, alpha * 0.9);
}
`;

export default function ParticleSculpture() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf5f4f0, 0.035);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // TorusKnot geometry
    const geometry = new THREE.TorusKnotGeometry(4, 1.2, 220, 40);
    geometry.scale(1, 1.5, 0.7);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);

    // Ambient dust
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500 * 3; i++) {
      dustPositions[i] = (Math.random() - 0.5) * 30;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0x222222,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    // Animation — gated by visibility
    const clock = new THREE.Clock();
    let rafId: number;
    let isVisible = false;

    function animate() {
      rafId = requestAnimationFrame(animate);
      if (!isVisible) return;
      const elapsed = clock.getElapsedTime();
      material.uniforms.uTime.value = elapsed * 0.5;
      mesh.rotation.y = elapsed * 0.08;
      mesh.rotation.x = Math.sin(elapsed * 0.05) * 0.1;
      dust.rotation.y = elapsed * 0.02;
      renderer.render(scene, camera);
    }
    animate();

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            clock.getDelta();
            isVisible = true;
          } else {
            isVisible = false;
          }
        }
      },
      { threshold: 0 }
    );
    if (sectionRef.current) visibilityObserver.observe(sectionRef.current);

    // Resize
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    ro.observe(container);

    // GSAP entrance
    const section = sectionRef.current;
    if (section) {
      gsap.fromTo(
        container,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          delay: 0.3,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
          },
        }
      );
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      visibilityObserver.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Text entrance animation
  useEffect(() => {
    const text = textRef.current;
    const section = sectionRef.current;
    if (!text || !section) return;

    const elements = text.querySelectorAll('.animate-in');
    gsap.fromTo(
      elements,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
        },
      }
    );
  }, []);

  if (!particleConfig.sectionLabel && !particleConfig.title && particleConfig.paragraphs.length === 0 && !particleConfig.quote) {
    return null;
  }

  return (
    <section
      id="consciousness"
      ref={sectionRef}
      style={{
        background: '#f5f4f0',
        minHeight: '100vh',
        padding: '12rem var(--page-padding)',
      }}
    >
      <div
        className="mx-auto flex flex-col md:flex-row gap-16"
        style={{ maxWidth: '1400px' }}
      >
        {/* Left column — Editorial text */}
        <div ref={textRef} className="w-full md:w-[45%]">
          {particleConfig.sectionLabel && (
            <div className="section-label animate-in" style={{ marginBottom: '2rem' }}>
              {particleConfig.sectionLabel}
            </div>
          )}

          {particleConfig.title && (
            <h2
              className="animate-in"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: '#141414',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '3rem',
              }}
            >
              {particleConfig.title}
            </h2>
          )}

          {particleConfig.paragraphs.map((text, i) => (
            <p
              key={i}
              className="animate-in"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 300,
                fontSize: '16px',
                color: '#141414',
                lineHeight: 1.7,
                marginBottom: '2rem',
              }}
              dangerouslySetInnerHTML={{ __html: text }}
            />
          ))}

          {particleConfig.quote && (
            <blockquote
              className="animate-in"
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                color: '#141414',
                lineHeight: 1.1,
                borderLeft: '2px solid #f25b29',
                paddingLeft: '2rem',
                margin: '4rem 0',
              }}
            >
              {particleConfig.quote}
            </blockquote>
          )}
        </div>

        {/* Right column — Three.js canvas */}
        <div className="w-full md:w-[55%] relative" style={{ minHeight: '500px' }}>
          <div
            ref={canvasContainerRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0,
            }}
          />
        </div>
      </div>
    </section>
  );
}
