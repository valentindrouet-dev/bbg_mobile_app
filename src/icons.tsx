import type { SVGProps } from 'react'

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
})

export const Back = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>
export const Plus = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
export const Minus = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M5 12h14" /></svg>
export const Share = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></svg>
export const Trash = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
export const Reset = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 4v6h6" /><path d="M5.5 15a7 7 0 101.6-7.3L4 10" /></svg>
export const Save = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
export const Grid = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 9.5h16M4 15h16M9.5 4v16M15 4v16" /></svg>
export const Clock = (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2.2, ...p })}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
export const People = (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2.2, ...p })}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0111 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14a4.5 4.5 0 015 5" /></svg>
export const Pin = (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2.2, ...p })}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
export const Camera = (p: SVGProps<SVGSVGElement>) => <svg {...base({ strokeWidth: 2.3, ...p })}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
