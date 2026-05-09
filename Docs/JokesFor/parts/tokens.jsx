// Shared tokens used across artboards.
const T = {
  bg:    '#F8F6F6',
  surf:  '#FAFAFA',
  ink:   '#2E2F2F',
  sub:   '#6B7280',
  mute:  '#52525B',
  line:  '#E9E8E7',
  line2: '#E3E2E2',
  // Accents
  purple:    '#6A1CF6',
  purpleDeep:'#5D00E4',
  purpleSec: '#7C3AED',
  purpleLt:  '#AC8EFF',
  purpleTint:'#F7F0FF',
  lime:      '#CAFD00',
  limeDark:  '#3A4A00',
  amber:     '#FFC965',
  amberDark: '#5F4200',
  // Direction-specific
  ed_paper:  '#F4EFE6',
  ed_ink:    '#1A1814',
  ed_red:    '#D6432B',
  noir_bg:   '#0F0E12',
  noir_card: '#1A1922',
  noir_neon: '#D4FF4F',
  noir_lav:  '#9D7BFF',
};

const FONTS = {
  display:  '"Epilogue", system-ui, sans-serif',
  body:     '"Plus Jakarta Sans", system-ui, sans-serif',
  serif:    '"Fraunces", "Times New Roman", serif',
  edSerif:  '"Instrument Serif", "Times New Roman", serif',
  mono:     '"JetBrains Mono", ui-monospace, monospace',
};

// Tiny helpers
const cls = (...xs) => xs.filter(Boolean).join(' ');

// A subtle striped placeholder (used as image stand-ins)
const Stripe = ({ label, w='100%', h=160, tone='#EEE9DD', stroke='rgba(0,0,0,.06)', radius=16, color='#8A816F' }) => (
  <div style={{
    width: w, height: h, borderRadius: radius, background:
      `repeating-linear-gradient(45deg, ${tone} 0 12px, ${stroke} 12px 13px)`,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily: FONTS.mono, fontSize: 11, color, letterSpacing:'.08em', textTransform:'uppercase'
  }}>{label}</div>
);

// SVG icon set (no external libs). Stroke-based, current-color.
const Icon = ({ name, size=18, stroke=2, ...p }) => {
  const common = { width: size, height: size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth: stroke, strokeLinecap:'round', strokeLinejoin:'round', ...p };
  switch (name) {
    case 'search':    return (<svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>);
    case 'sparkle':   return (<svg {...common}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2"/></svg>);
    case 'bookmark':  return (<svg {...common}><path d="M6 3h12v18l-6-4-6 4z"/></svg>);
    case 'heart':     return (<svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
    case 'share':     return (<svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>);
    case 'menu':      return (<svg {...common}><path d="M3 6h18M3 12h18M3 18h18"/></svg>);
    case 'home':      return (<svg {...common}><path d="m3 11 9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>);
    case 'compass':   return (<svg {...common}><circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6 6-2z"/></svg>);
    case 'lib':       return (<svg {...common}><path d="M2 6h6v14H2zM10 4h4v16h-4zM16 8l5 1-3 12-5-1z"/></svg>);
    case 'plus':      return (<svg {...common}><path d="M12 5v14M5 12h14"/></svg>);
    case 'minus':     return (<svg {...common}><path d="M5 12h14"/></svg>);
    case 'x':         return (<svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>);
    case 'check':     return (<svg {...common}><path d="m5 12 5 5 9-12"/></svg>);
    case 'flame':     return (<svg {...common}><path d="M14 3s1 4-2 6c-2 1.5-4 3-4 6a6 6 0 0 0 12 0c0-3-2-5-3-7-2-3-3-5-3-5z"/><path d="M11 18a3 3 0 0 0 3-3"/></svg>);
    case 'mic':       return (<svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>);
    case 'arrow-r':   return (<svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>);
    case 'arrow-l':   return (<svg {...common}><path d="M19 12H5M11 19l-7-7 7-7"/></svg>);
    case 'chevron-r': return (<svg {...common}><path d="m9 6 6 6-6 6"/></svg>);
    case 'chevron-d': return (<svg {...common}><path d="m6 9 6 6 6-6"/></svg>);
    case 'shuffle':   return (<svg {...common}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>);
    case 'star':      return (<svg {...common}><path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>);
    case 'mood':      return (<svg {...common}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>);
    case 'briefcase': return (<svg {...common}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
    case 'bulb':      return (<svg {...common}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 2 2 2 4h4c0-2 1-3 2-4a6 6 0 0 0-4-10z"/></svg>);
    case 'moon':      return (<svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>);
    case 'cap':       return (<svg {...common}><path d="m2 9 10-5 10 5-10 5zM6 11v6c0 1.5 3 3 6 3s6-1.5 6-3v-6"/></svg>);
    case 'puzzle':    return (<svg {...common}><path d="M9 3a2 2 0 0 1 4 0v2h3v3a2 2 0 0 0 4 0h2v4a2 2 0 0 1 0 4v4h-4a2 2 0 0 0-4 0H9v-3a2 2 0 0 1-4 0H3V11a2 2 0 0 0 0-4V5h4z"/></svg>);
    case 'send':      return (<svg {...common}><path d="m4 12 16-8-6 18-3-7-7-3z"/></svg>);
    case 'clock':     return (<svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case 'gift':      return (<svg {...common}><path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M8 8a2 2 0 1 1 0-4c2 0 4 4 4 4s2-4 4-4a2 2 0 1 1 0 4"/></svg>);
    case 'circle':    return (<svg {...common}><circle cx="12" cy="12" r="10"/></svg>);
    case 'play':      return (<svg {...common}><path d="m6 4 14 8-14 8z"/></svg>);
    case 'pause':     return (<svg {...common}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>);
    case 'lightning': return (<svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>);
    case 'globe':     return (<svg {...common}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a14 14 0 0 1 0 20M12 2a14 14 0 0 0 0 20"/></svg>);
    case 'eye':       return (<svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>);
    case 'down':      return (<svg {...common}><path d="M12 5v14M5 12l7 7 7-7"/></svg>);
    case 'up':        return (<svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>);
    default: return null;
  }
};

Object.assign(window, { T, FONTS, cls, Stripe, Icon });
