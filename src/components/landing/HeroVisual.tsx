/**
 * "First Waypoint" — the approved final hero illustration.
 *
 * A single inline SVG (plus two small ambient glow layers) replacing the
 * earlier temporary CSS-marker composition. Built entirely as hand-authored
 * vector shapes — no image asset, no external request, no packages.
 *
 * Composition (see the approved spec for full rationale): a young figure at
 * the start of an organic path (uncertainty), a small violet "guidance"
 * spark just ahead of them (AI-supported guidance), a short cyan glow
 * tracing the ground already covered (progress), three brand-indigo
 * waypoints receding into the distance with the nearest one emphasized
 * (discovery), a second, smaller, muted figure farther along the path
 * (others are on this journey too), and one amber-highlighted waypoint
 * before the path fades into quiet, empty space at the top-right — a next
 * step, not a finish line.
 *
 * Skin/hair/clothing use a small FIXED palette (never theme-reactive) so a
 * person's rendering never shifts with light/dark mode; the path, trail,
 * spark, and waypoint rings use the theme-aware Waypoint CSS variables.
 * Purely decorative — hidden from assistive technology, same as before.
 */
export default function HeroVisual() {
  const SKIN = '#9a6b47';
  const HAIR = '#2b1b12';
  const JACKET = '#c4694a';
  const PANTS = '#3a3f4e';
  const BAG = '#7c6a45';

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="relative mx-auto aspect-[4/3] w-full max-w-md sm:max-w-lg"
    >
      {/* Ambient glows — two, small and fixed-size, tucked behind the
          figure and the milestone waypoint rather than spread across the
          whole frame. */}
      <div className="absolute -left-4 bottom-4 h-36 w-36 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute right-2 top-4 h-28 w-28 rounded-full bg-milestone/15 blur-3xl" />

      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
        {/* Cyan progress trail — the ground already covered, under the
            main path, fading toward the first waypoint only. */}
        <path
          d="M 55 255 C 85 240, 105 212, 128 196"
          fill="none"
          stroke="var(--color-journey)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Main path — brand/indigo, organic curve, fades out (no finish
            line) into the quiet upper-right. */}
        <path
          d="M 55 255 C 90 235, 110 205, 140 190 C 175 172, 200 150, 225 135 C 255 118, 275 100, 300 85 C 322 72, 338 62, 353 50"
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 7"
          opacity="0.55"
        />

        {/* Waypoint 4 — the milestone, amber. Positioned to leave the
            corner beyond it empty. */}
        <g transform="translate(350 52)">
          <circle r="19" fill="var(--color-milestone)" opacity="0.12" />
          <circle r="13" fill="var(--color-surface)" stroke="var(--color-milestone)" strokeWidth="2.5" />
          <path
            d="M -4 -6 H 4 V -1 A 4 4 0 0 1 -4 -1 Z M -4 -5 H -6.5 A2 2 0 0 0 -4 -2.7 M 4 -5 H 6.5 A2 2 0 0 1 4 -2.7 M -2 3 H 2 M 0 -1 V 3"
            fill="none"
            stroke="var(--color-milestone)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Waypoint 3 — tech program, receding (smaller, softer). */}
        <g transform="translate(295 90)" opacity="0.8">
          <circle r="11" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="2" />
          <path
            d="M 0 -6 V 6 M -6 0 H 6 M -4.2 -4.2 L 4.2 4.2 M -4.2 4.2 L 4.2 -4.2"
            stroke="var(--color-brand)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>

        {/* Secondary figure — smaller, flat, muted; someone else farther
            along the same path. */}
        <g transform="translate(226 122)" opacity="0.5" fill="var(--color-ink-3)">
          <circle cx="10" cy="6" r="6" />
          <path d="M4 15 C4 12 7 11 10 11 C13 11 16 12 16 15 L15 30 C15 33 5 33 5 30 Z" />
          <path d="M6 30 L3 44" stroke="var(--color-ink-3)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M14 30 L18 44" stroke="var(--color-ink-3)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>

        {/* Waypoint 2 — scholarship. */}
        <g transform="translate(222 133)" opacity="0.9">
          <circle r="12" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="2.25" />
          <path d="M -7 -3 L 0 -6.5 L 7 -3 L 0 0.5 Z" fill="var(--color-brand)" />
          <path
            d="M -3.5 -1 V 2.5 C -3.5 4.5 3.5 4.5 3.5 2.5 V -1"
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="1.2"
          />
        </g>

        {/* Waypoint 1 — internship, nearest and emphasized: larger, fully
            opaque, with its own soft halo. */}
        <g transform="translate(148 187)">
          <circle r="24" fill="var(--color-brand)" opacity="0.14" />
          <circle r="16" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="3" />
          <rect x="-7" y="-4" width="14" height="10" rx="2" fill="none" stroke="var(--color-brand)" strokeWidth="1.6" />
          <path d="M -3.5 -4 V -6 A2 2 0 0 1 -1.5 -8 H1.5 A2 2 0 0 1 3.5 -6 V -4" fill="none" stroke="var(--color-brand)" strokeWidth="1.6" />
        </g>

        {/* Violet guidance spark — small, just ahead of the primary
            figure's forward hand. */}
        <g transform="translate(98 208)" stroke="var(--color-ai)" strokeWidth="1.4" strokeLinecap="round">
          <path d="M 0 -6 V 6 M -6 0 H 6 M -4 -4 L 4 4 M -4 4 L 4 -4" opacity="0.85" />
        </g>

        {/* Primary figure — mid-stride, forward lean, short textured hair,
            bag, casual-smart jacket. Uniform-width limb strokes are a
            deliberate part of the flat/geometric style, not a
            simplification shortcut. */}
        <g transform="translate(36 165)">
          {/* trailing (back) leg */}
          <path d="M 20 58 C 16 68 10 76 8 88 C 7 92 9 96 13 98" fill="none" stroke={PANTS} strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="12.5" cy="99.5" rx="5.5" ry="3.5" fill={HAIR} />

          {/* forward (front) leg */}
          <path d="M 32 58 C 38 66 44 74 46 84 C 48 90 46 96 42 100" fill="none" stroke={PANTS} strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="43" cy="101" rx="5.5" ry="3.5" fill={HAIR} />

          {/* bag, worn at the hip */}
          <path d="M 14 27 L 34 58" stroke={BAG} strokeWidth="2.5" fill="none" />
          <rect x="30" y="52" width="13" height="15" rx="2.5" fill={BAG} />

          {/* torso / jacket, slight forward lean */}
          <path
            d="M 12 30 C 12 26 16 26 26 26 C 36 26 40 27 41 32 L 38 58 C 30 62 20 62 14 58 Z"
            fill={JACKET}
          />

          {/* back arm, mostly tucked behind the torso */}
          <path d="M 14 30 C 11 34 9 38 10 43" fill="none" stroke={SKIN} strokeWidth="6" strokeLinecap="round" />

          {/* front arm, swinging forward */}
          <path d="M 34 30 C 40 34 44 38 45 44 C 46 48 48 50 52 52" fill="none" stroke={SKIN} strokeWidth="7" strokeLinecap="round" />

          {/* neck */}
          <rect x="22" y="20" width="8" height="8" fill={SKIN} />

          {/* head */}
          <ellipse cx="26" cy="12" rx="10" ry="11" fill={SKIN} />

          {/* short, textured natural hair */}
          <path
            d="M 16 12 C 15 1 19 -5 26 -5 C 33 -5 37 1 36 12 C 36 6 32 8 26 8 C 20 8 16 6 16 12 Z"
            fill={HAIR}
          />
        </g>
      </svg>
    </div>
  );
}
