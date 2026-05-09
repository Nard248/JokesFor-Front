// Onboarding screen (3-step wizard, single artboard with all 3 visible vertically? No — show step 2 in detail).

const OnboardingScreen = () => {
  const vibes = [
    {label:'Dad jokes', emoji:'👨‍🦳', sel:true, color: T.amber, fg: T.amberDark},
    {label:'Dark humor', emoji:'🖤', sel:false},
    {label:'Office banter', emoji:'💼', sel:true, color: T.purple, fg:'#fff'},
    {label:'Kid-friendly', emoji:'🧸', sel:false},
    {label:'Puns', emoji:'🎯', sel:true, color: T.lime, fg: T.limeDark},
    {label:'Roasts', emoji:'🔥', sel:false},
    {label:'Absurdist', emoji:'🌀', sel:false},
    {label:'One-liners', emoji:'⚡️', sel:true, color: T.purpleTint, fg: T.purple},
    {label:'Observational', emoji:'👀', sel:false},
    {label:'Knock-knock', emoji:'🚪', sel:false},
    {label:'Anti-jokes', emoji:'🪞', sel:false},
    {label:'Wholesome', emoji:'🌱', sel:false},
  ];
  return (
    <ScreenShell>
      <div style={{ height: '100%', display:'grid', gridTemplateColumns:'1.05fr 1fr' }}>
        {/* Left progress + brand */}
        <div style={{ background:'#FBFAF7', padding:'48px 56px', display:'flex', flexDirection:'column', borderRight: `1px solid ${T.line}` }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background: T.ink, color: T.lime, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 900 }}>J</div>
            <div style={{ fontFamily: FONTS.display, fontWeight:900, fontSize: 17, letterSpacing:'-.01em' }}>JokesFor</div>
          </div>
          <div style={{ marginTop: 64 }}>
            <div style={A.num}>Step 02 / 03</div>
            <h1 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 64, lineHeight: .98, letterSpacing:'-.025em', color: T.ink, marginTop: 16 }}>
              What makes <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 600, color: T.purple }}>you</em><br/>laugh?
            </h1>
            <p style={{ ...A.body, marginTop: 18, fontSize: 16, maxWidth: 460 }}>
              Tap at least three. We use this to tune your daily joke and your home feed. You can change these any time in Settings.
            </p>
          </div>
          {/* progress */}
          <div style={{ marginTop: 'auto', display:'flex', flexDirection:'column', gap: 14 }}>
            {[
              ['01','Hello','done'],
              ['02','Your humor','active'],
              ['03','Daily ritual','next'],
            ].map(([n,l,s])=>(
              <div key={n} style={{ display:'flex', alignItems:'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: s==='active'? T.purple : s==='done'? T.lime : '#fff', border: s==='next'? `1px solid ${T.line}` : 0, color: s==='active'?'#fff': s==='done'? T.limeDark : T.sub, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 12 }}>
                  {s==='done' ? <Icon name="check" size={14} stroke={3}/> : n}
                </div>
                <div>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16, color: s==='next'? T.sub : T.ink }}>{l}</div>
                  <div style={{ ...A.small, color: T.sub }}>{s==='done'?'Tell us your name':'Pick your humor types'}{s==='next'?'When do you laugh best?':''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right vibe grid */}
        <div style={{ padding:'48px 56px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Tag bg={T.lime} fg={T.limeDark}>4 of 12 selected · 1 more recommended</Tag>
            <a href="#" style={{ fontSize: 13, color: T.sub, textDecoration:'none' }}>Skip for now →</a>
          </div>
          <div style={{ marginTop: 24, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
            {vibes.map((v,i)=>(
              <div key={i} style={{
                padding:'18px 14px', borderRadius: 18,
                background: v.sel ? v.color : '#fff',
                color: v.sel ? v.fg : T.ink,
                border: v.sel ? `1px solid ${v.color}` : `1px solid ${T.line}`,
                boxShadow: v.sel ? `0 8px 22px -10px ${v.color}` : 'none',
                display:'flex', alignItems:'center', gap: 10, position:'relative'
              }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>{v.emoji}</div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 14 }}>{v.label}</div>
                {v.sel && <div style={{ position:'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 999, background:'#fff', color: v.color, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="check" size={11} stroke={3.2}/></div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, padding: 20, borderRadius: 18, background: T.purpleTint, border: `1px solid ${T.purpleTint}`, display:'flex', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background:'#fff', color: T.purple, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="sparkle" size={18} stroke={2.4}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 15, color: T.purple }}>Live preview of your daily joke</div>
              <div style={{ ...A.body, fontSize: 13, color: T.purple, marginTop: 6 }}>Based on Office banter + Puns + One-liners — tomorrow's pick will be a tight, work-friendly pun. Not it? Change anytime.</div>
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button style={{ height: 44, padding:'0 18px', background:'#fff', color: T.mute, border: `1px solid ${T.line}`, borderRadius: 999, fontFamily: FONTS.body, fontWeight: 600, fontSize: 14, cursor:'pointer' }}>← Back</button>
            <a href="#screen-home" style={{ textDecoration:'none' }}><button style={{ height: 52, padding:'0 28px', background: T.ink, color: T.lime, border: 0, borderRadius: 999, fontFamily: FONTS.body, fontWeight: 700, fontSize: 15, cursor:'pointer' }}>Continue → last step</button></a>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
};

window.OnboardingScreen = OnboardingScreen;
