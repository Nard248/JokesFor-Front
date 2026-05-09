// Analysis-section artboards: cover, positioning, color psychology,
// typography, Hooked framework, competitive scan, mood board.

// Reusable bits for analysis cards
const A = {
  paper: { background: '#FBFAF7', color: T.ink, fontFamily: FONTS.body },
  ink: { color: T.ink },
  num: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: '.18em', color: T.sub, textTransform: 'uppercase' },
  rule: { height: 1, background: T.line, width: '100%' },
  h1: { fontFamily: FONTS.display, fontWeight: 900, lineHeight: 1, letterSpacing: '-.02em', color: T.ink },
  h2: { fontFamily: FONTS.display, fontWeight: 800, color: T.ink, letterSpacing: '-.01em' },
  body: { fontFamily: FONTS.body, color: T.mute, fontSize: 14, lineHeight: 1.55 },
  small: { fontFamily: FONTS.body, color: T.sub, fontSize: 12, lineHeight: 1.5 },
};

const Tag = ({ children, bg=T.purpleTint, fg=T.purple }) => (
  <span style={{ display:'inline-flex', alignItems:'center', height: 22, padding:'0 10px', borderRadius: 999, background: bg, color: fg, fontSize: 11, fontWeight: 700, letterSpacing:'.04em', textTransform:'uppercase', fontFamily: FONTS.body }}>{children}</span>
);

const Pill = ({ children, fg=T.ink, bg='#fff', border=T.line }) => (
  <span style={{ display:'inline-flex', alignItems:'center', height: 28, padding:'0 12px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 600, fontFamily: FONTS.body, border:`1px solid ${border}` }}>{children}</span>
);

const Numbered = ({ n, title, body, accent=T.purple }) => (
  <div style={{ display:'grid', gridTemplateColumns:'40px 1fr', gap: 14 }}>
    <div style={{ width:32, height:32, borderRadius:999, background: accent, color:'#fff', fontFamily: FONTS.display, fontWeight:800, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>{n}</div>
    <div>
      <div style={{ ...A.h2, fontSize: 17, marginBottom: 4 }}>{title}</div>
      <div style={A.body}>{body}</div>
    </div>
  </div>
);

// Cover artboard
const CoverBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'56px 64px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', inset:0, background: `radial-gradient(800px 400px at 80% -10%, ${T.purpleTint}, transparent 60%), radial-gradient(500px 300px at -10% 110%, rgba(202,253,0,.18), transparent 70%)`, pointerEvents:'none' }} />
    <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background: T.ink, color:T.lime, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 900, fontSize: 18 }}>J</div>
        <div style={{ fontFamily: FONTS.display, fontWeight:900, fontSize: 18, color: T.ink, letterSpacing:'-.01em' }}>JokesFor</div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <Tag>v1.0 · MVP</Tag>
        <Tag bg={T.lime} fg={T.limeDark}>Feb 2026</Tag>
      </div>
    </div>
    <div style={{ position:'relative', zIndex:1 }}>
      <div style={A.num}>Design Brief · Internal</div>
      <h1 style={{ ...A.h1, fontSize: 116, marginTop: 18 }}>
        Who are<br/>
        you{' '}
        <em style={{ fontStyle:'italic', color: T.lime, WebkitTextStroke: `2px ${T.limeDark}`, fontFamily: FONTS.serif, fontWeight: 600 }}>laughing</em><br/>
        for?
      </h1>
      <p style={{ ...A.body, fontSize: 18, marginTop: 22, maxWidth: 720 }}>
        A research-grade case study for the world's first contextual joke search engine — covering psychology of color & form, typographic system, the Hooked behaviour-loop, competitive landscape, and three production-ready visual directions feeding the screen library to the right.
      </p>
    </div>
    <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
      <div style={{ display:'flex', gap: 32 }}>
        <div>
          <div style={A.num}>Sections</div>
          <div style={{ ...A.body, color: T.ink, fontWeight: 600, marginTop: 4 }}>01 · Strategy   02 · Color   03 · Type<br/>04 · Hooked   05 · Competitive   06 · Directions</div>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={A.num}>Audience</div>
        <div style={{ ...A.body, color: T.ink, fontWeight: 600, marginTop: 4 }}>Founders · Product · Eng</div>
      </div>
    </div>
  </div>
);

// 01 · Positioning & Audience
const PositioningBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'48px 56px', display:'grid', gridTemplateRows:'auto 1fr auto', gap: 24 }}>
    <div>
      <div style={A.num}>01 · Strategy</div>
      <div style={{ ...A.h1, fontSize: 56, marginTop: 12 }}>The thesis.</div>
      <div style={{ ...A.body, fontSize: 16, marginTop: 12, maxWidth: 820 }}>
        Reading the BRD and PRD, the brief is not "another joke aggregator." It's the <strong>contextual joke search engine</strong>: type the meeting, the audience, the emotional register, and get a punchline that lands in seconds. Two human truths drive everything that follows.
      </div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 28 }}>
      <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 28, padding: 28 }}>
        <Tag bg={T.purpleTint} fg={T.purple}>Truth 01</Tag>
        <div style={{ ...A.h2, fontSize: 28, marginTop: 12 }}>Humor is high-stakes.</div>
        <div style={{ ...A.body, marginTop: 8 }}>
          A bad joke at the standup costs more than a bad image search. It bruises social capital. Users come <em>under pressure</em> — they need the right joke for <em>this</em> room, not the funniest joke on the internet.
        </div>
        <div style={{ ...A.small, marginTop: 12, fontStyle:'italic' }}>→ Drives: search-first IA, age-rating + tone filters, "Office Proper / Kid-Safe" vibes.</div>
      </div>
      <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 28, padding: 28 }}>
        <Tag bg={T.lime} fg={T.limeDark}>Truth 02</Tag>
        <div style={{ ...A.h2, fontSize: 28, marginTop: 12 }}>Funny is identity.</div>
        <div style={{ ...A.body, marginTop: 8 }}>
          The jokes you save signal who you are. Reddit threads, group chats, dad-text screenshots — all are <em>collections of self</em>. The product wins by making that collection feel like a Pinterest board, not a Notes app.
        </div>
        <div style={{ ...A.small, marginTop: 12, fontStyle:'italic' }}>→ Drives: My Library as hero surface, public-shareable boards, humor-fingerprint onboarding.</div>
      </div>
    </div>
    <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 18, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 24 }}>
      <div>
        <div style={A.num}>Primary persona</div>
        <div style={{ ...A.h2, fontSize: 16, marginTop: 6 }}>The Social Performer</div>
        <div style={A.small}>Manager, parent, teacher, MC. Needs a joke <em>for</em> a moment. 25–55.</div>
      </div>
      <div>
        <div style={A.num}>Secondary</div>
        <div style={{ ...A.h2, fontSize: 16, marginTop: 6 }}>The Collector</div>
        <div style={A.small}>Curates jokes the way others curate songs. Hi-LTV. Drives investment loop.</div>
      </div>
      <div>
        <div style={A.num}>Tertiary</div>
        <div style={{ ...A.h2, fontSize: 16, marginTop: 6 }}>The Submitter</div>
        <div style={A.small}>Writes their own. Network multiplier. Top-Jokester leaderboard.</div>
      </div>
      <div>
        <div style={A.num}>North Star</div>
        <div style={{ ...A.h2, fontSize: 16, marginTop: 6 }}>Jokes Saved / WAU</div>
        <div style={A.small}>Investment + retention proxy. Beats simple "views".</div>
      </div>
    </div>
  </div>
);

window.AnalysisAtoms = { A, Tag, Pill, Numbered };
window.CoverBoard = CoverBoard;
window.PositioningBoard = PositioningBoard;
