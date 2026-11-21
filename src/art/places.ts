// Flat vector scenes, drawn as inline SVG. One image per place (home has one per room).
// Shapes use a small fixed palette. Mood comes from light: a sky gradient and a tint
// layer that change with the time of day (see styles.css, .art[data-period]), and light
// sources (windows, lamps, the phone, neon) drawn above the tint so they glow at night.

const W = 400;
const H = 225;

function frame(id: string, body: string, lights: string, opts: { sky?: boolean } = {}): string {
  const sky = opts.sky === false ? '' : `<rect class="sky" x="0" y="0" width="${W}" height="${H}" fill="url(#sky-${id})"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="sky-top"/><stop offset="1" class="sky-bottom"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" class="glow-in"/><stop offset="1" class="glow-out"/>
    </radialGradient>
    <radialGradient id="phone-${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" class="phone-in"/><stop offset="1" class="phone-out"/>
    </radialGradient>
  </defs>
  ${sky}
  ${body}
  <rect class="tint" x="0" y="0" width="${W}" height="${H}"/>
  ${lights}
</svg>`;
}

/** A window that shows the sky behind it. */
function skyWindow(id: string, x: number, y: number, w: number, h: number): string {
  return `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="#f3e7d3"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky-${id})"/>
  <circle class="sun" cx="${x + w * 0.7}" cy="${y + h * 0.35}" r="${Math.min(w, h) * 0.12}"/>
  <rect x="${x + w / 2 - 2}" y="${y}" width="4" height="${h}" fill="#f3e7d3"/>
  <rect x="${x}" y="${y + h / 2 - 2}" width="${w}" height="4" fill="#f3e7d3"/>`;
}

const bedroom = frame(
  'bedroom',
  `<rect x="0" y="0" width="400" height="225" fill="#5d6b8a"/>
  <rect x="0" y="170" width="400" height="55" fill="#8a6a4f"/>
  ${skyWindow('bedroom', 270, 40, 90, 80)}
  <rect x="20" y="120" width="190" height="55" rx="6" fill="#6e4a2e"/>
  <rect x="20" y="95" width="16" height="80" fill="#6e4a2e"/>
  <rect x="28" y="118" width="178" height="32" rx="8" fill="#2f6f73"/>
  <rect x="40" y="108" width="55" height="20" rx="8" fill="#fbf7ef"/>
  <path d="M90 122 q40 -14 116 0 v26 h-116z" fill="#1f4e52"/>
  <rect x="222" y="132" width="40" height="40" fill="#9b6b43"/>
  <rect x="222" y="148" width="40" height="3" fill="#6e4a2e"/>
  <rect x="236" y="104" width="4" height="26" fill="#2a2d34"/>
  <path d="M226 104 h24 l-6 -16 h-12z" fill="#e0a73c"/>`,
  `<ellipse class="phone-halo" cx="250" cy="130" rx="60" ry="30" fill="url(#phone-bedroom)"/>
  <rect class="phone-screen" x="244" y="127" width="14" height="5" rx="1"/>`,
  { sky: false },
);

const kitchen = frame(
  'kitchen',
  `<rect x="0" y="0" width="400" height="225" fill="#e2c9a0"/>
  <rect x="0" y="182" width="400" height="43" fill="#9b6b43"/>
  ${skyWindow('kitchen', 150, 34, 100, 70)}
  <rect x="0" y="130" width="300" height="55" fill="#2f6f73"/>
  <rect x="0" y="124" width="300" height="10" fill="#f3e7d3"/>
  <rect x="170" y="118" width="60" height="8" rx="3" fill="#9aa0a6"/>
  <rect x="198" y="100" width="4" height="20" fill="#9aa0a6"/>
  <rect x="190" y="98" width="20" height="4" fill="#9aa0a6"/>
  <g class="cans">
    <rect x="238" y="106" width="10" height="18" rx="2" fill="#b8463a"/>
    <rect x="250" y="108" width="10" height="16" rx="2" fill="#e0a73c"/>
    <rect x="262" y="104" width="10" height="20" rx="2" fill="#b8463a"/>
  </g>
  <rect x="40" y="96" width="34" height="28" rx="3" fill="#2a2d34"/>
  <rect x="46" y="112" width="12" height="12" fill="#6e4a2e"/>
  <rect x="318" y="50" width="70" height="135" rx="6" fill="#fbf7ef"/>
  <rect x="318" y="100" width="70" height="3" fill="#9aa0a6"/>
  <rect x="378" y="64" width="4" height="26" rx="2" fill="#9aa0a6"/>
  <rect x="378" y="110" width="4" height="40" rx="2" fill="#9aa0a6"/>`,
  `<circle cx="52" cy="104" r="2" fill="#ff7a4a"/>`,
  { sky: false },
);

const living = frame(
  'living',
  `<rect x="0" y="0" width="400" height="225" fill="#8f7a6a"/>
  <rect x="0" y="178" width="400" height="47" fill="#6e4a2e"/>
  <ellipse cx="190" cy="200" rx="150" ry="18" fill="#c8654a" opacity="0.7"/>
  ${skyWindow('living', 40, 40, 80, 70)}
  <rect x="270" y="70" width="110" height="64" rx="4" fill="#2a2d34"/>
  <rect x="276" y="76" width="98" height="52" fill="#1b1d22"/>
  <rect x="300" y="134" width="50" height="40" fill="#6e4a2e"/>
  <rect x="90" y="130" width="170" height="50" rx="10" fill="#c8654a"/>
  <rect x="80" y="122" width="24" height="58" rx="8" fill="#a2472f"/>
  <rect x="246" y="122" width="24" height="58" rx="8" fill="#a2472f"/>
  <rect x="104" y="112" width="142" height="32" rx="8" fill="#a2472f"/>
  <rect x="20" y="120" width="4" height="58" fill="#2a2d34"/>
  <path d="M8 120 h28 l-6 -18 h-16z" fill="#e0a73c"/>`,
  `<ellipse class="lamp-halo" cx="22" cy="118" rx="40" ry="30" fill="url(#glow-living)"/>
  <rect class="tv-screen" x="276" y="76" width="98" height="52"/>`,
  { sky: false },
);

const jobsite = frame(
  'jobsite',
  `<circle class="sun" cx="320" cy="50" r="18"/>
  <path d="M0 150 q100 -30 200 -10 t200 -5 v90 h-400z" class="far"/>
  <rect x="0" y="170" width="400" height="55" fill="#a2825e"/>
  <path d="M90 170 v-70 l70 -40 l70 40 v70" fill="none" stroke="#e0b57a" stroke-width="5"/>
  <g stroke="#e0b57a" stroke-width="4">
    <line x1="110" y1="170" x2="110" y2="92"/><line x1="135" y1="170" x2="135" y2="78"/>
    <line x1="160" y1="170" x2="160" y2="62"/><line x1="185" y1="170" x2="185" y2="78"/>
    <line x1="210" y1="170" x2="210" y2="92"/><line x1="90" y1="132" x2="230" y2="132"/>
  </g>
  <rect x="250" y="150" width="90" height="10" fill="#9b6b43"/>
  <rect x="256" y="160" width="6" height="14" fill="#6e4a2e"/><rect x="328" y="160" width="6" height="14" fill="#6e4a2e"/>
  <rect x="20" y="160" width="60" height="8" fill="#c8a06a"/><rect x="24" y="152" width="52" height="8" fill="#b58a55"/>
  <g>
    <rect x="290" y="176" width="100" height="30" rx="5" fill="#2f6f73"/>
    <path d="M300 176 l12 -18 h40 l10 18z" fill="#2f6f73"/>
    <rect x="316" y="160" width="20" height="14" fill="#cfe8f7" opacity="0.8"/>
    <circle cx="310" cy="208" r="9" fill="#2a2d34"/><circle cx="370" cy="208" r="9" fill="#2a2d34"/>
  </g>`,
  ``,
);

const diner = frame(
  'diner',
  `<rect x="0" y="0" width="400" height="225" fill="#f3e7d3"/>
  ${skyWindow('diner', 20, 30, 200, 80)}
  <rect x="0" y="150" width="400" height="75" fill="#c8654a"/>
  <rect x="0" y="140" width="400" height="14" fill="#fbf7ef"/>
  <g fill="#2a2d34">
    <rect x="40" y="170" width="6" height="40"/><rect x="100" y="170" width="6" height="40"/>
    <rect x="160" y="170" width="6" height="40"/><rect x="220" y="170" width="6" height="40"/>
  </g>
  <g fill="#b8463a">
    <ellipse cx="43" cy="168" rx="16" ry="6"/><ellipse cx="103" cy="168" rx="16" ry="6"/>
    <ellipse cx="163" cy="168" rx="16" ry="6"/><ellipse cx="223" cy="168" rx="16" ry="6"/>
  </g>
  <rect x="260" y="40" width="110" height="80" fill="#c8a06a"/>
  <rect x="266" y="46" width="98" height="68" fill="#d8b47e"/>
  <rect x="274" y="54" width="30" height="22" fill="#fbf7ef" transform="rotate(-4 289 65)"/>
  <rect x="312" y="52" width="40" height="18" fill="#fbf7ef" transform="rotate(3 332 61)"/>
  <rect x="280" y="84" width="38" height="24" fill="#fbf7ef" transform="rotate(2 299 96)"/>
  <rect x="326" y="80" width="30" height="26" fill="#e0a73c" transform="rotate(-3 341 93)"/>
  <rect x="290" y="122" width="30" height="20" rx="3" fill="#2a2d34"/>
  <rect x="296" y="116" width="18" height="8" fill="#2a2d34"/>
  <rect x="120" y="128" width="20" height="14" rx="2" fill="#fbf7ef"/>`,
  `<ellipse class="lamp-halo" cx="120" cy="18" rx="60" ry="30" fill="url(#glow-diner)"/>
  <ellipse class="lamp-halo" cx="300" cy="18" rx="60" ry="30" fill="url(#glow-diner)"/>
  <rect x="116" y="0" width="8" height="16" fill="#2a2d34"/><rect x="296" y="0" width="8" height="16" fill="#2a2d34"/>`,
  { sky: false },
);

const gym = frame(
  'gym',
  `<rect x="0" y="0" width="400" height="225" fill="#9aa0a6"/>
  ${skyWindow('gym', 230, 26, 150, 70)}
  <rect x="0" y="168" width="400" height="57" fill="#2a2d34"/>
  <rect x="40" y="60" width="8" height="110" fill="#1b1d22"/><rect x="120" y="60" width="8" height="110" fill="#1b1d22"/>
  <rect x="30" y="96" width="110" height="5" fill="#c8cdd2"/>
  <rect x="22" y="84" width="10" height="28" rx="2" fill="#b8463a"/><rect x="138" y="84" width="10" height="28" rx="2" fill="#b8463a"/>
  <rect x="180" y="140" width="90" height="10" rx="3" fill="#2f6f73"/>
  <rect x="190" y="150" width="6" height="20" fill="#1b1d22"/><rect x="254" y="150" width="6" height="20" fill="#1b1d22"/>
  <g fill="#1b1d22">
    <rect x="300" y="150" width="80" height="6"/>
    <rect x="304" y="140" width="10" height="10" rx="2"/><rect x="324" y="138" width="12" height="12" rx="2"/>
    <rect x="346" y="136" width="14" height="14" rx="2"/>
  </g>`,
  `<rect class="lamp-strip" x="0" y="0" width="400" height="6"/>`,
  { sky: false },
);

const bar = frame(
  'bar',
  `<rect x="0" y="0" width="400" height="225" fill="#4a3a33"/>
  <rect x="0" y="40" width="400" height="6" fill="#6e4a2e"/>
  <rect x="0" y="86" width="400" height="6" fill="#6e4a2e"/>
  <g>
    <rect x="30" y="58" width="10" height="28" fill="#2f6f73"/><rect x="46" y="52" width="10" height="34" fill="#a2472f"/>
    <rect x="62" y="60" width="10" height="26" fill="#e0a73c"/><rect x="300" y="56" width="10" height="30" fill="#2f6f73"/>
    <rect x="316" y="62" width="10" height="24" fill="#e0a73c"/><rect x="332" y="54" width="10" height="32" fill="#a2472f"/>
    <rect x="348" y="60" width="10" height="26" fill="#2f6f73"/>
  </g>
  <rect x="0" y="140" width="400" height="85" fill="#6e4a2e"/>
  <rect x="0" y="132" width="400" height="12" fill="#9b6b43"/>
  <g fill="#1b1d22"><rect x="60" y="175" width="6" height="40"/><rect x="150" y="175" width="6" height="40"/><rect x="240" y="175" width="6" height="40"/></g>
  <g fill="#2a2d34"><ellipse cx="63" cy="173" rx="16" ry="6"/><ellipse cx="153" cy="173" rx="16" ry="6"/><ellipse cx="243" cy="173" rx="16" ry="6"/></g>
  <rect x="180" y="114" width="14" height="20" rx="2" fill="#e0a73c" opacity="0.9"/>
  <rect x="180" y="110" width="14" height="6" rx="2" fill="#fbf7ef"/>`,
  `<g class="neon">
    <rect x="160" y="10" width="80" height="26" rx="6" fill="none" stroke-width="3"/>
    <path d="M176 30 v-14 h16 v14 M192 20 h6 v6 h-6" fill="none" stroke-width="3"/>
    <circle cx="214" cy="23" r="6" fill="none" stroke-width="3"/>
  </g>
  <ellipse class="lamp-halo" cx="200" cy="120" rx="120" ry="40" fill="url(#glow-bar)"/>`,
  { sky: false },
);

const church = frame(
  'church',
  `<circle class="sun" cx="70" cy="50" r="16"/>
  <path d="M0 160 q120 -30 240 -10 t160 0 v80 h-400z" class="far"/>
  <rect x="0" y="180" width="400" height="45" class="ground"/>
  <rect x="140" y="90" width="140" height="92" fill="#fbf7ef"/>
  <path d="M130 92 l80 -40 l80 40z" fill="#a2472f"/>
  <rect x="190" y="20" width="40" height="72" fill="#fbf7ef"/>
  <path d="M184 22 l26 -22 l26 22z" fill="#a2472f"/>
  <rect x="206" y="34" width="8" height="16" fill="#2a2d34"/>
  <rect x="196" y="130" width="28" height="52" rx="12" fill="#6e4a2e"/>
  <rect x="152" y="110" width="20" height="30" rx="8" fill="#2f6f73"/>
  <rect x="248" y="110" width="20" height="30" rx="8" fill="#2f6f73"/>
  <rect x="284" y="160" width="40" height="22" fill="#9aa0a6"/>
  <rect x="292" y="166" width="24" height="16" fill="#2a2d34"/>
  <circle cx="60" cy="160" r="26" class="tree"/><rect x="57" y="160" width="6" height="24" fill="#6e4a2e"/>
  <circle cx="360" cy="156" r="30" class="tree2"/><rect x="357" y="160" width="6" height="24" fill="#6e4a2e"/>`,
  `<rect class="win-lit" x="292" y="166" width="24" height="16"/>`,
);

const park = frame(
  'park',
  `<circle class="sun" cx="300" cy="44" r="18"/>
  <path d="M0 120 q100 -20 200 0 t200 -6 v111 h-400z" class="far"/>
  <rect x="0" y="130" width="400" height="95" class="ground"/>
  <path d="M0 196 q200 -26 400 0 v29 h-400z" class="water"/>
  <ellipse cx="170" cy="158" rx="140" ry="26" fill="none" stroke="#c8654a" stroke-width="10"/>
  <circle cx="40" cy="112" r="24" class="tree"/><rect x="37" y="112" width="6" height="26" fill="#6e4a2e"/>
  <circle cx="360" cy="110" r="28" class="tree2"/><rect x="357" y="112" width="6" height="28" fill="#6e4a2e"/>
  <circle cx="330" cy="120" r="18" class="tree"/>
  <rect x="300" y="168" width="50" height="6" fill="#9b6b43"/>
  <rect x="300" y="158" width="50" height="5" fill="#9b6b43"/>
  <rect x="304" y="174" width="4" height="10" fill="#2a2d34"/><rect x="342" y="174" width="4" height="10" fill="#2a2d34"/>`,
  `<rect class="post-light" x="282" y="120" width="4" height="64" fill="#2a2d34"/>
  <ellipse class="lamp-halo" cx="284" cy="122" rx="34" ry="26" fill="url(#glow-park)"/>`,
);

const gas = frame(
  'gas',
  `<path d="M0 150 q120 -18 240 -6 t160 0 v81 h-400z" class="far"/>
  <rect x="0" y="176" width="400" height="49" fill="#5a5e66"/>
  <rect x="0" y="196" width="400" height="4" fill="#e0a73c" opacity="0.7"/>
  <rect x="250" y="100" width="130" height="76" fill="#f3e7d3"/>
  <rect x="250" y="94" width="130" height="10" fill="#b8463a"/>
  <rect x="264" y="118" width="60" height="40" fill="#9aa0a6"/>
  <rect x="336" y="124" width="28" height="52" fill="#6e4a2e"/>
  <rect x="30" y="80" width="190" height="16" fill="#fbf7ef"/>
  <rect x="30" y="92" width="190" height="6" fill="#b8463a"/>
  <rect x="60" y="96" width="8" height="80" fill="#9aa0a6"/><rect x="180" y="96" width="8" height="80" fill="#9aa0a6"/>
  <rect x="96" y="140" width="20" height="36" rx="3" fill="#2f6f73"/><rect x="140" y="140" width="20" height="36" rx="3" fill="#2f6f73"/>
  <rect x="100" y="146" width="12" height="8" fill="#cfe8f7"/><rect x="144" y="146" width="12" height="8" fill="#cfe8f7"/>
  <rect x="226" y="40" width="6" height="136" fill="#9aa0a6"/>
  <rect x="206" y="30" width="46" height="26" rx="3" fill="#b8463a"/>`,
  `<rect class="canopy-light" x="30" y="96" width="190" height="4"/>
  <ellipse class="lamp-halo" cx="125" cy="130" rx="110" ry="50" fill="url(#glow-gas)"/>
  <rect class="win-lit" x="264" y="118" width="60" height="40"/>`,
);

const truck = frame(
  'truck',
  `<path d="M0 120 q110 -14 220 -4 t180 2 v40 h-400z" class="far"/>
  <rect x="0" y="146" width="400" height="20" fill="#5a5e66"/>
  <rect x="40" y="128" width="54" height="22" rx="6" fill="#2f6f73"/>
  <rect x="280" y="130" width="60" height="20" rx="6" fill="#a2472f"/>
  <rect x="150" y="70" width="4" height="78" fill="#9aa0a6"/>
  <rect x="138" y="62" width="28" height="10" rx="3" fill="#9aa0a6"/>
  <path d="M0 0 h400 v40 q-200 -22 -400 0z" fill="#2a2d34"/>
  <rect x="0" y="0" width="22" height="225" fill="#2a2d34"/>
  <rect x="378" y="0" width="22" height="225" fill="#2a2d34"/>
  <path d="M0 160 q200 -26 400 0 v65 h-400z" fill="#3a3d45"/>
  <rect x="0" y="196" width="400" height="29" fill="#2a2d34"/>
  <circle cx="110" cy="200" r="46" fill="none" stroke="#1b1d22" stroke-width="12"/>
  <rect x="104" y="196" width="12" height="29" fill="#1b1d22"/>
  <rect x="190" y="170" width="70" height="14" rx="3" fill="#1b1d22"/>`,
  `<ellipse class="lamp-halo" cx="152" cy="68" rx="46" ry="28" fill="url(#glow-truck)"/>
  <ellipse class="phone-halo" cx="300" cy="210" rx="70" ry="34" fill="url(#phone-truck)"/>
  <rect class="phone-screen" x="286" y="204" width="26" height="12" rx="2"/>`,
);

export const placeArt: Record<string, string> = {
  bedroom,
  kitchen,
  living,
  jobsite,
  diner,
  gym,
  bar,
  church,
  park,
  gas,
  truck,
};

/** Small icons for the town map. */
export const mapIcons: Record<string, string> = {
  home: '<path d="M-9 2 l9 -9 l9 9 v8 h-18z" fill="#f3e7d3"/><rect x="-3" y="4" width="6" height="6" fill="#6e4a2e"/>',
  jobsite: '<path d="M-10 9 v-10 l10 -7 l10 7 v10" fill="none" stroke="#e0b57a" stroke-width="2.5"/><line x1="0" y1="-8" x2="0" y2="9" stroke="#e0b57a" stroke-width="2"/>',
  diner: '<rect x="-10" y="-6" width="20" height="14" rx="2" fill="#c8654a"/><rect x="-8" y="-3" width="16" height="5" fill="#cfe8f7"/>',
  gym: '<rect x="-10" y="-2" width="20" height="4" fill="#2a2d34"/><rect x="-12" y="-6" width="4" height="12" fill="#b8463a"/><rect x="8" y="-6" width="4" height="12" fill="#b8463a"/>',
  bar: '<path d="M-6 -7 h12 v14 h-12z" fill="#e0a73c"/><path d="M6 -4 h4 v6 h-4" fill="none" stroke="#e0a73c" stroke-width="2"/><rect x="-6" y="-9" width="12" height="4" fill="#fbf7ef"/>',
  church: '<rect x="-7" y="-2" width="14" height="11" fill="#fbf7ef"/><path d="M-9 -2 l9 -6 l9 6z" fill="#a2472f"/><rect x="-1.5" y="-14" width="3" height="8" fill="#fbf7ef"/>',
  park: '<circle cx="-3" cy="-2" r="7" fill="#6f8658"/><circle cx="5" cy="0" r="5" fill="#8fa98a"/><rect x="-4" y="3" width="2" height="6" fill="#6e4a2e"/>',
  gas: '<rect x="-10" y="-8" width="20" height="4" fill="#b8463a"/><rect x="-4" y="-4" width="8" height="12" rx="1" fill="#2f6f73"/>',
};
