// Screen artboards — Direction A applied to the core flow.
// All artboards: 1280 wide. Designed for desktop browsing.

const ScreenShell = ({ children, bg=T.bg }) => (
  <div style={{ width:'100%', height:'100%', background: bg, fontFamily: FONTS.body, color: T.ink, overflow:'hidden', position:'relative' }}>{children}</div>
);

// Side nav present on most app screens
const SideNav = ({ active='home' }) => (
  <aside style={{ width: 240, height:'100%', background:'#FAFAFA', borderRight: `1px solid ${T.line}`, padding: 22, display:'flex', flexDirection:'column', flexShrink: 0 }}>
    <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
      <div style={{ width:32, height:32, borderRadius:8, background: T.ink, color: T.lime, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 900, fontSize: 16 }}>J</div>
      <div style={{ fontFamily: FONTS.display, fontWeight:900, fontSize: 17, color: T.ink, letterSpacing:'-.01em' }}>JokesFor</div>
    </div>
    <nav style={{ marginTop: 28, display:'flex', flexDirection:'column', gap: 4 }}>
      {[
        ['home','Home','home'],
        ['daily','Daily Joke','sparkle'],
        ['search','Discover','compass'],
        ['lib','My Library','lib'],
        ['submit','Submit','plus'],
      ].map(([k,l,ic])=>(
        <a key={k} href={`#screen-${k}`} style={{ display:'flex', alignItems:'center', gap: 10, padding:'10px 12px', borderRadius: 12, background: active===k ? T.purple : 'transparent', color: active===k ? '#fff' : T.mute, fontWeight: active===k ? 700 : 500, fontSize: 14, textDecoration:'none' }}>
          <Icon name={ic} size={16} stroke={active===k? 2.4 : 2}/>{l}
        </a>
      ))}
    </nav>
    <div style={{ marginTop: 'auto', background: T.lime, borderRadius: 18, padding: 14 }}>
      <div style={{ ...A.num, color: T.limeDark }}>14-DAY STREAK</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 18, color: T.limeDark, marginTop: 4 }}>You're on fire 🔥</div>
      <div style={{ ...A.small, color: T.limeDark, marginTop: 4 }}>Read today's joke to keep it.</div>
    </div>
  </aside>
);

const TopSearch = ({ q='' }) => (
  <div style={{ height: 56, display:'flex', alignItems:'center', gap: 12, padding:'0 28px', borderBottom: `1px solid ${T.line}`, background:'#FFFFFF' }}>
    <div style={{ flex: 1, maxWidth: 560, height: 38, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 999, display:'flex', alignItems:'center', gap: 8, padding:'0 16px' }}>
      <Icon name="search" size={16} stroke={2.2}/>
      <span style={{ fontSize: 13, color: q? T.ink : T.sub }}>{q || 'Search by topic, vibe, or occasion…'}</span>
    </div>
    <Pill bg={T.purpleTint} fg={T.purple} border={T.purpleTint}><Icon name="flame" size={12} stroke={2.4}/><span style={{ marginLeft: 4 }}>Hot</span></Pill>
    <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap: 12 }}>
      <Icon name="bookmark" size={16}/>
      <div style={{ width:32, height:32, borderRadius: 999, background: T.amber, color: T.amberDark, fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, display:'flex', alignItems:'center', justifyContent:'center' }}>LM</div>
    </div>
  </div>
);

// ── Login screen ──
const LoginScreen = () => (
  <ScreenShell>
    <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', height:'100%' }}>
      {/* Left brand panel */}
      <div style={{ background: `linear-gradient(160deg, ${T.purple}, ${T.purpleDeep})`, padding: 56, position:'relative', overflow:'hidden', color:'#fff' }}>
        <div style={{ position:'absolute', inset:0, background: `radial-gradient(500px 320px at 90% 110%, rgba(202,253,0,.30), transparent 60%)` }} />
        <div style={{ position:'relative', display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background: '#fff', color: T.purple, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 900 }}>J</div>
          <div style={{ fontFamily: FONTS.display, fontWeight:900, fontSize: 17, letterSpacing:'-.01em' }}>JokesFor</div>
        </div>
        <div style={{ position:'relative', marginTop: 'auto', paddingTop: 100 }}>
          <div style={{ ...A.num, color: 'rgba(255,255,255,.7)' }}>Welcome back</div>
          <h2 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 64, lineHeight: 1, letterSpacing:'-.02em', marginTop: 12 }}>
            Your <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 600, color: T.lime }}>punchlines</em><br/>are waiting.
          </h2>
          <p style={{ marginTop: 16, fontSize: 16, color:'rgba(255,255,255,.85)', maxWidth: 380, lineHeight: 1.55 }}>
            Pick up your 14-day streak, finish that "Work Icebreakers" board, and meet today's joke.
          </p>
        </div>
        <div style={{ position:'relative', marginTop: 32, display:'flex', gap: 16, color:'rgba(255,255,255,.7)', fontSize: 12, fontFamily: FONTS.mono, letterSpacing:'.1em' }}>
          <span>v1.0 · MVP</span><span>·</span><span>FEB 2026</span>
        </div>
      </div>
      {/* Right form */}
      <div style={{ padding: '64px 80px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <Tag bg={T.purpleTint} fg={T.purple}>Sign in</Tag>
        <h3 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 36, color: T.ink, marginTop: 14, lineHeight: 1.05, letterSpacing:'-.01em' }}>Good to see you again.</h3>
        <p style={{ ...A.body, marginTop: 8, fontSize: 14 }}>Use your email — or one of the shortcuts below. We never post on your behalf.</p>
        <div style={{ marginTop: 24, display:'grid', gap: 14 }}>
          <label>
            <div style={{ ...A.num, color: T.ink, marginBottom: 6 }}>EMAIL</div>
            <div style={{ height: 48, border:`1px solid ${T.line}`, borderRadius: 12, background:'#fff', display:'flex', alignItems:'center', padding:'0 14px', fontSize: 14, color: T.ink }}>laughmaster@jokesfor.com</div>
          </label>
          <label>
            <div style={{ ...A.num, color: T.ink, marginBottom: 6 }}>PASSWORD</div>
            <div style={{ height: 48, border:`1px solid ${T.purple}`, borderRadius: 12, background:'#fff', display:'flex', alignItems:'center', padding:'0 14px', fontSize: 14, color: T.ink, boxShadow:`0 0 0 4px ${T.purpleTint}` }}>••••••••••</div>
          </label>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 4 }}>
            <label style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 13, color: T.mute }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, background: T.purple, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><Icon name="check" size={12} stroke={3}/></span> Remember me
            </label>
            <a href="#" style={{ fontSize: 13, color: T.purple, fontWeight: 600 }}>Forgot password?</a>
          </div>
          <button style={{ marginTop: 8, height: 52, background: T.purple, color:'#fff', border:0, borderRadius: 999, fontFamily: FONTS.body, fontWeight: 700, fontSize: 15, cursor:'pointer', boxShadow:`0 10px 24px -8px ${T.purple}` }}>Sign in →</button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap: 12, marginTop: 8 }}>
            <div style={{ height: 1, background: T.line }}/><div style={{ ...A.num, color: T.sub }}>OR</div><div style={{ height: 1, background: T.line }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
            <div style={{ height: 44, border: `1px solid ${T.line}`, borderRadius: 12, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap: 8, fontSize: 13, fontWeight: 600 }}>Continue with Google</div>
            <div style={{ height: 44, border: `1px solid ${T.line}`, borderRadius: 12, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap: 8, fontSize: 13, fontWeight: 600 }}>Continue with Apple</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: T.sub, textAlign:'center' }}>New here? <a href="#screen-onboarding" style={{ color: T.purple, fontWeight: 700 }}>Create an account →</a></div>
        </div>
      </div>
    </div>
  </ScreenShell>
);

window.LoginScreen = LoginScreen;
window.SideNav = SideNav;
window.TopSearch = TopSearch;
window.ScreenShell = ScreenShell;
