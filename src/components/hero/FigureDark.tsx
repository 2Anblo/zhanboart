export default function FigureDark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 480"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Desk surface */}
      <path d="M40 390 L280 390" strokeWidth={1} opacity={0.3} />
      <path d="M40 392 L280 392" strokeWidth={0.6} opacity={0.15} />

      {/* Notebook/paper on desk */}
      <path d="M120 386 L240 386 L244 390 L116 390 Z" opacity={0.25} />
      <path d="M140 382 L220 382" strokeWidth={0.8} opacity={0.2} />

      {/* Chair back */}
      <path d="M108 290 Q104 250 116 210" strokeWidth={0.9} opacity={0.2} />
      <path d="M218 295 Q226 260 220 215" strokeWidth={0.9} opacity={0.2} />

      {/* Legs under desk */}
      <path d="M148 390 L142 450" strokeWidth={1} opacity={0.3} />
      <path d="M184 390 L178 445" strokeWidth={1} opacity={0.3} />

      {/* Torso — leaning forward */}
      <path d="M158 250 Q152 290 148 330 Q146 360 144 380" strokeWidth={1.3} />
      <path d="M178 248 Q184 290 186 330 Q188 360 190 378" strokeWidth={1.3} />
      <path d="M150 285 Q168 278 184 288" strokeWidth={0.9} opacity={0.4} />

      {/* Left arm — resting */}
      <path d="M186 290 Q210 320 224 360 Q228 372 226 384" strokeWidth={1.2} />
      <path d="M224 378 Q230 376 236 380 Q238 383 235 386" strokeWidth={1} />

      {/* Right arm — extended, holding pen */}
      <path d="M148 290 Q120 325 104 365 Q100 378 108 388" strokeWidth={1.2} />
      <path d="M108 382 Q100 378 96 384 Q95 387 100 390" strokeWidth={1} />
      {/* Pen */}
      <path d="M96 380 L82 362" strokeWidth={1.2} />
      <path d="M82 362 L78 358" strokeWidth={0.8} />

      {/* Neck */}
      <path d="M160 242 L156 225" strokeWidth={1.1} />
      <path d="M176 242 L180 225" strokeWidth={1.1} />

      {/* Head — tilted down */}
      <path d="M152 218 Q142 196 148 172 Q155 152 178 150 Q200 152 204 174 Q206 196 196 216 Q186 228 168 226 Q156 224 152 218 Z" strokeWidth={1.4} />
      <path d="M150 195 Q156 168 180 160 Q200 158 204 174" strokeWidth={1} opacity={0.5} />
      <path d="M156 180 Q162 164 184 160" strokeWidth={0.8} opacity={0.3} />

      {/* Ear */}
      <path d="M152 190 Q148 192 150 198" strokeWidth={0.9} opacity={0.5} />

      {/* Headphones */}
      <path d="M138 188 Q140 155 178 144 Q208 150 214 186" strokeWidth={1.3} />
      <path d="M138 184 Q135 188 137 196 Q140 202 145 200 Q146 194 143 188 Z" strokeWidth={1.2} />
      <path d="M210 184 Q213 186 215 194 Q213 202 208 204 Q203 200 204 192 Z" strokeWidth={1.2} />
      <path d="M143 200 Q140 210 148 220 Q160 235 150 250 Q140 270 152 290" strokeWidth={0.7} opacity={0.5} />
      <path d="M208 202 Q212 214 204 230 Q192 248 200 268" strokeWidth={0.7} opacity={0.3} />

      {/* Face */}
      <path d="M168 192 Q172 190 178 192" strokeWidth={1} opacity={0.6} />
      <path d="M167 185 Q172 183 179 185" strokeWidth={0.7} opacity={0.3} />
      <path d="M175 196 Q178 202 175 208" strokeWidth={0.9} opacity={0.4} />
      <path d="M170 212 Q176 214 182 212" strokeWidth={0.8} opacity={0.4} />
    </svg>
  );
}
