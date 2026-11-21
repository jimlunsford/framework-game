// The town map. Flat shapes: a river, a few streets, trees. Places are pins drawn on top.
import { mapIcons } from './places';

export interface MapPin {
  id: string;
  label: string;
  pos: [number, number];
  open: boolean;
  here: boolean;
  minutes: number;
  people: number;
}

const W = 400;
const H = 320;

export function townMap(pins: MapPin[]): string {
  const x = (p: number) => 20 + (p / 100) * (W - 40);
  const y = (p: number) => 24 + (p / 100) * (H - 48);
  const trees = [
    [40, 40], [62, 30], [330, 260], [352, 272], [372, 250], [210, 290], [24, 300], [380, 40], [300, 30],
  ]
    .map(([a, b]) => `<circle cx="${a}" cy="${b}" r="9" class="map-tree"/>`)
    .join('');
  const pinSvg = pins
    .map((p) => {
      const px = x(p.pos[0]);
      const py = y(p.pos[1]);
      const cls = ['pin', p.open ? 'open' : 'closed', p.here ? 'here' : ''].join(' ');
      return `<g class="${cls}" data-place="${p.id}" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})" tabindex="0" role="button" aria-label="${p.label}">
        <circle r="19" class="pin-disc"/>
        ${p.here ? '<circle r="23" class="pin-here"/>' : ''}
        <g class="pin-icon">${mapIcons[p.id] ?? ''}</g>
        ${p.people > 0 ? `<circle cx="15" cy="-15" r="6" class="pin-people"/>` : ''}
      </g>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="town-map" role="group" aria-label="Town map">
  <rect width="${W}" height="${H}" class="map-ground"/>
  <path d="M-10 250 q80 -30 150 -10 t150 -40 t120 -60 v-40 q-60 30 -130 60 t-150 40 t-150 10z" class="map-river"/>
  <path d="M0 150 h400" class="map-road"/>
  <path d="M120 0 v320" class="map-road"/>
  <path d="M260 0 q-10 160 30 320" class="map-road"/>
  <path d="M0 80 q140 20 260 0" class="map-road thin"/>
  <path d="M120 230 h170" class="map-road thin"/>
  ${trees}
  ${pinSvg}
</svg>`;
}
