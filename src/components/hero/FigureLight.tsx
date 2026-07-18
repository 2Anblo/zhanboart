export default function FigureLight() {
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
      {/* Chair back */}
      <path d="M100 130 Q96 180 102 250" strokeWidth={1} opacity={0.3} />
      <path d="M224 128 Q230 180 228 252" strokeWidth={1} opacity={0.3} />
      <path d="M100 130 Q160 118 224 128" strokeWidth={0.9} opacity={0.25} />
      <path d="M108 300 Q160 312 220 300" strokeWidth={0.8} opacity={0.2} />

      {/* Legs */}
      <path d="M152 310 L140 400 Q138 420 144 450" strokeWidth={1} opacity={0.35} />
      <path d="M188 310 L200 398 Q204 420 196 450" strokeWidth={1} opacity={0.35} />

      {/* Torso — leaning back */}
      <path d="M158 258 Q150 280 148 310 Q148 340 152 370 Q155 396 152 410" strokeWidth={1.3} />
      <path d="M184 258 Q192 280 196 312 Q198 342 194 372 Q190 400 192 412" strokeWidth={1.3} />
      <path d="M148 290 Q168 298 196 290" strokeWidth={0.9} opacity={0.35} />
      <path d="M146 340 Q170 348 198 338" strokeWidth={0.8} opacity={0.25} />

      {/* Left arm — resting */}
      <path d="M196 286 Q224 310 232 340 Q234 356 228 370" strokeWidth={1.2} />
      <path d="M228 366 Q232 370 226 374" strokeWidth={1} />

      {/* Right arm — draped */}
      <path d="M146 288 Q118 312 110 342 Q106 360 112 374" strokeWidth={1.2} />
      <path d="M110 370 Q106 374 112 378" strokeWidth={1} />

      {/* Neck */}
      <path d="M162 252 L160 234" strokeWidth={1.1} />
      <path d="M178 252 L182 234" strokeWidth={1.1} />

      {/* Head — tilted back */}
      <path d="M154 226 Q142 200 150 172 Q160 148 184 146 Q206 148 212 172 Q216 198 204 224 Q194 236 174 236 Q160 232 154 226 Z" strokeWidth={1.4} />
      <path d="M150 196 Q154 162 182 152 Q208 152 212 176" strokeWidth={1} opacity={0.4} />
      <path d="M158 178 Q166 158 188 154" strokeWidth={0.8} opacity={0.3} />

      {/* Ear */}
      <path d="M154 196 Q150 200 152 206" strokeWidth={0.9} opacity={0.45} />

      {/* Headphones */}
      <path d="M138 192 Q136 152 178 140 Q212 146 220 190" strokeWidth={1.3} />
      <path d="M138 188 Q134 192 136 202 Q138 208 144 206 Q146 198 142 190 Z" strokeWidth={1.2} />
      <path d="M216 188 Q220 190 222 200 Q220 210 214 210 Q208 204 210 196 Z" strokeWidth={1.2} />
      <path d="M142 208 Q136 228 146 248 Q158 268 146 288" strokeWidth={0.7} opacity={0.4} />
      <path d="M210 210 Q216 230 206 250 Q192 270 202 288" strokeWidth={0.7} opacity={0.25} />

      {/* Face — eyes closed, relaxed */}
      <path d="M166 190 Q172 188 178 190" strokeWidth={1} opacity={0.5} />
      <path d="M186 190 Q192 188 196 190" strokeWidth={1} opacity={0.5} />
      <path d="M164 182 Q170 180 178 182" strokeWidth={0.7} opacity={0.25} />
      <path d="M186 182 Q192 180 198 182" strokeWidth={0.7} opacity={0.25} />
      <path d="M178 198 Q182 202 180 210" strokeWidth={0.9} opacity={0.35} />
      <path d="M176 210 Q180 212 184 210" strokeWidth={0.7} opacity={0.3} />
      <path d="M172 220 Q180 224 190 220" strokeWidth={0.8} opacity={0.35} />
      <path d="M160 226 Q174 238 192 226" strokeWidth={0.8} opacity={0.3} />
    </svg>
  );
}
