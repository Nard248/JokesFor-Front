// Home screen — the most important. Editorial daily-joke hero + feeds.

const HomeScreen = () => (
  <ScreenShell>
    <div style={{ display:'flex', height:'100%' }}>
      <SideNav active="home"/>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TopSearch/>
        <div style={{ flex: 1, overflowY:'auto', padding: '28px 36px 36px' }}>
          {/* Greeting row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <div style={A.num}>WED · FEB 12 · 9:24 AM</div>
              <h1 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 48, lineHeight: 1, letterSpacing:'-.025em', color: T.ink, marginTop: 8 }}>
                Morning, Lera. <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 600, color: T.purple }}>Day 14.</em>
              </h1>
            </div>
            <div style={{ display:'flex', gap: 8 }}>
              <Pill bg="#fff" fg={T.ink} border={T.line}><Icon name="bookmark" size={12}/> <span style={{ marginLeft: 4 }}>23 saved</span></Pill>
              <Pill bg="#fff" fg={T.ink} border={T.line}><Icon name="flame" size={12}/> <span style={{ marginLeft: 4 }}>14-day streak</span></Pill>
            </div>
          </div>

          {/* Hero JOTD + side rail */}
          <div style={{ marginTop: 24, display:'grid', gridTemplateColumns:'1.6fr 1fr', gap: 20 }}>
            {/* JOTD hero */}
            <div style={{ borderRadius: 28, background: `linear-gradient(135deg, ${T.purple} 0%, ${T.purpleDeep} 100%)`, padding: 36, color:'#fff', position:'relative', overflow:'hidden', minHeight: 360 }}>
              <div style={{ position:'absolute', top: -40, right: -20, fontFamily: FONTS.display, fontWeight: 900, fontSize: 360, lineHeight: .8, opacity: .12, color: T.lime }}>"</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative' }}>
                <Pill bg="rgba(255,255,255,.18)" fg="#fff" border="rgba(255,255,255,.3)"><Icon name="sparkle" size={12}/> <span style={{ marginLeft: 4 }}>Joke of the day</span></Pill>
                <div style={{ ...A.num, color:'rgba(255,255,255,.7)' }}>PICKED FOR YOUR PUNS · WORK BANTER</div>
              </div>
              <div style={{ marginTop: 28, position:'relative' }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 26, lineHeight: 1.25 }}>Why don't scientists trust atoms anymore?</div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, lineHeight: 1.05, letterSpacing:'-.02em', marginTop: 12 }}>
                  Because they <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 600, color: T.lime }}>make up</em> everything.
                </div>
              </div>
              <div style={{ marginTop: 32, display:'flex', gap: 10, alignItems:'center', position:'relative' }}>
                <a href="#screen-joke" style={{ textDecoration:'none' }}><Pill bg={T.lime} fg={T.limeDark} border={T.lime}><Icon name="bookmark" size={12} stroke={2.6}/> <span style={{ marginLeft: 4 }}>Save</span></Pill></a>
                <Pill bg="rgba(255,255,255,.15)" fg="#fff" border="rgba(255,255,255,.3)"><Icon name="share" size={12} stroke={2.4}/> <span style={{ marginLeft: 4 }}>Share</span></Pill>
                <Pill bg="rgba(255,255,255,.15)" fg="#fff" border="rgba(255,255,255,.3)">😂 412</Pill>
                <Pill bg="rgba(255,255,255,.15)" fg="#fff" border="rgba(255,255,255,.3)">🤔 38</Pill>
                <div style={{ marginLeft:'auto', ...A.small, color:'rgba(255,255,255,.7)' }}>by @phys_punny · 2 yrs ago</div>
              </div>
            </div>
            {/* Side rail: streak + mystery */}
            <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
              <div style={{ borderRadius: 24, background: T.lime, padding: 24, position:'relative', overflow:'hidden', flex: 1 }}>
                <div style={A.num}>YOUR RITUAL</div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 64, color: T.limeDark, lineHeight: 1, marginTop: 6, letterSpacing:'-.02em' }}>14<span style={{ fontSize: 22, marginLeft: 4 }}>days</span></div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, color: T.limeDark, marginTop: 6 }}>One more lands you in the Top 10%.</div>
                <div style={{ marginTop: 12, display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4 }}>
                  {Array.from({length:14}).map((_,i)=>(
                    <div key={i} style={{ height: 18, borderRadius: 4, background: T.limeDark, opacity: .9 }}/>
                  ))}
                </div>
              </div>
              <div style={{ borderRadius: 24, background: T.amber, padding: 22, position:'relative', overflow:'hidden' }}>
                <div style={A.num}>MYSTERY BOX</div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: T.amberDark, marginTop: 8, lineHeight: 1.05, letterSpacing:'-.01em' }}>Roll the dice — <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 600 }}>random joke.</em></div>
                <div style={{ marginTop: 14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Pill bg={T.amberDark} fg={T.amber} border={T.amberDark}>🎲 Surprise me</Pill>
                  <div style={{ ...A.small, color: T.amberDark }}>3 left today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vibes carousel */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div>
                <div style={A.num}>BROWSE BY VIBE</div>
                <h2 style={{ ...A.h2, fontSize: 28, marginTop: 6 }}>Pick a mood. We'll do the rest.</h2>
              </div>
              <a href="#" style={{ fontSize: 13, color: T.purple, fontWeight: 700 }}>See all 12 →</a>
            </div>
            <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 12 }}>
              {[
                ['Office','💼', T.purple, '#fff'],
                ['Dad','👨‍🦳', T.amber, T.amberDark],
                ['Dark','🖤', '#1A1820', '#fff'],
                ['Puns','🎯', T.lime, T.limeDark],
                ['Wholesome','🌱', '#E8F1E5', '#2F5C3A'],
                ['Roasts','🔥', '#FFD9CD', '#7A2A14'],
              ].map(([l,e,bg,fg])=>(
                <div key={l} style={{ height: 110, borderRadius: 18, background: bg, color: fg, padding: 14, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <div style={{ fontSize: 28 }}>{e}</div>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 16 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending row */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div>
                <div style={A.num}>TRENDING NOW · UPDATED HOURLY</div>
                <h2 style={{ ...A.h2, fontSize: 28, marginTop: 6 }}>The internet is laughing at these.</h2>
              </div>
              <a href="#" style={{ fontSize: 13, color: T.purple, fontWeight: 700 }}>See full leaderboard →</a>
            </div>
            <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 16 }}>
              {[
                ['#1','+24%','I told my wife she was drawing her eyebrows too high. She seemed surprised.','Observational','832'],
                ['#2','+18%','I used to hate facial hair, but then it grew on me.','Puns','611'],
                ['#3','+11%','Parallel lines have so much in common — it\u2019s a shame they\u2019ll never meet.','Math','504'],
              ].map(([rank,delta,joke,cat,laughs])=>(
                <div key={rank} style={{ borderRadius: 18, background:'#fff', border: `1px solid ${T.line}`, padding: 20, display:'flex', flexDirection:'column', minHeight: 200 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: T.ink }}>{rank}</div>
                    <Tag bg={T.lime} fg={T.limeDark}>{delta}</Tag>
                  </div>
                  <div style={{ ...A.body, fontFamily: FONTS.display, fontWeight: 600, fontSize: 16, color: T.ink, marginTop: 12, flex: 1 }}>{joke}</div>
                  <div style={{ marginTop: 16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <Tag bg={T.purpleTint} fg={T.purple}>{cat}</Tag>
                    <div style={{ display:'flex', gap: 10, fontSize: 12, color: T.sub }}>😂 {laughs} <Icon name="bookmark" size={12}/></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </ScreenShell>
);

window.HomeScreen = HomeScreen;
