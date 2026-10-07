import type { ReactNode, SVGProps } from 'react';

const paths: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></>,
  bag: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" transform="translate(-1 -1) scale(.95)"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
  moon: <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>,
  laptop: <><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20l-2-4H4l-2 4Z"/></>,
  headphones: <><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M5 14h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm14 0h-2v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></>,
  shoe: <><path d="M3 16c2 0 4-1 5-4l2-5 3 3c2 2 4 3 7 3a2 2 0 0 1 2 2v2H3v-1Z"/><path d="M3 19h19"/></>,
  box: <><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5m-9 5v8"/></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z"/></>,
};

type IconName = keyof typeof paths;

export default function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
