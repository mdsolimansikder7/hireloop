// components/CTASection.tsx
// Drop-in replacement for the CTA section ("Your next role is already looking for you").
// Remove the old dome / gradient / grid CSS completely. Do NOT mix it with this one.

const W = 1440;
const H = 560;
const CX = W / 2;
const CY = 660; // ellipse center sits below the visible area
const RX = 800; // horizontal radius (wider than the viewBox, so the sides get clipped)
const RY = 600; // vertical radius -> dome top is at y = CY - RY = 60 (inside the section, so no flat top)

// concentric arcs (latitude lines)
const rings = [0.3, 0.45, 0.6, 0.72, 0.82, 0.91];

// radial lines (longitude lines), every 7.5 degrees, skipping the two flat ones
const radials = Array.from({ length: 23 }, (_, i) => {
  const deg = (i + 1) * 7.5;
  const rad = (deg * Math.PI) / 180;
  return {
    x2: CX + RX * Math.cos(rad),
    y2: CY - RY * Math.sin(rad),
  };
});

export default function CTASection() {
  return (
    <section className="relative isolate overflow-hidden bg-black">
      {/* Background: dome + glow + grid */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <clipPath id="cta-dome">
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
          </clipPath>

          {/* glow concentrated at top-center, fading to black */}
          <radialGradient id="cta-glow" cx="50%" cy="0%" r="50%">
            <stop offset="0" stopColor="#6c5fff" stopOpacity="1" />
            <stop offset="0.3" stopColor="#5b4ff5" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#3a30c0" stopOpacity="0.15" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          {/* thin bright rim on the dome edge */}
          <linearGradient id="cta-rim" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#8b82ff" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="#c4bfff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#8b82ff" stopOpacity="0.15" />
          </linearGradient>

          {/* grid fades slightly toward the bottom */}
          <linearGradient id="cta-grid-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
          </linearGradient>
          <mask id="cta-grid-mask">
            <rect width={W} height={H} fill="url(#cta-grid-fade)" />
          </mask>

          {/* bottom fade into the footer */}
          <linearGradient id="cta-bottom" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0.65" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* dome body */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#05050a" />
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#cta-glow)" />

        {/* globe grid, clipped to the dome */}
        <g mask="url(#cta-grid-mask)">
          <g
            clipPath="url(#cta-dome)"
            stroke="#fff"
            strokeOpacity="0.1"
            strokeWidth="1"
            fill="none"
          >
            {rings.map((k) => (
              <ellipse key={k} cx={CX} cy={CY} rx={RX * k} ry={RY * k} />
            ))}
            {radials.map((p, i) => (
              <line key={i} x1={CX} y1={CY} x2={p.x2} y2={p.y2} />
            ))}
          </g>
        </g>

        {/* rim highlight */}
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          fill="none"
          stroke="url(#cta-rim)"
          strokeWidth="1.5"
        />

        <rect width={W} height={H} fill="url(#cta-bottom)" />
      </svg>

      {/* Content */}
      <div className="mx-auto flex max-w-[1100px] flex-col items-center px-6 pb-32 pt-44 text-center md:pt-52">
        <h2 className="text-[36px] font-medium leading-[1.15] tracking-tight text-white md:text-[48px]">
          Your next role is
          <br />
          already looking for you
        </h2>

        <p className="mt-4 max-w-[520px] text-[13px] leading-6 text-neutral-400 md:text-sm">
          Build a profile in three minutes. The matches start arriving tomorrow
          morning.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/signup"
            className="rounded-lg bg-white px-[18px] py-2.5 text-[13px] font-medium text-black transition hover:bg-neutral-200"
          >
            Create a free account
          </a>
          <a
            href="#pricing"
            className="rounded-lg border border-white/10 bg-[#111] px-[18px] py-2.5 text-[13px] font-medium text-white transition hover:bg-[#1a1a1a]"
          >
            View pricing
          </a>
        </div>
      </div>
    </section>
  );
}
