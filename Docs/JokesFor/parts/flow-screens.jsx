/* JokesFor — Screens */
const { useState: uS, useEffect: uE, useMemo: uM } = React;

// ─────────────────────────── 01 LOGIN ─────────────────────────────
function LoginScreen() {
  const [email, setEmail] = uS("alex@studio.com");
  const [pw, setPw] = uS("");
  return (
    <div className="frame" style={{display:"grid",gridTemplateColumns:"1fr 1.05fr",minHeight:880}}>
      {/* Left — brand canvas */}
      <div style={{background:"linear-gradient(180deg,#5D00E4 0%,#6A1CF6 60%,#7B30FF 100%)",color:"#fff",padding:"48px 56px",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 80%, rgba(202,253,0,.18), transparent 50%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:12}}>
          <Logo size={44} dark/>
          <span style={{fontFamily:"var(--display)",fontWeight:800,fontSize:22}}>JokesFor</span>
        </div>
        <div style={{position:"relative"}}>
          <span className="eyebrow" style={{color:"rgba(255,255,255,.7)"}}>Today's joke · Vol. I · No. 042</span>
          <h1 style={{color:"#fff",fontSize:72,marginTop:18,lineHeight:.98}}>Find the right joke. <em className="wink" style={{color:"#CAFD00"}}>For any moment.</em></h1>
          <div style={{marginTop:36,padding:24,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.14)",borderRadius:18,backdropFilter:"blur(8px)",maxWidth:480}}>
            <span className="eyebrow" style={{color:"rgba(202,253,0,.9)"}}>Setup</span>
            <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:20,marginTop:6,color:"rgba(255,255,255,.9)"}}>Why don't scientists trust atoms anymore?</div>
            <span className="eyebrow" style={{color:"rgba(202,253,0,.9)",marginTop:18,display:"block"}}>Punchline</span>
            <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:32,marginTop:6,color:"#fff",letterSpacing:"-.02em",lineHeight:1.05}}>Because they make up <em className="wink" style={{color:"#CAFD00"}}>everything.</em></div>
          </div>
        </div>
        <div style={{position:"relative",display:"flex",gap:24,fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:"var(--mono)",letterSpacing:".18em",textTransform:"uppercase"}}>
          <span>312K daily readers</span>
          <span>·</span>
          <span>10K+ jokes</span>
          <span>·</span>
          <span>Updated 9:00 AM</span>
        </div>
      </div>
      {/* Right — sign in */}
      <div style={{padding:"72px 88px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <span className="eyebrow">Welcome back</span>
        <h2 style={{marginTop:8,fontSize:48}}>Sign in.</h2>
        <p className="lead" style={{marginTop:8}}>Pick up your streak right where you left off.</p>
        <div style={{marginTop:36,display:"flex",flexDirection:"column",gap:18}}>
          <button className="btn btn-ghost" style={{height:52,justifyContent:"center"}}>{I.google()} Continue with Google</button>
          <div style={{display:"flex",alignItems:"center",gap:14,color:"var(--sub)",fontFamily:"var(--mono)",fontSize:11,letterSpacing:".22em"}}>
            <div style={{flex:1,height:1,background:"var(--line)"}}/>OR<div style={{flex:1,height:1,background:"var(--line)"}}/>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@studio.com"/>
          </div>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <label className="label">Password</label>
              <a style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--purple)",letterSpacing:".18em",textTransform:"uppercase",textDecoration:"none",cursor:"pointer"}}>Forgot</a>
            </div>
            <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="•••••••••"/>
          </div>
          <button className="btn btn-primary" data-go="today" style={{height:52,marginTop:8}}>Sign in {I.arrow()}</button>
          <p style={{textAlign:"center",fontSize:14,color:"var(--mute)",margin:"4px 0 0"}}>New here? <a data-go="register" style={{color:"var(--purple)",fontWeight:700,cursor:"pointer"}}>Create an account →</a></p>
        </div>
        <div style={{marginTop:48,padding:18,background:"#FBFAF7",border:"1px solid var(--line)",borderRadius:14,display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:10,background:"var(--lime)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--limeDark)"}}>{I.flame()}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--display)",fontWeight:800,fontSize:14}}>Keep your 14-day streak alive.</div>
            <div style={{fontSize:12,color:"var(--sub)",marginTop:2}}>You're 1 day from "Top 10% of readers."</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── 02 REGISTER ──────────────────────────
function RegisterScreen() {
  const [step, setStep] = uS(1);
  return (
    <div className="frame" style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",minHeight:880}}>
      <div style={{padding:"72px 88px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <Logo size={36} withText/>
        <span className="eyebrow" style={{marginTop:36}}>Step {step} of 2 · Create account</span>
        <h2 style={{marginTop:8,fontSize:48}}>Build a <em className="wink">funny</em> account.</h2>
        <p className="lead" style={{marginTop:8}}>Two quick questions, then we hand you the keys.</p>
        <div style={{marginTop:32,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{height:4,borderRadius:2,background: step >= 1 ? "var(--purple)" : "var(--line)"}}/>
          <div style={{height:4,borderRadius:2,background: step >= 2 ? "var(--purple)" : "var(--line)"}}/>
        </div>

        {step === 1 ? (
          <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:18}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div><label className="label">First name</label><input className="input" defaultValue="Alex" /></div>
              <div><label className="label">Display handle</label><input className="input" defaultValue="@alexq" /></div>
            </div>
            <div><label className="label">Email</label><input className="input" defaultValue="alex@studio.com"/></div>
            <div><label className="label">Password</label><input className="input" type="password" defaultValue="••••••••"/>
              <div style={{marginTop:8,display:"flex",gap:6}}>
                <div style={{flex:1,height:4,borderRadius:2,background:"var(--purple)"}}/>
                <div style={{flex:1,height:4,borderRadius:2,background:"var(--purple)"}}/>
                <div style={{flex:1,height:4,borderRadius:2,background:"var(--purple)"}}/>
                <div style={{flex:1,height:4,borderRadius:2,background:"var(--line)"}}/>
              </div>
              <p style={{fontSize:12,color:"var(--sub)",marginTop:6}}>Strong. Could be funnier.</p>
            </div>
            <button className="btn btn-primary" onClick={()=>setStep(2)} style={{height:52,marginTop:12}}>Continue {I.arrow()}</button>
          </div>
        ) : (
          <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:18}}>
            <div>
              <label className="label">What do we call you in jokes?</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:6}}>
                {["he/him","she/her","they/them"].map((p,i) => (
                  <button key={p} className="btn btn-ghost" style={{height:44,fontSize:13,...(i===1?{background:"var(--purple)",color:"#fff",border:"0"}:{})}}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Where will you tell these jokes most?</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:6}}>
                {[["💼","Office / Slack"],["🍻","Friends / IRL"],["📲","Group chats"],["🎤","On stage"]].map(([ic,t]) => (
                  <div key={t} style={{padding:14,border:"1px solid var(--line)",borderRadius:12,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:"#fff"}}>
                    <span style={{fontSize:22}}>{ic}</span>
                    <span style={{fontFamily:"var(--display)",fontWeight:700,fontSize:14}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:14,border:"1px solid var(--line)",borderRadius:12,display:"flex",alignItems:"flex-start",gap:12,background:"#FBFAF7"}}>
              <input type="checkbox" defaultChecked style={{marginTop:3}}/>
              <div>
                <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:14}}>Send me the daily joke at 9:00 AM</div>
                <div style={{fontSize:12,color:"var(--sub)",marginTop:2}}>One push, one notification — no spam, ever.</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button className="btn btn-ghost" onClick={()=>setStep(1)} style={{height:52}}>{I.back()} Back</button>
              <button className="btn btn-primary" data-go="onb1" style={{height:52,flex:1}}>Create account &amp; start setup {I.arrow()}</button>
            </div>
          </div>
        )}
        <p style={{fontSize:12,color:"var(--sub)",marginTop:18,textAlign:"center"}}>By signing up you agree to our <a style={{color:"var(--purple)"}}>Terms</a> and <a style={{color:"var(--purple)"}}>Privacy</a>. We never sell your data. We do sell jokes.</p>
        <p style={{textAlign:"center",fontSize:14,color:"var(--mute)",marginTop:14}}>Already in? <a data-go="login" style={{color:"var(--purple)",fontWeight:700,cursor:"pointer"}}>Sign in →</a></p>
      </div>

      {/* Right — sample feed preview */}
      <div style={{background:"#FBFAF7",color:"var(--ink)",padding:"56px 56px",display:"flex",flexDirection:"column",gap:18,position:"relative",overflow:"hidden",borderLeft:"1px solid var(--line)"}}>
        <div style={{position:"absolute",top:-100,right:-100,width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle, var(--purpleTint), transparent 70%)"}}/>
        <span className="eyebrow">What you're signing up for</span>
        <h3 style={{fontSize:32,position:"relative"}}>One ritual. <em className="wink">Three taps.</em></h3>
        <div style={{display:"flex",flexDirection:"column",gap:14,position:"relative"}}>
          {[
            {t:"9:00 AM · Trigger",d:"A push arrives. Today's joke is ready.",c:"var(--purple)",fg:"#fff"},
            {t:"One tap · Action",d:"Open. Read. Save in 8 seconds flat.",c:"var(--lime)",fg:"var(--limeDark)"},
            {t:"Variable reward",d:"You don't know which joke — that's the point.",c:"var(--amber)",fg:"var(--amberDark)"},
            {t:"Streak grows · Investment",d:"Your taste compounds. Tomorrow's joke is more 'you'.",c:"var(--ink)",fg:"var(--lime)"},
          ].map((s,i) => (
            <div key={i} style={{padding:16,background:s.c,color:s.fg,borderRadius:14,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,.2)",color:s.fg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--display)",fontWeight:900,fontSize:14}}>{i+1}</div>
              <div>
                <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".22em",textTransform:"uppercase",opacity:.7}}>{s.t}</div>
                <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:15,marginTop:2}}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── 03/04/05 ONBOARDING ──────────────────
function OnboardingShell({ step, title, eyebrow, sub, next, prev, children, ctaLbl="Continue" }) {
  return (
    <div className="frame" style={{minHeight:880,background:"var(--bg)",display:"flex",flexDirection:"column"}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 32px",borderBottom:"1px solid var(--line)"}}>
        <Logo withText/>
        <div style={{flex:1,maxWidth:400,margin:"0 32px",display:"flex",alignItems:"center",gap:8}}>
          {[1,2,3].map(s => (
            <div key={s} style={{flex:1,height:6,borderRadius:3,background: s <= step ? "var(--purple)" : "var(--line)"}}/>
          ))}
        </div>
        <a data-go="today" style={{color:"var(--mute)",fontFamily:"var(--mono)",fontSize:11,letterSpacing:".18em",textTransform:"uppercase",textDecoration:"none",cursor:"pointer"}}>Skip {I.close()}</a>
      </header>
      <main style={{flex:1,padding:"56px 88px",display:"flex",flexDirection:"column"}}>
        <span className="eyebrow">Step {step} of 3 · {eyebrow}</span>
        <h2 style={{marginTop:8,maxWidth:880}}>{title}</h2>
        <p className="lead" style={{marginTop:14,maxWidth:680}}>{sub}</p>
        <div style={{marginTop:36,flex:1}}>{children}</div>
      </main>
      <footer style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 32px",borderTop:"1px solid var(--line)",background:"#fff"}}>
        {prev ? <a data-go={prev} style={{cursor:"pointer",color:"var(--mute)",fontFamily:"var(--display)",fontWeight:700,fontSize:14,textDecoration:"none"}}>← Back</a> : <span/>}
        <div style={{display:"flex",alignItems:"center",gap:18}}>
          <span style={{fontSize:13,color:"var(--sub)"}}>You can change this anytime.</span>
          <a data-go={next}><button className="btn btn-primary" style={{height:48}}>{ctaLbl} {I.arrow()}</button></a>
        </div>
      </footer>
    </div>
  );
}

function OnbVibesScreen() {
  const [picked, setPicked] = uS(new Set(["office","puns","observ","oneliner"]));
  const toggle = id => setPicked(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  return (
    <OnboardingShell step={1} eyebrow="Vibes" title={<>What's your <em className="wink">flavor</em> of funny?</>} sub="Pick at least 3. We'll tune your daily joke around these — and you can always change them later." next="onb2">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        {VIBES.map(v => {
          const on = picked.has(v.id);
          return (
            <button key={v.id} onClick={()=>toggle(v.id)} style={{
              position:"relative",height:160,borderRadius:18,padding:18,border:"2px solid " + (on ? v.c : "var(--line)"),
              background: on ? v.c : "#fff", color: on ? v.fg : "var(--ink)",
              textAlign:"left",cursor:"pointer",transition:"transform .12s",
              display:"flex",flexDirection:"column",justifyContent:"space-between"
            }}>
              <div style={{fontSize:32}}>{v.ico}</div>
              <div>
                <div style={{fontFamily:"var(--display)",fontWeight:800,fontSize:18}}>{v.label}</div>
                <div style={{fontSize:12,opacity:.75,marginTop:2}}>{v.sub}</div>
              </div>
              {on && <div style={{position:"absolute",top:12,right:12,width:24,height:24,borderRadius:12,background:v.fg,color:v.c,display:"flex",alignItems:"center",justifyContent:"center"}}>{I.check()}</div>}
            </button>
          );
        })}
      </div>
      <div style={{marginTop:24,display:"flex",alignItems:"center",gap:10}}>
        <span className="tag lime">{picked.size} picked</span>
        <span style={{fontSize:13,color:"var(--sub)"}}>Aim for 3–6. Pick more, get more variety.</span>
      </div>
    </OnboardingShell>
  );
}

function OnbFormatsScreen() {
  const [picked, setPicked] = uS(new Set(["setup","oneliner","observ"]));
  const toggle = id => setPicked(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  return (
    <OnboardingShell step={2} eyebrow="Formats" title={<>How do you like your jokes <em className="wink">delivered</em>?</>} sub="Some people love the slow burn. Others want a one-liner and out. Pick whatever you'll actually finish reading." prev="onb1" next="onb3">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {FORMATS.map(f => {
          const on = picked.has(f.id);
          return (
            <button key={f.id} onClick={()=>toggle(f.id)} style={{
              position:"relative",borderRadius:18,padding:24,border:"2px solid " + (on ? "var(--purple)" : "var(--line)"),
              background: on ? "var(--purpleTint)" : "#fff", textAlign:"left",cursor:"pointer",
              display:"flex",flexDirection:"column",gap:14,minHeight:240
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span className="eyebrow" style={{color: on ? "var(--purple)" : "var(--sub)"}}>{f.label}</span>
                {on && <div style={{width:22,height:22,borderRadius:11,background:"var(--purple)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{I.check()}</div>}
              </div>
              <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:18,color: on ? "var(--purple)" : "var(--ink)"}}>{f.sub}</div>
              <div style={{flex:1,padding:14,background:"#fff",border:"1px dashed var(--line)",borderRadius:12,fontFamily:"var(--display)",fontStyle:"italic",fontSize:14,color:"var(--mute)",lineHeight:1.4}}>"{f.demo}"</div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}

function OnbRitualScreen() {
  const [time, setTime] = uS("09:00");
  const [days, setDays] = uS(new Set(["mon","tue","wed","thu","fri"]));
  const toggleD = d => setDays(p => { const n = new Set(p); n.has(d)?n.delete(d):n.add(d); return n; });
  const slots = ["07:00","08:00","09:00","12:00","17:00","21:00"];
  return (
    <OnboardingShell step={3} eyebrow="Ritual" title={<>When should the <em className="wink">joke</em> arrive?</>} sub="One push per day. The most-loved time is 9:00 AM, with morning coffee. Pick whatever fits your routine." prev="onb2" next="today" ctaLbl="Done — show me today's joke">
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:36,alignItems:"start"}}>
        <div>
          <span className="eyebrow">Pick a slot</span>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:10}}>
            {slots.map(s => {
              const on = s === time;
              return (
                <button key={s} onClick={()=>setTime(s)} style={{
                  padding:"16px 12px",borderRadius:14,border:"1px solid " + (on ? "var(--purple)" : "var(--line)"),
                  background: on ? "var(--purple)" : "#fff", color: on ? "#fff" : "var(--ink)",
                  fontFamily:"var(--display)",fontWeight:800,fontSize:24,cursor:"pointer",letterSpacing:"-.01em",textAlign:"left",
                }}>
                  <div>{s}</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",opacity:.7,marginTop:4,fontWeight:500}}>
                    {s==="07:00"?"Pre-coffee":s==="08:00"?"Commute":s==="09:00"?"Office in":s==="12:00"?"Lunch":s==="17:00"?"Wind-down":"Late night"}
                  </div>
                </button>
              );
            })}
          </div>
          <span className="eyebrow" style={{display:"block",marginTop:32}}>Days of the week</span>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            {[["mon","M"],["tue","T"],["wed","W"],["thu","T"],["fri","F"],["sat","S"],["sun","S"]].map(([k,l]) => {
              const on = days.has(k);
              return (
                <button key={k} onClick={()=>toggleD(k)} style={{width:48,height:48,borderRadius:12,border:"1px solid "+(on?"var(--ink)":"var(--line)"),background: on?"var(--ink)":"#fff",color: on?"var(--lime)":"var(--mute)",fontFamily:"var(--display)",fontWeight:800,fontSize:16,cursor:"pointer"}}>{l}</button>
              );
            })}
          </div>
          <div style={{marginTop:24,padding:16,border:"1px solid var(--line)",borderRadius:14,background:"#fff",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:"var(--purpleTint)",color:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center"}}>{I.bell()}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:15}}>Send a streak-saver if I miss the day</div>
              <div style={{fontSize:12,color:"var(--sub)",marginTop:2}}>One gentle nudge at 8 PM if you haven't read.</div>
            </div>
            <div style={{width:36,height:22,borderRadius:11,background:"var(--purple)",position:"relative"}}><div style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:9,background:"#fff"}}/></div>
          </div>
        </div>
        {/* Notification preview */}
        <div>
          <span className="eyebrow">Preview</span>
          <div style={{marginTop:10,padding:24,borderRadius:18,background:"linear-gradient(160deg,#0F0E12,#1F1B2A)",color:"#fff"}}>
            <div className="eyebrow" style={{color:"rgba(255,255,255,.6)"}}>JOKESFOR · {time}</div>
            <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:18,marginTop:6,lineHeight:1.3}}>Today's joke is ready. Day 1 — let's begin it.</div>
            <div style={{marginTop:12,padding:12,background:"rgba(255,255,255,.06)",borderRadius:10,fontSize:12,color:"rgba(255,255,255,.7)"}}>Tap to open · 1 swipe to save · ~8 sec total</div>
          </div>
          <div style={{marginTop:18,padding:18,borderRadius:14,background:"var(--lime)",color:"var(--limeDark)"}}>
            <div className="eyebrow" style={{color:"var(--limeDark)"}}>Streak forecast</div>
            <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:36,marginTop:4}}>14 days</div>
            <div style={{fontSize:13,marginTop:4}}>Average for someone with your settings.</div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

// ─────────────────────────── 06 TODAY ─────────────────────────────
function TopShell({ active, children }) {
  return (
    <div className="frame" style={{minHeight:880,background:"var(--bg)"}}>
      <header className="app-header">
        <div style={{display:"flex",alignItems:"center",gap:36}}>
          <Logo withText/>
          <nav className="app-nav">
            {[["today","Today"],["explore","Explore"],["search","Search"],["library","Library"]].map(([k,l]) => (
              <a key={k} data-go={k} className={active===k?"is-active":""}>{l}</a>
            ))}
          </nav>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <StreakChip days={14}/>
          <div style={{position:"relative"}}>
            <button className="btn btn-ghost" style={{height:40,width:40,padding:0,borderRadius:12}}>{I.bell()}</button>
            <div style={{position:"absolute",top:6,right:6,width:8,height:8,borderRadius:4,background:"var(--purple)"}}/>
          </div>
          <div style={{width:40,height:40,borderRadius:12,background:"var(--purple)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--display)",fontWeight:800}}>A</div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function TodayScreen() {
  const [revealed, setRevealed] = uS(false);
  const [saved, setSaved] = uS(false);
  const today = JOKES[0];

  return (
    <TopShell active="today">
      <div style={{padding:"40px 56px"}}>
        {/* Hero strip */}
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
          <div>
            <span className="eyebrow">Wednesday · Feb 12 · Vol. I · No. 042</span>
            <h2 style={{marginTop:8,fontSize:44}}>Good morning, <em className="wink">Alex.</em></h2>
            <p className="lead" style={{marginTop:6}}>One joke today. Two if you finish yesterday's saved set.</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost" style={{height:40,fontSize:13}}>{I.history()} Yesterday</button>
            <button className="btn btn-ghost" style={{height:40,fontSize:13}}>{I.dice()} Mystery box <span className="tag lime" style={{marginLeft:6}}>3 LEFT</span></button>
          </div>
        </div>

        {/* Main grid */}
        <div style={{marginTop:32,display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:24,alignItems:"start"}}>
          {/* JOTD hero card */}
          <div style={{background:"linear-gradient(160deg,#FFFFFF 0%,#FBFAF7 100%)",border:"1px solid var(--line)",borderRadius:24,padding:40,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:"radial-gradient(circle, var(--purpleTint), transparent 70%)"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
              <span className="tag">Joke of the day · Setup → Punchline</span>
              <span className="eyebrow">Nerd · Pun</span>
            </div>
            <div style={{marginTop:32,position:"relative"}}>
              <span className="eyebrow" style={{color:"var(--purple)"}}>Setup</span>
              <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:30,color:"var(--ink)",lineHeight:1.25,marginTop:8,maxWidth:640}}>{today.setup}</div>
              <span className="eyebrow" style={{color:"var(--purple)",marginTop:32,display:"block"}}>Punchline</span>
              <div onClick={()=>setRevealed(true)} style={{
                cursor: revealed ? "default" : "pointer",
                marginTop:8,fontFamily:"var(--display)",fontWeight:900,fontSize:64,letterSpacing:"-.025em",
                color:"var(--ink)",lineHeight:1.02,
                filter: revealed ? "none" : "blur(18px)",
                transition:"filter .55s cubic-bezier(.2,.6,.2,1)",userSelect: revealed?"auto":"none"
              }}>Because they make up <em className="wink">everything.</em></div>
              {!revealed && (
                <button onClick={()=>setRevealed(true)} className="btn" style={{marginTop:24,background:"var(--ink)",color:"var(--lime)",height:52}}>
                  {I.sparkle()} Reveal punchline
                </button>
              )}
            </div>
            <div style={{marginTop:32,paddingTop:24,borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
              <div style={{display:"flex",gap:18,fontSize:13,color:"var(--mute)"}}>
                <span>😂 612 laughs</span>
                <span>💾 4.1K saves</span>
                <span>🔁 312 retold</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setSaved(s=>!s)} className="btn" style={{height:44,background: saved?"var(--ink)":"transparent",color:saved?"var(--lime)":"var(--ink)",border:saved?"0":"1px solid var(--line)"}}>{saved?I.bookmark():I.bookmarkOutline()} {saved?"Saved":"Save"}</button>
                <button className="btn btn-ghost" style={{height:44}}>{I.share()} Share</button>
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            {/* Streak rail */}
            <div style={{padding:24,borderRadius:18,background:"var(--lime)",color:"var(--limeDark)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span className="eyebrow" style={{color:"var(--limeDark)"}}>Streak</span>
                <span style={{fontFamily:"var(--mono)",fontSize:11,letterSpacing:".18em"}}>FEB 12</span>
              </div>
              <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:64,lineHeight:1,marginTop:8}}>14 <span style={{fontSize:20}}>days</span></div>
              <div style={{marginTop:14,display:"grid",gridTemplateColumns:"repeat(14,1fr)",gap:3}}>
                {Array.from({length:14}).map((_,i) => (
                  <div key={i} style={{height:14,borderRadius:3,background: i < 13 ? "var(--limeDark)" : "transparent",border: i < 13 ? "0" : "1px dashed var(--limeDark)"}}/>
                ))}
              </div>
              <div style={{marginTop:14,fontSize:13,fontFamily:"var(--display)",fontWeight:600}}>One more lands you in the <em className="wink" style={{color:"var(--limeDark)"}}>Top 10%.</em></div>
            </div>

            {/* Mystery box */}
            <div style={{padding:24,borderRadius:18,background:"var(--amber)",color:"var(--amberDark)",position:"relative",overflow:"hidden"}}>
              <span className="eyebrow" style={{color:"var(--amberDark)"}}>Mystery box · 3 left today</span>
              <h3 style={{marginTop:8,color:"var(--amberDark)",fontSize:28}}>Roll for a <em className="wink" style={{color:"var(--amberDark)"}}>random</em> joke.</h3>
              <p style={{fontSize:13,marginTop:6,marginBottom:14,color:"var(--amberDark)",opacity:.8}}>Pulled from your vibes. Capped daily — that's the point.</p>
              <button className="btn" style={{background:"var(--amberDark)",color:"var(--amber)",height:44}}>{I.dice()} Roll</button>
            </div>

            {/* Tomorrow teaser */}
            <div style={{padding:24,borderRadius:18,background:"#0F0E12",color:"#fff"}}>
              <span className="eyebrow" style={{color:"rgba(255,255,255,.6)"}}>Tomorrow · 9:00 AM</span>
              <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:18,marginTop:10,lineHeight:1.4,filter:"blur(8px)",color:"rgba(255,255,255,.85)"}}>A man walks into a library and asks for a book on…</div>
              <div style={{marginTop:14,fontSize:12,color:"rgba(255,255,255,.5)"}}>Format: <span style={{color:"var(--lime)"}}>Story · 2-min read</span></div>
            </div>
          </div>
        </div>

        {/* ── Continue yesterday's set ── */}
        <div style={{marginTop:56,padding:"22px 28px",background:"var(--purpleTint)",border:"1px solid #E8DAFF",borderRadius:18,display:"flex",alignItems:"center",gap:24}}>
          <div style={{width:54,height:54,borderRadius:14,background:"var(--purple)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--display)",fontWeight:900,fontSize:22}}>2/4</div>
          <div style={{flex:1}}>
            <span className="eyebrow" style={{color:"var(--purple)"}}>You stopped mid-sip · Yesterday</span>
            <div style={{fontFamily:"var(--display)",fontWeight:800,fontSize:20,marginTop:4}}>Finish the <em className="wink">"Office Proper"</em> set — 2 jokes left.</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost" style={{height:42,fontSize:13}}>{I.history()} Skip</button>
            <button className="btn btn-primary" style={{height:42,fontSize:13}}>Continue {I.arrow()}</button>
          </div>
        </div>

        {/* ── For your vibes today (3-up) ── */}
        <div style={{marginTop:48,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
          <div>
            <span className="eyebrow">Hand-picked from your vibes</span>
            <h3 style={{fontSize:32,marginTop:6}}>Three you'll <em className="wink">probably</em> save.</h3>
          </div>
          <a data-go="explore" style={{cursor:"pointer",color:"var(--purple)",fontFamily:"var(--display)",fontWeight:700,fontSize:14,textDecoration:"none"}}>See more in Explore →</a>
        </div>
        <div style={{marginTop:18,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
          {JOKES.slice(1,4).map(j => <JokeCard key={j.id} joke={j}/>)}
        </div>

        {/* ── 7-day archive · newspaper strip ── */}
        <div style={{marginTop:56}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",borderBottom:"2px solid var(--ink)",paddingBottom:12}}>
            <div>
              <span className="eyebrow">The Week in Punchlines · Vol. I · Nos. 035–041</span>
              <h3 style={{fontSize:28,marginTop:4,fontFamily:"var(--serif)",fontStyle:"italic"}}>Last seven mornings.</h3>
            </div>
            <span className="tag">7-day archive</span>
          </div>
          <div style={{marginTop:18,display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0,borderTop:"1px solid var(--line)"}}>
            {[
              {d:"Wed",n:"041",t:"On scientists trusting atoms.",v:"Nerd",bg:"transparent"},
              {d:"Tue",n:"040",t:"On eyebrows drawn too high.",v:"One-liner",bg:"var(--limeTint)"},
              {d:"Mon",n:"039",t:"On adulthood as email reply chain.",v:"Observ.",bg:"transparent"},
              {d:"Sun",n:"038",t:"On hippos vs. Zippos.",v:"Pun",bg:"var(--purpleTint)"},
              {d:"Sat",n:"037",t:"On facial hair growing on you.",v:"Pun",bg:"transparent"},
              {d:"Fri",n:"036",t:"On the outstanding scarecrow.",v:"Dad",bg:"var(--amberTint)"},
              {d:"Thu",n:"035",t:"On the chicken & the road.",v:"Anti",bg:"transparent"},
            ].map((d,i)=>(
              <div key={i} style={{padding:"18px 14px",borderRight: i<6 ? "1px solid var(--line)" : "0",background:d.bg,minHeight:160,display:"flex",flexDirection:"column",justifyContent:"space-between",cursor:"pointer"}}>
                <div>
                  <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".2em",color:"var(--mute)"}}>{d.d.toUpperCase()} · No. {d.n}</div>
                  <div style={{fontFamily:"var(--serif)",fontStyle:"italic",fontSize:15,marginTop:10,lineHeight:1.3,color:"var(--ink)"}}>"{d.t}"</div>
                </div>
                <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:"var(--mute)",marginTop:14}}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mixed-format showcase (organized chaos row) ── */}
        <div style={{marginTop:56}}>
          <span className="eyebrow">By format · Try a different shape today</span>
          <h3 style={{fontSize:32,marginTop:6}}>Same library. <em className="wink">Different rhythm.</em></h3>
          <div style={{marginTop:22,display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr",gap:18,alignItems:"start"}}>
            <JokeCard joke={JOKES.find(j=>j.id===2)} big/>
            <JokeCard joke={JOKES.find(j=>j.id===10)}/>
            <JokeCard joke={JOKES.find(j=>j.id===7)}/>
          </div>
        </div>

        {/* ── Top jokesters + Weekly special ── */}
        <div style={{marginTop:56,display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:24}}>
          {/* Top jokesters */}
          <div style={{padding:28,background:"#fff",border:"1px solid var(--line)",borderRadius:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <div>
                <span className="eyebrow">Top jokesters · This week</span>
                <h4 style={{fontSize:22,marginTop:4}}>The five carrying us.</h4>
              </div>
              <span style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",color:"var(--mute)"}}>FEB 06 → 12</span>
            </div>
            <div style={{marginTop:18,display:"flex",flexDirection:"column"}}>
              {[
                {n:"Maya Okonkwo",h:"@mayatypes",p:"1,204",r:1,d:"Office · Observ."},
                {n:"Dev Patel",h:"@devpuns",p:"982",r:2,d:"Pun · Dad"},
                {n:"Sara Rumi",h:"@srumi",p:"844",r:3,d:"Wholesome"},
                {n:"Kai Bennett",h:"@kaib",p:"712",r:4,d:"Anti · Surreal"},
                {n:"Lena Park",h:"@lenap",p:"611",r:5,d:"One-liners"},
              ].map((j,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom: i<4 ? "1px solid var(--line)" : "0"}}>
                  <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:22,color: i===0 ? "var(--purple)" : "var(--mute)",width:32}}>#{j.r}</div>
                  <div style={{width:38,height:38,borderRadius:"50%",background: i===0?"var(--purple)":i===1?"var(--lime)":i===2?"var(--amber)":"var(--ink)",color: i===1?"var(--limeDark)":i===2?"var(--amberDark)":"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--display)",fontWeight:900,fontSize:13}}>{j.n.split(" ").map(s=>s[0]).join("")}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:14}}>{j.n}</div>
                    <div style={{fontSize:11,color:"var(--mute)",fontFamily:"var(--mono)",letterSpacing:".06em"}}>{j.h} · {j.d}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"var(--display)",fontWeight:800,fontSize:14}}>{j.p}</div>
                    <div style={{fontSize:10,color:"var(--mute)",fontFamily:"var(--mono)",letterSpacing:".18em",textTransform:"uppercase"}}>punchlines</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly special — wide horizontal */}
          <div style={{borderRadius:22,overflow:"hidden",background:"linear-gradient(160deg,#FFE6B5 0%,#FFC965 100%)",color:"var(--amberDark)",position:"relative",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
            <div style={{padding:36,display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",zIndex:1}}>
              <div>
                <span className="tag" style={{background:"var(--amberDark)",color:"var(--amber)"}}>Weekly Special · Curated</span>
                <h3 style={{marginTop:14,color:"var(--amberDark)",fontSize:36,lineHeight:1.05}}>Back-to-school <em className="wink" style={{color:"var(--amberDark)"}}>survival kit.</em></h3>
                <p style={{marginTop:10,fontSize:14,color:"var(--amberDark)",opacity:.85,maxWidth:280}}>45 jokes engineered to win over a Monday-morning classroom. Tested on actual teenagers.</p>
              </div>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <button className="btn" style={{height:44,background:"var(--amberDark)",color:"var(--amber)"}}>Read collection {I.arrow()}</button>
                <button className="btn btn-ghost" style={{height:44,background:"transparent",borderColor:"var(--amberDark)",color:"var(--amberDark)"}}>{I.bookmarkOutline()} Save list</button>
              </div>
            </div>
            <div style={{position:"relative",padding:24,display:"flex",flexDirection:"column",gap:8,justifyContent:"center"}}>
              <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.25)"}}/>
              {["Why don't teachers ever get bored?","I asked my pencil for advice…","First day of class, the principal said…","The school clock has only two hands.","Geometry teacher's favorite season?"].map((t,i)=>(
                <div key={i} style={{position:"relative",padding:"10px 14px",background:"rgba(255,255,255,.55)",border:"1px solid rgba(95,66,0,.18)",borderRadius:12,fontFamily:"var(--serif)",fontStyle:"italic",fontSize:13,color:"var(--amberDark)",backdropFilter:"blur(4px)"}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:".2em",opacity:.6,marginRight:8}}>{String(i+1).padStart(2,"0")}</span>
                  "{t}"
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats + Test on a friend ── */}
        <div style={{marginTop:24,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:24}}>
          {/* How you've been laughing */}
          <div style={{padding:28,background:"var(--ink)",color:"#fff",borderRadius:22,position:"relative",overflow:"hidden"}}>
            <span className="eyebrow" style={{color:"var(--lime)"}}>How you've been laughing</span>
            <h4 style={{color:"#fff",marginTop:6,fontSize:22}}>This month, in numbers.</h4>
            <div style={{marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div><div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:36,color:"var(--lime)",lineHeight:1}}>168</div><div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",color:"rgba(255,255,255,.5)",marginTop:4}}>JOKES READ</div></div>
              <div><div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:36,color:"#fff",lineHeight:1}}>42</div><div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",color:"rgba(255,255,255,.5)",marginTop:4}}>SAVED</div></div>
              <div><div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:36,color:"var(--amber)",lineHeight:1}}>9 AM</div><div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",color:"rgba(255,255,255,.5)",marginTop:4}}>PEAK READ</div></div>
              <div><div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:36,color:"#fff",lineHeight:1}}>Pun</div><div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",color:"rgba(255,255,255,.5)",marginTop:4}}>TOP VIBE</div></div>
            </div>
            <div style={{marginTop:20,display:"flex",gap:3,alignItems:"flex-end",height:40}}>
              {[12,18,8,22,14,28,16,24,20,30,18,26,14,32,22,28,18,34,26,32,22,38,28,36,30,32,40,28].map((h,i)=>(
                <div key={i} style={{flex:1,height:`${h*100/40}%`,background: i>=21 ? "var(--lime)" : "rgba(202,253,0,.3)",borderRadius:1}}/>
              ))}
            </div>
            <div style={{marginTop:6,fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",color:"rgba(255,255,255,.4)"}}>JAN 16 ────────── FEB 12</div>
          </div>

          {/* Themes you laugh at most */}
          <div style={{padding:28,background:"#fff",border:"1px solid var(--line)",borderRadius:22}}>
            <span className="eyebrow">Themes you laugh at most</span>
            <h4 style={{marginTop:6,fontSize:22}}>Your taste, in pills.</h4>
            <div style={{marginTop:18,display:"flex",flexWrap:"wrap",gap:8}}>
              {[
                {t:"Office life",s:42,big:true},
                {t:"Puns",s:38,big:true},
                {t:"Wholesome",s:24},
                {t:"One-liners",s:21,big:true},
                {t:"Dad",s:18},
                {t:"Surreal",s:14},
                {t:"Anti-joke",s:11},
                {t:"Tech",s:9},
                {t:"Coffee",s:7},
                {t:"Mondays",s:6},
                {t:"Email",s:5},
              ].map((p,i)=>(
                <span key={i} className="pill" style={{height: p.big?38:30,fontSize: p.big?14:12,padding: p.big?"0 16px":"0 12px",background: p.big? (i%3===0?"var(--purple)":i%3===1?"var(--lime)":"var(--amber)") : "#FBFAF7",color: p.big? (i%3===1?"var(--limeDark)":i%3===2?"var(--amberDark)":"#fff") : "var(--ink)",borderColor: p.big? "transparent" : "var(--line)",fontWeight:p.big?800:500}}>{p.t} <span style={{opacity:.7,marginLeft:6,fontFamily:"var(--mono)",fontSize:10}}>{p.s}</span></span>
              ))}
            </div>
            <button className="btn btn-ghost" style={{marginTop:18,height:40,fontSize:13,width:"100%"}}>See full taste profile {I.arrow()}</button>
          </div>

          {/* Test on a friend */}
          <div style={{padding:28,background:"var(--purple)",color:"#fff",borderRadius:22,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
            <div style={{position:"absolute",bottom:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"rgba(202,253,0,.2)"}}/>
            <div style={{position:"relative"}}>
              <span className="eyebrow" style={{color:"var(--lime)"}}>Test it on a friend</span>
              <h4 style={{color:"#fff",marginTop:6,fontSize:22}}>Did today's land?</h4>
              <p style={{fontSize:13,marginTop:8,color:"rgba(255,255,255,.8)",maxWidth:240}}>Share the punchline. We'll tell you if they laughed (or lied).</p>
            </div>
            <div style={{position:"relative",marginTop:18,padding:14,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.18)",borderRadius:14,backdropFilter:"blur(8px)"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".2em",color:"rgba(255,255,255,.5)"}}>TO · SAM</div>
              <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14,marginTop:6,lineHeight:1.4}}>"Why don't scientists trust atoms? Because they make up everything." 😂</div>
              <div style={{marginTop:10,display:"flex",gap:6}}>
                <span className="tag" style={{background:"var(--lime)",color:"var(--limeDark)",borderColor:"transparent"}}>😂 Laughed</span>
                <span className="tag" style={{background:"rgba(255,255,255,.15)",color:"#fff",borderColor:"transparent"}}>🙄 Lied</span>
              </div>
            </div>
            <button className="btn" style={{position:"relative",marginTop:14,height:44,background:"var(--lime)",color:"var(--limeDark)"}}>{I.share()} Share today's joke</button>
          </div>
        </div>

        {/* ── Pull quote / brand footer ── */}
        <div style={{marginTop:56,padding:"48px 56px",borderRadius:24,background:"#FBFAF7",border:"1px solid var(--line)",display:"flex",alignItems:"center",gap:48,position:"relative",overflow:"hidden"}}>
          <div style={{fontFamily:"var(--serif)",fontStyle:"italic",fontSize:96,lineHeight:.6,color:"var(--purple)",opacity:.4}}>"</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--serif)",fontStyle:"italic",fontSize:28,lineHeight:1.3,color:"var(--ink)",letterSpacing:"-.005em"}}>Comedy is the gentlest way of telling the truth. JokesFor is a calendar of small truths — <em style={{color:"var(--purple)"}}>one per morning,</em> dressed as punchlines.</div>
            <div style={{marginTop:18,fontFamily:"var(--mono)",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--mute)"}}>The JokesFor Editors · Vol. I · No. 042</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:180}}>
            <span className="eyebrow">Tomorrow at 9:00 AM</span>
            <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:48,color:"var(--ink)",lineHeight:.95}}>15h<br/><span style={{color:"var(--purple)"}}>22m</span></div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:".2em",color:"var(--mute)"}}>UNTIL THE NEXT ONE</div>
          </div>
        </div>
      </div>
    </TopShell>
  );
}

// ─────────────────────────── 07 EXPLORE ───────────────────────────
// Three-axis chip rail filter + format-aware masonry results.
function FilterChip({ active, onClick, children, color="var(--ink)" }) {
  return (
    <button onClick={onClick} className="pill" style={{cursor:"pointer",height:34,padding:"0 14px",fontSize:13,whiteSpace:"nowrap",...(active?{background:color,color: color==="var(--lime)"?"var(--limeDark)":color==="var(--amber)"?"var(--amberDark)":"#fff",borderColor:color}:{})}}>{children}</button>
  );
}

function toggle(arr, v) { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]; }

function ExploreScreen() {
  const [fmts, setFmts] = uS([]);
  const [themes, setThemes] = uS([]);
  const [cats, setCats] = uS([]);
  const filtered = uM(() => JOKES.filter(j =>
    (!fmts.length   || fmts.includes(j.fmt)) &&
    (!themes.length || themes.includes(j.theme)) &&
    (!cats.length   || cats.includes(j.cat))
  ), [fmts, themes, cats]);
  const activeCount = fmts.length + themes.length + cats.length;
  const clearAll = () => { setFmts([]); setThemes([]); setCats([]); };

  return (
    <TopShell active="explore">
      <div style={{padding:"40px 56px"}}>
        {/* Hero */}
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:32,alignItems:"end"}}>
          <div>
            <span className="eyebrow">Explore · 10,432 jokes</span>
            <h2 style={{marginTop:8,fontSize:60}}>Find a joke <em className="wink">for any moment.</em></h2>
            <p className="lead" style={{marginTop:14,maxWidth:520}}>Filter by format (how it lands), theme (what it's about), and category (how it feels). Stack as many as you like.</p>
          </div>
          <div onClick={()=>window.__goto && window.__goto("search")} style={{padding:14,background:"#fff",border:"1px solid var(--line)",borderRadius:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"var(--purpleTint)",color:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center"}}>{I.search()}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:14}}>Or describe the moment…</div>
              <div style={{fontSize:12,color:"var(--sub)"}}>Try "first day at work" or "wedding toast"</div>
            </div>
            <span className="tag">⌘K</span>
          </div>
        </div>

        {/* ── Three-axis chip rails ── */}
        <div style={{marginTop:36,padding:"24px 28px",background:"#fff",border:"1px solid var(--line)",borderRadius:20,boxShadow:"0 4px 20px rgba(15,14,18,.04)"}}>
          {/* FORMAT */}
          <div style={{display:"grid",gridTemplateColumns:"110px 1fr",alignItems:"center",gap:18,paddingBottom:14}}>
            <div>
              <span className="eyebrow" style={{color:"var(--ink)"}}>Format</span>
              <div style={{fontSize:11,color:"var(--mute)",fontFamily:"var(--mono)",letterSpacing:".06em",marginTop:2}}>How it lands</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {FORMATS.map(f => <FilterChip key={f.id} active={fmts.includes(f.id)} onClick={()=>setFmts(toggle(fmts, f.id))} color="var(--ink)">{f.label}</FilterChip>)}
            </div>
          </div>
          {/* THEME */}
          <div style={{display:"grid",gridTemplateColumns:"110px 1fr",alignItems:"center",gap:18,padding:"14px 0",borderTop:"1px solid var(--line)"}}>
            <div>
              <span className="eyebrow" style={{color:"var(--purple)"}}>Theme</span>
              <div style={{fontSize:11,color:"var(--mute)",fontFamily:"var(--mono)",letterSpacing:".06em",marginTop:2}}>What it's about</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {THEMES.map(t => <FilterChip key={t.id} active={themes.includes(t.id)} onClick={()=>setThemes(toggle(themes, t.id))} color="var(--purple)">{t.label}</FilterChip>)}
            </div>
          </div>
          {/* CATEGORY */}
          <div style={{display:"grid",gridTemplateColumns:"110px 1fr",alignItems:"center",gap:18,paddingTop:14,borderTop:"1px solid var(--line)"}}>
            <div>
              <span className="eyebrow" style={{color:"var(--limeDark)"}}>Category</span>
              <div style={{fontSize:11,color:"var(--mute)",fontFamily:"var(--mono)",letterSpacing:".06em",marginTop:2}}>How it feels</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {CATEGORIES.map(c => <FilterChip key={c.id} active={cats.includes(c.id)} onClick={()=>setCats(toggle(cats, c.id))} color="var(--lime)">{c.label}</FilterChip>)}
            </div>
          </div>
        </div>

        {/* Active filters bar */}
        <div style={{marginTop:18,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <span className="eyebrow">{filtered.length} of {JOKES.length} jokes{activeCount?` · ${activeCount} filter${activeCount>1?"s":""} on`:" · no filters"}</span>
          {activeCount > 0 && (
            <>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {fmts.map(id => <span key={"f"+id} className="pill" style={{height:28,fontSize:12,background:"var(--ink)",color:"#fff",borderColor:"var(--ink)",cursor:"pointer"}} onClick={()=>setFmts(toggle(fmts,id))}>{FORMATS.find(f=>f.id===id)?.label} ✕</span>)}
                {themes.map(id => <span key={"t"+id} className="pill" style={{height:28,fontSize:12,background:"var(--purple)",color:"#fff",borderColor:"var(--purple)",cursor:"pointer"}} onClick={()=>setThemes(toggle(themes,id))}>{THEMES.find(t=>t.id===id)?.label} ✕</span>)}
                {cats.map(id => <span key={"c"+id} className="pill" style={{height:28,fontSize:12,background:"var(--lime)",color:"var(--limeDark)",borderColor:"var(--lime)",cursor:"pointer"}} onClick={()=>setCats(toggle(cats,id))}>{CATEGORIES.find(c=>c.id===id)?.label} ✕</span>)}
              </div>
              <button onClick={clearAll} className="btn btn-ghost" style={{height:30,fontSize:12,padding:"0 12px",marginLeft:"auto"}}>Clear all</button>
            </>
          )}
          {activeCount === 0 && (
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              {["This week","Top saves","Trending","New"].map((t,i) => (
                <button key={t} className={"pill"} style={{height:30,fontSize:12,...(i===0?{background:"var(--ink)",color:"#fff",borderColor:"var(--ink)"}:{})}}>{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Results: format-aware masonry ── */}
        <div style={{marginTop:24,columnCount:3,columnGap:18}}>
          {filtered.map(j => (
            <div key={j.id} style={{breakInside:"avoid",marginBottom:18}}>
              <JokeCard joke={j}/>
            </div>
          ))}
          {/* Inline editorial tile (pull quote) */}
          {filtered.length > 4 && (
            <div style={{breakInside:"avoid",marginBottom:18,padding:28,borderRadius:18,background:"var(--purple)",color:"#fff"}}>
              <span className="eyebrow" style={{color:"rgba(255,255,255,.7)"}}>Curator note</span>
              <div style={{fontFamily:"var(--serif)",fontStyle:"italic",fontWeight:600,fontSize:24,lineHeight:1.25,marginTop:10}}>"This week leaned hard into puns. <em style={{color:"var(--lime)"}}>We're not apologizing.</em>"</div>
              <div style={{marginTop:14,fontFamily:"var(--mono)",fontSize:11,letterSpacing:".18em",textTransform:"uppercase",opacity:.7}}>— The JokesFor desk</div>
            </div>
          )}
          {/* Weekly special tile */}
          {filtered.length > 6 && (
            <div style={{breakInside:"avoid",marginBottom:18,padding:24,borderRadius:18,background:"linear-gradient(160deg,#FFE6B5,#FFC965)",color:"var(--amberDark)"}}>
              <span className="tag" style={{background:"var(--amberDark)",color:"var(--amber)"}}>Weekly special</span>
              <h3 style={{color:"var(--amberDark)",marginTop:10,fontSize:22,lineHeight:1.15}}>14 jokes for <em className="wink" style={{color:"var(--amberDark)"}}>Valentine's.</em></h3>
              <p style={{fontSize:13,marginTop:6,opacity:.85}}>Hand-picked. Save the whole pack.</p>
              <button className="btn" style={{marginTop:14,background:"var(--amberDark)",color:"var(--amber)",height:38,fontSize:12}}>Open pack {I.arrow()}</button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{marginTop:32,padding:"56px 32px",border:"1px dashed var(--line)",borderRadius:18,textAlign:"center",background:"#fff"}}>
            <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:32}}>No jokes match <em className="wink">all that.</em></div>
            <p className="lead" style={{marginTop:8}}>Try removing a filter — or surrender and let the editors choose.</p>
            <div style={{marginTop:18,display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={clearAll} className="btn btn-primary" style={{height:42}}>Clear filters</button>
              <button className="btn btn-ghost" style={{height:42}}>{I.dice()} Surprise me</button>
            </div>
          </div>
        )}
      </div>
    </TopShell>
  );
}

// ─────────────────────────── 08 SEARCH ────────────────────────────
// Sentence Builder — "Show me [Format] jokes about [Theme] that feel [Category]."

function SBPill({ open, onClick, label, color, isSet }) {
  return (
    <button onClick={onClick} style={{
      display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:999,
      background: isSet ? color : "transparent",
      color: isSet ? (color==="var(--lime)"?"var(--limeDark)":"#fff") : color,
      border: isSet ? `2px solid ${color}` : `2px dashed ${color}`,
      fontFamily:"var(--display)",fontWeight:800,fontSize:"inherit",lineHeight:"inherit",letterSpacing:"inherit",
      cursor:"pointer",position:"relative"
    }}>
      {label}
      <span style={{fontSize:"55%",transform: open ? "rotate(180deg)" : "",transition:"transform .2s"}}>▾</span>
    </button>
  );
}

function SBPanel({ items, selected, onToggle, color, onClose, onClear }) {
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:5}}/>
      <div style={{position:"absolute",top:"100%",left:0,marginTop:14,zIndex:10,background:"#fff",border:"1px solid var(--line)",borderRadius:18,padding:18,boxShadow:"0 12px 40px rgba(15,14,18,.16)",minWidth:380,maxWidth:520}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span className="eyebrow">Pick one or many</span>
          <button onClick={onClear} style={{background:0,border:0,cursor:"pointer",fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:"var(--mute)"}}>Clear</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {items.map(it => (
            <button key={it.id} onClick={()=>onToggle(it.id)} className="pill" style={{cursor:"pointer",height:32,padding:"0 12px",fontSize:13,...(selected.includes(it.id)?{background:color,color: color==="var(--lime)"?"var(--limeDark)":"#fff",borderColor:color}:{})}}>{it.label}</button>
          ))}
        </div>
      </div>
    </>
  );
}

function SearchScreen() {
  const [q, setQ] = uS("");
  const [fmts, setFmts] = uS([]);
  const [themes, setThemes] = uS(["work"]);
  const [cats, setCats] = uS([]);
  const [open, setOpen] = uS(null); // 'fmt' | 'theme' | 'cat' | null

  const fmtLabel   = fmts.length===0 ? "any kind of" : fmts.length===1 ? FORMATS.find(f=>f.id===fmts[0]).label.toLowerCase() : `${fmts.length} formats`;
  const themeLabel = themes.length===0 ? "anything" : themes.length===1 ? THEMES.find(t=>t.id===themes[0]).label.toLowerCase() : `${themes.length} themes`;
  const catLabel   = cats.length===0 ? "any vibe" : cats.length===1 ? CATEGORIES.find(c=>c.id===cats[0]).label.toLowerCase() : `${cats.length} vibes`;

  const matches = uM(() => JOKES.filter(j =>
    (!fmts.length   || fmts.includes(j.fmt)) &&
    (!themes.length || themes.includes(j.theme)) &&
    (!cats.length   || cats.includes(j.cat)) &&
    (!q || (j.text||j.setup||"").toLowerCase().includes(q.toLowerCase()))
  ), [q, fmts, themes, cats]);

  return (
    <TopShell active="search">
      <div style={{padding:"40px 56px",position:"relative"}}>
        <span className="eyebrow">Search · Build the moment</span>
        <h2 style={{marginTop:8,fontSize:48,maxWidth:1100}}>What's the <em className="wink">moment</em>?</h2>
        <p className="lead" style={{marginTop:8,maxWidth:580}}>Skip the keyword guessing. Compose the moment as a sentence — JokesFor matches the rhythm.</p>

        {/* ── SENTENCE BUILDER ── */}
        <div style={{marginTop:36,padding:"40px 36px",background:"#fff",border:"1px solid var(--line)",borderRadius:24,boxShadow:"0 8px 30px rgba(15,14,18,.05)"}}>
          <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:46,letterSpacing:"-.02em",lineHeight:1.25,color:"var(--ink)",textWrap:"balance"}}>
            Show me{" "}
            <span style={{position:"relative",display:"inline-block"}}>
              <SBPill open={open==="fmt"} onClick={()=>setOpen(open==="fmt"?null:"fmt")} label={fmtLabel} color="var(--ink)" isSet={fmts.length>0}/>
              {open==="fmt" && <SBPanel items={FORMATS} selected={fmts} onToggle={(id)=>setFmts(toggle(fmts,id))} color="var(--ink)" onClose={()=>setOpen(null)} onClear={()=>setFmts([])}/>}
            </span>{" "}
            jokes about{" "}
            <span style={{position:"relative",display:"inline-block"}}>
              <SBPill open={open==="theme"} onClick={()=>setOpen(open==="theme"?null:"theme")} label={themeLabel} color="var(--purple)" isSet={themes.length>0}/>
              {open==="theme" && <SBPanel items={THEMES} selected={themes} onToggle={(id)=>setThemes(toggle(themes,id))} color="var(--purple)" onClose={()=>setOpen(null)} onClear={()=>setThemes([])}/>}
            </span>{" "}
            that feel{" "}
            <span style={{position:"relative",display:"inline-block"}}>
              <SBPill open={open==="cat"} onClick={()=>setOpen(open==="cat"?null:"cat")} label={catLabel} color="var(--lime)" isSet={cats.length>0}/>
              {open==="cat" && <SBPanel items={CATEGORIES} selected={cats} onToggle={(id)=>setCats(toggle(cats,id))} color="var(--lime)" onClose={()=>setOpen(null)} onClear={()=>setCats([])}/>}
            </span>.
          </div>

          {/* Optional keyword refine */}
          <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid var(--line)",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:"var(--purpleTint)",color:"var(--purple)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{I.search()}</div>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Refine with a keyword (optional) — e.g. coffee, mondays, mother-in-law…" style={{flex:1,height:36,border:0,fontFamily:"var(--display)",fontWeight:600,fontSize:16,outline:"none",background:"transparent",color:"var(--ink)"}}/>
            {q && <button onClick={()=>setQ("")} className="btn btn-ghost" style={{height:32,padding:"0 12px",fontSize:11}}>Clear</button>}
          </div>
        </div>

        {/* Quick-prompt chips */}
        <div style={{marginTop:18,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span className="eyebrow">Or try</span>
          {[
            ["First day at work",[],["work"],["safe-for-anyone"]],
            ["Wedding toast",[],["love"],["clean-warm"]],
            ["Dad-joke ammo",["oneliner"],["family"],["clean-warm"]],
            ["Group-chat unhinged",[],[],["unhinged"]],
            ["Office Slack-safe",["oneliner","observ"],["work"],["safe-for-anyone"]],
          ].map(([label,f,t,c]) => (
            <button key={label} onClick={()=>{setFmts(f);setThemes(t);setCats(c);setQ("");}} className="pill" style={{cursor:"pointer",height:32,fontSize:12}}>{label}</button>
          ))}
        </div>

        {/* Results */}
        <div style={{marginTop:36,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
          <span className="eyebrow">{matches.length} match{matches.length===1?"":"es"}</span>
          <span className="eyebrow">Sort: relevance ↓</span>
        </div>
        {matches.length > 0 ? (
          <div style={{marginTop:14,columnCount:3,columnGap:18}}>
            {matches.map(j => (
              <div key={j.id} style={{breakInside:"avoid",marginBottom:18}}>
                <JokeCard joke={j}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{marginTop:14,padding:"56px 32px",border:"1px dashed var(--line)",borderRadius:18,textAlign:"center",background:"#fff"}}>
            <div style={{fontFamily:"var(--display)",fontWeight:900,fontSize:32}}>No jokes for that exact <em className="wink">sentence.</em></div>
            <p className="lead" style={{marginTop:8}}>Loosen one of the pills, or surrender — we'll surprise you.</p>
            <div style={{marginTop:18,display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>{setFmts([]);setCats([]);}} className="btn btn-primary" style={{height:42}}>Loosen filters</button>
              <button className="btn btn-ghost" style={{height:42}}>{I.dice()} Surprise me</button>
            </div>
          </div>
        )}
      </div>
    </TopShell>
  );
}

Object.assign(window, { LoginScreen, RegisterScreen, OnbVibesScreen, OnbFormatsScreen, OnbRitualScreen, TodayScreen, ExploreScreen, SearchScreen });
