// Joke detail screen
const JokeDetailScreen = () => (
  <ScreenShell>
    <div style={{ display:'flex', height:'100%' }}>
      <SideNav active="daily"/>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TopSearch/>
        <div style={{ flex: 1, overflowY:'auto', padding: '28px 36px', display:'grid', gridTemplateColumns:'1.7fr 1fr', gap: 28 }}>
          <div>
            <a href="#screen-home" style={{ fontSize: 13, color: T.sub, textDecoration:'none' }}>← Back to home</a>
            <div style={{ marginTop: 18, display:'flex', gap: 8 }}>
              <Tag bg={T.purpleTint} fg={T.purple}>Puns</Tag>
              <Tag bg={T.lime} fg={T.limeDark}>Work-friendly</Tag>
              <Tag bg="#fff" fg={T.ink} border>5/5 cleanliness</Tag>
            </div>
            <div style={{ marginTop: 24, padding: 36, borderRadius: 28, background:'#fff', border: `1px solid ${T.line}`, position:'relative' }}>
              <div style={{ position:'absolute', top: 18, right: 24, fontFamily: FONTS.display, fontWeight: 900, fontSize: 180, color: T.purpleTint, lineHeight: .8 }}>"</div>
              <div style={{ ...A.num, color: T.purple }}>SETUP</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 32, color: T.ink, lineHeight: 1.2, marginTop: 6 }}>Why don't scientists trust atoms anymore?</div>
              <div style={{ ...A.num, color: T.purple, marginTop: 24 }}>PUNCHLINE</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color: T.ink, lineHeight: 1.05, marginTop: 6, letterSpacing:'-.02em' }}>Because they <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 600, color: T.purple }}>make up</em> everything.</div>
            </div>
            <div style={{ marginTop: 16, display:'flex', gap: 8 }}>
              <Pill bg={T.ink} fg={T.lime} border={T.ink}><Icon name="bookmark" size={12} stroke={2.6}/><span style={{ marginLeft: 4 }}>Save to "Work Icebreakers"</span></Pill>
              <Pill bg="#fff" fg={T.ink} border={T.line}><Icon name="share" size={12}/><span style={{ marginLeft: 4 }}>Share</span></Pill>
              <Pill bg="#fff" fg={T.ink} border={T.line}>📋 Copy</Pill>
              <div style={{ marginLeft:'auto', display:'flex', gap: 6 }}>
                {['😂','🤣','🤔','🙄'].map(e=>(<Pill key={e} bg="#fff" fg={T.ink} border={T.line}>{e}</Pill>))}
              </div>
            </div>

            {/* Reactions / breakdown */}
            <div style={{ marginTop: 36 }}>
              <div style={A.num}>HOW THE INTERNET LAUGHED</div>
              <div style={{ marginTop: 12, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
                {[['😂','412','LOL'],['🤣','188','Crying'],['🤔','38','Hmm'],['🙄','12','Eye-roll']].map(([e,n,l])=>(
                  <div key={l} style={{ padding: 16, background:'#fff', border:`1px solid ${T.line}`, borderRadius: 16 }}>
                    <div style={{ fontSize: 22 }}>{e}</div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: T.ink, marginTop: 4 }}>{n}</div>
                    <div style={{ ...A.small, color: T.sub }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 36 }}>
              <div style={A.num}>WHY YOU GOT THIS ONE</div>
              <div style={{ marginTop: 10, padding: 18, borderRadius: 16, background: T.purpleTint, color: T.purple, fontSize: 14, lineHeight: 1.55 }}>
                Picked because you saved <strong>3 puns</strong> last week, opened JokesFor on Wednesdays at 9 AM <strong>4 weeks running</strong>, and Office Banter is your top vibe. Not your taste? <a href="#" style={{ color: T.purple, fontWeight: 700, textDecoration:'underline' }}>Tune your feed →</a>
              </div>
            </div>
          </div>
          {/* Right rail */}
          <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
            <div style={{ borderRadius: 20, background: T.lime, padding: 22 }}>
              <div style={A.num}>STREAK SAVED</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 32, color: T.limeDark, lineHeight: 1, marginTop: 6 }}>+1 — that's 14.</div>
              <div style={{ ...A.small, color: T.limeDark, marginTop: 6 }}>Tomorrow's joke unlocks at 9:00 AM. We'll send a reminder.</div>
            </div>
            <div style={{ borderRadius: 20, background:'#fff', border: `1px solid ${T.line}`, padding: 22 }}>
              <div style={A.num}>MORE LIKE THIS</div>
              <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 12 }}>
                {[
                  'I told my wife she was drawing her eyebrows too high…',
                  'Parallel lines have so much in common — it\u2019s a shame…',
                  'I used to hate facial hair, but then it grew on me.',
                ].map((t,i)=>(
                  <div key={i} style={{ paddingBottom: 12, borderBottom: i<2? `1px solid ${T.line}`: 0 }}>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 14, color: T.ink, lineHeight: 1.35 }}>{t}</div>
                    <div style={{ marginTop: 6, display:'flex', justifyContent:'space-between', fontSize: 11, color: T.sub }}>
                      <span>Puns</span><span>😂 {500-i*120}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 20, background: T.amber, padding: 22 }}>
              <div style={A.num}>NEXT UP</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: T.amberDark, lineHeight: 1.1, marginTop: 6 }}>Roll a mystery joke?</div>
              <div style={{ ...A.small, color: T.amberDark, marginTop: 4 }}>3 left today.</div>
              <div style={{ marginTop: 10 }}><Pill bg={T.amberDark} fg={T.amber} border={T.amberDark}>🎲 Surprise me</Pill></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ScreenShell>
);

// Search results screen
const SearchScreen = () => (
  <ScreenShell>
    <div style={{ display:'flex', height:'100%' }}>
      <SideNav active="search"/>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TopSearch q='"first day at work"'/>
        <div style={{ flex: 1, overflowY:'auto', padding: '24px 36px 36px', display:'grid', gridTemplateColumns:'240px 1fr', gap: 24 }}>
          {/* Filters */}
          <aside>
            <div style={A.num}>FILTERS</div>
            <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 18 }}>
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 8 }}>Vibe</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                  {['Office','Puns','Wholesome','Dad','Dark','Roasts'].map((v,i)=>(
                    <Pill key={v} bg={i<2?T.purple:'#fff'} fg={i<2?'#fff':T.ink} border={i<2?T.purple:T.line}>{v}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 8 }}>Length</div>
                <div style={{ display:'flex', gap: 6 }}>
                  {[['One-liner', true],['Short', false],['Long', false]].map(([l,on])=>(
                    <Pill key={l} bg={on?T.ink:'#fff'} fg={on?T.lime:T.ink} border={on?T.ink:T.line}>{l}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 8 }}>Cleanliness</div>
                <div style={{ display:'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(n=>(
                    <div key={n} style={{ width: 32, height: 32, borderRadius: 10, background: n<=4?T.lime:'#fff', color: n<=4?T.limeDark:T.sub, border:`1px solid ${n<=4?T.lime:T.line}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 800, fontSize: 13 }}>{n}</div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 8 }}>Era</div>
                <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
                  {['Classic','Modern','This week'].map((l,i)=>(<Pill key={l} bg={i===1?T.amber:'#fff'} fg={i===1?T.amberDark:T.ink} border={i===1?T.amber:T.line}>{l}</Pill>))}
                </div>
              </div>
            </div>
          </aside>
          {/* Results */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div>
                <div style={A.num}>118 RESULTS · SORTED BY RELEVANCE</div>
                <h2 style={{ ...A.h2, fontSize: 28, marginTop: 6 }}>Jokes for <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', color: T.purple, fontWeight: 600 }}>"first day at work"</em></h2>
              </div>
              <Pill bg="#fff" fg={T.ink} border={T.line}>Sort: Relevance ↓</Pill>
            </div>

            {/* Saved suggestion */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: T.lime, color: T.limeDark, fontSize: 13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>You searched this last week. Save this query as a board?</span>
              <Pill bg={T.limeDark} fg={T.lime} border={T.limeDark}>+ Save query</Pill>
            </div>

            {/* Result cards */}
            <div style={{ marginTop: 18, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
              {[
                ['Why was the new employee always calm? Because they had inner Ctrl+Z.','Office · Puns','5/5','😂 312'],
                ['First day at work: I asked HR if punctuality counted. They said "yes, but you\u2019re late."','Office · Observational','4/5','😂 274'],
                ['I introduced myself by saying I was a team player. Mostly because I lose well.','Office · Self-deprecating','5/5','😂 251'],
                ['New job, new me. Same coffee.','Office · One-liner','5/5','😂 220'],
                ['On day one, I learned the printer\u2019s name before my boss\u2019s.','Office · Observational','5/5','😂 198'],
                ['I told them I was a quick learner. I learned where snacks were in 4 minutes.','Office · Wholesome','5/5','😂 184'],
              ].map(([j,c,cl,laughs],i)=>(
                <div key={i} style={{ padding: 18, borderRadius: 16, background:'#fff', border: `1px solid ${T.line}`, display:'flex', flexDirection:'column', gap: 12, minHeight: 160 }}>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 16, color: T.ink, lineHeight: 1.3, flex: 1 }}>{j}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap: 6 }}>
                      <Tag bg={T.purpleTint} fg={T.purple}>{c}</Tag>
                      <Tag bg={T.lime} fg={T.limeDark}>{cl}</Tag>
                    </div>
                    <div style={{ display:'flex', gap: 10, fontSize: 11, color: T.sub, alignItems:'center' }}>
                      <span>{laughs}</span>
                      <Icon name="bookmark" size={13}/>
                    </div>
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

// Library screen
const LibraryScreen = () => (
  <ScreenShell>
    <div style={{ display:'flex', height:'100%' }}>
      <SideNav active="lib"/>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TopSearch/>
        <div style={{ flex: 1, overflowY:'auto', padding: '28px 36px 36px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
            <div>
              <div style={A.num}>YOUR LIBRARY · 47 SAVED · 5 BOARDS</div>
              <h1 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 44, lineHeight: 1, color: T.ink, marginTop: 8, letterSpacing:'-.02em' }}>
                The jokes that <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', color: T.purple, fontWeight: 600 }}>made you.</em>
              </h1>
            </div>
            <div style={{ display:'flex', gap: 8 }}>
              <Pill bg={T.ink} fg={T.lime} border={T.ink}>+ New board</Pill>
              <Pill bg="#fff" fg={T.ink} border={T.line}>Sort: Recently saved</Pill>
            </div>
          </div>

          <div style={{ marginTop: 24, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14 }}>
            {[
              {n:'Work Icebreakers', c:18, bg:T.purple, fg:'#fff', e:'💼'},
              {n:'Dad-Approved', c:12, bg:T.amber, fg:T.amberDark, e:'👨‍🦳'},
              {n:'Saturday Night Roasts', c:9, bg:'#1A1820', fg:'#fff', e:'🔥'},
              {n:'Wholesome Stash', c:6, bg:T.lime, fg:T.limeDark, e:'🌱'},
            ].map(b=>(
              <div key={b.n} style={{ borderRadius: 20, background: b.bg, color: b.fg, padding: 18, minHeight: 150, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div style={{ fontSize: 28 }}>{b.e}</div>
                <div>
                  <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>{b.n}</div>
                  <div style={{ ...A.small, opacity: .8, marginTop: 4 }}>{b.c} jokes</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div>
              <div style={A.num}>RECENTLY SAVED</div>
              <h2 style={{ ...A.h2, fontSize: 24, marginTop: 6 }}>Last 7 days</h2>
            </div>
            <Pill bg="#fff" fg={T.ink} border={T.line}>View as list</Pill>
          </div>
          <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14 }}>
            {[
              ['Why don\u2019t scientists trust atoms anymore? Because they make up everything.','Puns', T.purpleTint, T.purple],
              ['I told my wife she was drawing her eyebrows too high. She seemed surprised.','Observational','#FFF6D6','#7A5A0A'],
              ['New job, new me. Same coffee.','Office · One-liner', T.lime, T.limeDark],
              ['Parallel lines have so much in common — it\u2019s a shame they\u2019ll never meet.','Math','#E5DDFF', T.purple],
              ['I used to hate facial hair, but then it grew on me.','Puns', T.purpleTint, T.purple],
              ['On day one, I learned the printer\u2019s name before my boss\u2019s.','Observational','#FFF6D6','#7A5A0A'],
            ].map(([j,c,bg,fg],i)=>(
              <div key={i} style={{ padding: 18, borderRadius: 16, background:'#fff', border:`1px solid ${T.line}`, minHeight: 150, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: T.ink, lineHeight: 1.3 }}>{j}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <Tag bg={bg} fg={fg}>{c}</Tag>
                  <div style={{ display:'flex', gap: 10, color: T.sub, fontSize: 12 }}>
                    <Icon name="bookmark" size={13} stroke={2.4}/> ✓ Saved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </ScreenShell>
);

window.JokeDetailScreen = JokeDetailScreen;
window.SearchScreen = SearchScreen;
window.LibraryScreen = LibraryScreen;
