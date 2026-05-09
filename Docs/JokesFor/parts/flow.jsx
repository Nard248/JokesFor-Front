/* JokesFor — shared primitives, mock data, atoms */
const { useState, useEffect, useRef, useMemo } = React;

// ── Icons (inline, no deps) ───────────────────────────────────────────────
const I = {
  search: (s={}) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  bookmark: (s={}) => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={s}><path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6z"/></svg>,
  bookmarkOutline: (s={}) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" style={s}><path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6z"/></svg>,
  share: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>,
  shuffle: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 4 3 3-3 3"/><path d="M3 7h6l8 10h4"/><path d="m18 14 3 3-3 3"/><path d="M3 17h6l3-4"/></svg>,
  sparkle: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2 13.7 8.3 20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2z"/></svg>,
  arrow: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  back: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>,
  check: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  close: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  google: () => <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.7 3.2-8.4z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8C4.1 20.7 7.8 23 12 23z"/><path fill="#FBBC05" d="M5.9 14.3a6.6 6.6 0 0 1 0-4.6V6.9H2.3a11 11 0 0 0 0 10.2l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1C7.8 1 4.1 3.3 2.3 6.9l3.6 2.8C6.8 7.3 9.2 5.4 12 5.4z"/></svg>,
  bell: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>,
  flame: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2c-1 4 1 6 2 7 1.5 1.5 4 4 4 7a6 6 0 1 1-12 0c0-2 1-3 1-3s1 1 2 1c0-3 1-7 3-12z"/></svg>,
  dice: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/></svg>,
  filter: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>,
  history: () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>,
  trend: () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 7-7"/><path d="M14 7h6v6"/></svg>,
};

// ── Mock data ─────────────────────────────────────────────────────────────
const VIBES = [
  { id:"office",   label:"Office",       sub:"Meetings · Slack",        ico:"💼", c:"#6A1CF6", fg:"#fff" },
  { id:"dad",      label:"Dad jokes",    sub:"Eye-roll guaranteed",     ico:"🧓", c:"#FFC965", fg:"#5F4200" },
  { id:"puns",     label:"Puns",         sub:"Wordplay supreme",        ico:"🎯", c:"#CAFD00", fg:"#3A4A00" },
  { id:"dark",     label:"Dark humor",   sub:"Black coffee, no sugar",  ico:"🌑", c:"#1A1820", fg:"#fff" },
  { id:"nerd",     label:"Nerd",         sub:"Physics · code · maths",  ico:"🧪", c:"#F2E9FF", fg:"#5D00E4" },
  { id:"surreal",  label:"Surreal",      sub:"Logic optional",          ico:"🌀", c:"#AC8EFF", fg:"#fff" },
  { id:"wholesome",label:"Wholesome",    sub:"For the group chat",      ico:"🌼", c:"#FFE6B5", fg:"#5F4200" },
  { id:"observ",   label:"Observational",sub:"Adulthood is…",           ico:"👀", c:"#FBFAF7", fg:"#1A1A1A" },
  { id:"oneliner", label:"One-liners",   sub:"Hit, run, save",          ico:"⚡", c:"#1A1A1A", fg:"#CAFD00" },
  { id:"date",     label:"Date night",   sub:"Charm a stranger",        ico:"🍷", c:"#F4E4D7", fg:"#5F2A14" },
  { id:"kids",     label:"Kids OK",      sub:"School-pickup safe",      ico:"🧃", c:"#D6F2FF", fg:"#003B5C" },
  { id:"absurd",   label:"Absurd",       sub:"Mostly fruit",            ico:"🍌", c:"#FFC965", fg:"#5F4200" },
];

const FORMATS = [
  { id:"oneliner", label:"One-liner",       sub:"Single punch.",                              demo:"I told my wife she was drawing her eyebrows too high. She seemed surprised." },
  { id:"setup",    label:"Setup → punchline", sub:"The classic two-beat.",                    demo:"Why don't scientists trust atoms? Because they make up everything." },
  { id:"knock",    label:"Knock-knock",     sub:"Conversational reveal.",                     demo:"Knock, knock. Lettuce in, it's freezing." },
  { id:"story",    label:"Story / shaggy",  sub:"Long-form, slow burn.",                      demo:"A man walks into a library and asks for a book on paranoia…" },
  { id:"anti",     label:"Anti-joke",       sub:"Refuses to land.",                           demo:"Why did the chicken cross the road? To get to the other side." },
  { id:"observ",   label:"Observational",   sub:"Quote-style.",                               demo:"Adulthood is just emailing 'Sounds good!' until one of you dies." },
];

// Theme = subject; Category = vibe/audience
const THEMES = [
  {id:"work",label:"Work"},{id:"family",label:"Family"},{id:"food",label:"Food"},
  {id:"tech",label:"Tech"},{id:"school",label:"School"},{id:"dating",label:"Dating"},
  {id:"animals",label:"Animals"},{id:"science",label:"Science"},{id:"travel",label:"Travel"},
  {id:"money",label:"Money"},{id:"weather",label:"Weather"},{id:"mondays",label:"Mondays"},
];

const CATEGORIES = [
  {id:"wholesome",label:"Wholesome"},{id:"office",label:"Office-proper"},{id:"dad",label:"Dad"},
  {id:"kid",label:"Kid-safe"},{id:"nerd",label:"Nerd"},{id:"surreal",label:"Surreal"},
  {id:"dark",label:"Dark"},{id:"edgy",label:"Edgy"},
];

const JOKES = [
  { id:1, fmt:"setup",    setup:"Why don't scientists trust atoms anymore?", punch:"Because they make up everything.", theme:"science", themeLabel:"Science", cat:"nerd", catLabel:"Nerd", saves:"4.1K", laughs:"612" },
  { id:2, fmt:"oneliner", text:"I told my wife she was drawing her eyebrows too high. She seemed surprised.", theme:"family", themeLabel:"Family", cat:"dad", catLabel:"Dad", saves:"2.8K", laughs:"411" },
  { id:3, fmt:"observ",   text:"Adulthood is just emailing 'Sounds good!' back and forth until one of you dies.", theme:"work", themeLabel:"Work", cat:"office", catLabel:"Office-proper", saves:"4.8K", laughs:"904" },
  { id:4, fmt:"setup",    setup:"What's the difference between a hippo and a Zippo?", punch:"One is really heavy and the other is a little lighter.", theme:"animals", themeLabel:"Animals", cat:"dad", catLabel:"Dad", saves:"1.1K", laughs:"203" },
  { id:5, fmt:"oneliner", text:"I used to hate facial hair. But then it grew on me.", theme:"family", themeLabel:"Family", cat:"wholesome", catLabel:"Wholesome", saves:"2.2K", laughs:"389" },
  { id:6, fmt:"setup",    setup:"Why did the scarecrow win an award?", punch:"He was outstanding in his field.", theme:"animals", themeLabel:"Animals", cat:"dad", catLabel:"Dad", saves:"3.4K", laughs:"522" },
  { id:7, fmt:"anti",     setup:"Why did the chicken cross the road?", punch:"To get to the other side.", text:"Why did the chicken cross the road? To get to the other side.", theme:"animals", themeLabel:"Animals", cat:"surreal", catLabel:"Surreal", saves:"771", laughs:"189" },
  { id:8, fmt:"observ",   text:"My therapist said growth is uncomfortable. So is this email.", theme:"work", themeLabel:"Work", cat:"office", catLabel:"Office-proper", saves:"3.0K", laughs:"450" },
  { id:9, fmt:"oneliner", text:"I'm reading a book about anti-gravity. It's impossible to put down.", theme:"science", themeLabel:"Science", cat:"nerd", catLabel:"Nerd", saves:"1.9K", laughs:"312" },
  { id:10, fmt:"knock",   lines:["Knock, knock.","Who's there?","Lettuce.","Lettuce who?","Lettuce in. It's freezing out here."], theme:"weather", themeLabel:"Weather", cat:"kid", catLabel:"Kid-safe", saves:"1.4K", laughs:"267" },
  { id:11, fmt:"story",   text:"A man walks into a library and asks the librarian for a book on paranoia. She whispers, 'They're right behind you.' He turned around — and to his relief, only a stack of returns. He picked one off the top: 'How to Trust Strangers.' He's been on chapter one for six years.", theme:"work", themeLabel:"Work", cat:"surreal", catLabel:"Surreal", read:"2 min", saves:"892", laughs:"341" },
  { id:12, fmt:"observ",  text:"Coffee doesn't ask silly questions. Coffee understands.", theme:"food", themeLabel:"Coffee", cat:"wholesome", catLabel:"Wholesome", saves:"2.1K", laughs:"388" },
  { id:13, fmt:"oneliner",text:"My password is the last 8 digits of pi.", theme:"tech", themeLabel:"Tech", cat:"nerd", catLabel:"Nerd", saves:"3.6K", laughs:"714" },
  { id:14, fmt:"setup",   setup:"How many programmers does it take to change a lightbulb?", punch:"None. That's a hardware problem.", theme:"tech", themeLabel:"Tech", cat:"nerd", catLabel:"Nerd", saves:"2.3K", laughs:"402" },
  { id:15, fmt:"anti",    setup:"What's red and bad for your teeth?", punch:"A brick.", text:"What's red and bad for your teeth? A brick.", theme:"food", themeLabel:"Food", cat:"surreal", catLabel:"Surreal", saves:"1.0K", laughs:"244" },
];

const VIBE_BG = {
  office:    "linear-gradient(160deg, #6A1CF6, #5D00E4)",
  dad:       "linear-gradient(160deg, #FFC965, #FFA63C)",
  puns:      "linear-gradient(160deg, #CAFD00, #9CC400)",
  dark:      "linear-gradient(160deg, #1A1820, #0E0D11)",
  nerd:      "linear-gradient(160deg, #F2E9FF, #DAC2FF)",
  surreal:   "linear-gradient(160deg, #AC8EFF, #6A1CF6)",
  wholesome: "linear-gradient(160deg, #FFE6B5, #FFC965)",
  observ:    "linear-gradient(160deg, #FBFAF7, #E9E8E7)",
  oneliner:  "linear-gradient(160deg, #1A1A1A, #2D2D2D)",
  date:      "linear-gradient(160deg, #F4E4D7, #E1B89E)",
  kids:      "linear-gradient(160deg, #D6F2FF, #A6DDFF)",
  absurd:    "linear-gradient(160deg, #FFC965, #FF9A3C)",
};

// ── Atoms ─────────────────────────────────────────────────────────────────
function Logo({ size=32, withText=false, dark=false }) {
  const src = dark ? "assets/logo-mark-white.svg" : "assets/logo-mark-purple.svg";
  return (
    <a className="logo" data-go="today" style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",textDecoration:"none",color:"inherit"}}>
      <img src={src} alt="JokesFor" style={{width:size,height:size,borderRadius:size*.25}}/>
      {withText && <span style={{fontFamily:"var(--display)",fontWeight:800,fontSize:size*.6,letterSpacing:"-.01em"}}>JokesFor</span>}
    </a>
  );
}

function StreakChip({ days=14 }) {
  return (
    <span className="streak-chip">
      <span className="dot">{I.flame()}</span>
      {days}-day streak
    </span>
  );
}

function FrameLabel({ num, name, w=1440 }) {
  return (
    <div className="frame-label" style={{width:w}}>
      <span><span className="pgnum">{num}</span> · {name}</span>
      <span>1440 × auto · DESKTOP</span>
    </div>
  );
}

function FormatBadge({ fmt }) {
  const map = {
    setup:    { lbl:"Setup → Punchline", cls:"" },
    oneliner: { lbl:"One-liner",          cls:"dark" },
    observ:   { lbl:"Observational",      cls:"amber" },
    anti:     { lbl:"Anti-joke",          cls:"dark" },
    knock:    { lbl:"Knock-knock",        cls:"amber" },
    story:    { lbl:"Story",              cls:"" },
  };
  const m = map[fmt] || map.setup;
  return <span className={"tag " + m.cls}>{m.lbl}</span>;
}

// ── Format-aware unified card ────────────────────────────────────────────
// Every joke renders through this. Each format = its own visual rhythm,
// but consistent header (badges) + footer (stats / save / share) across all.

const FMT_SKIN = {
  setup:    { bg:"#FFFFFF",         fg:"var(--ink)",   border:"1px solid var(--line)", divider:"var(--line2)" },
  oneliner: { bg:"var(--lime)",     fg:"var(--limeDark)", border:"0",                  divider:"rgba(58,74,0,.18)" },
  observ:   { bg:"#FBFAF7",         fg:"var(--ink)",   border:"1px solid var(--line)", divider:"var(--line2)" },
  anti:     { bg:"var(--ink)",      fg:"#FFFFFF",      border:"0",                     divider:"rgba(255,255,255,.14)" },
  knock:    { bg:"#FFFFFF",         fg:"var(--ink)",   border:"1px solid var(--line)", divider:"var(--line2)" },
  story:    { bg:"var(--amber)",    fg:"var(--amberDark)", border:"0",                 divider:"rgba(95,66,0,.2)" },
};

function MetaRow({ joke, skin }) {
  const muted = joke.fmt === "anti" ? "rgba(255,255,255,.6)" : "var(--mute)";
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <FormatBadge fmt={joke.fmt}/>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",fontFamily:"var(--mono)",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:muted}}>
        <span>{joke.themeLabel}</span><span>·</span><span>{joke.catLabel}</span>
      </div>
    </div>
  );
}

function ActionBar({ joke, saved, onSave, skin }) {
  const muted = joke.fmt === "anti" ? "rgba(255,255,255,.7)" : "var(--sub)";
  const ghostBg = joke.fmt === "anti" ? "rgba(255,255,255,.08)" : "transparent";
  const ghostBorder = joke.fmt === "anti" ? "1px solid rgba(255,255,255,.18)" : "1px solid var(--line)";
  const ghostFg = joke.fmt === "anti" ? "#fff" : "var(--ink)";
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:12,borderTop:`1px solid ${skin.divider}`}}>
      <div style={{display:"flex",gap:10,fontSize:12,color:muted,fontFamily:"var(--mono)",letterSpacing:".06em"}}>
        <span>😂 {joke.laughs}</span>
        <span>💾 {joke.saves}</span>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn" onClick={(e)=>{e.stopPropagation();onSave();}} style={{height:32,padding:"0 12px",fontSize:12,background: saved ? "var(--ink)" : ghostBg,color: saved ? "var(--lime)" : ghostFg,border: saved ? "0" : ghostBorder}}>
          {saved ? I.bookmark() : I.bookmarkOutline()} {saved ? "Saved" : "Save"}
        </button>
        <button className="btn" style={{height:32,padding:"0 12px",fontSize:12,background:ghostBg,color:ghostFg,border:ghostBorder}}>{I.share()}</button>
      </div>
    </div>
  );
}

function JokeCard({ joke, big=false }) {
  const [revealed, setRevealed] = useState(joke.fmt !== "setup");
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(0); // for knock-knock
  const skin = FMT_SKIN[joke.fmt] || FMT_SKIN.setup;
  const radius = 18;

  // Body renderer per format
  const Body = () => {
    if (joke.fmt === "setup") {
      const titleSize = big ? 24 : 16;
      const punchSize = big ? 44 : 22;
      return (
        <div onClick={()=>!revealed && setRevealed(true)} style={{cursor: !revealed ? "pointer" : "default"}}>
          <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:titleSize,color:skin.fg,lineHeight:1.3,marginTop:14}}>{joke.setup}</div>
          <div style={{
            marginTop:12,fontFamily:"var(--display)",fontWeight:900,fontSize:punchSize,letterSpacing:"-.02em",
            color:skin.fg,lineHeight:1.05,
            filter: revealed ? "none" : "blur(14px)",
            transition:"filter .55s cubic-bezier(.2,.6,.2,1)",
            userSelect: revealed ? "auto" : "none"
          }}>{joke.punch}</div>
          {!revealed && <div className="eyebrow" style={{marginTop:14,color:"var(--purple)"}}>Tap to reveal punchline →</div>}
        </div>
      );
    }
    if (joke.fmt === "oneliner") {
      const sz = big ? 38 : 22;
      return (
        <div style={{marginTop:14,fontFamily:"var(--display)",fontWeight:900,fontSize:sz,letterSpacing:"-.02em",color:skin.fg,lineHeight:1.05,textWrap:"balance"}}>{joke.text}</div>
      );
    }
    if (joke.fmt === "observ") {
      const sz = big ? 26 : 18;
      return (
        <div style={{marginTop:14,position:"relative"}}>
          <span style={{position:"absolute",top:-12,left:-6,fontFamily:"var(--serif)",fontStyle:"italic",fontSize:60,lineHeight:1,color:"var(--purple)",opacity:.35}}>"</span>
          <div style={{paddingLeft:24,fontFamily:"var(--serif)",fontStyle:"italic",fontWeight:500,fontSize:sz,color:skin.fg,lineHeight:1.3,textWrap:"balance"}}>{joke.text}</div>
        </div>
      );
    }
    if (joke.fmt === "anti") {
      const sz = big ? 30 : 20;
      return (
        <div style={{marginTop:14}}>
          <div style={{fontFamily:"var(--display)",fontWeight:500,fontSize: big?17:13,color:"rgba(255,255,255,.7)",lineHeight:1.3}}>{joke.setup}</div>
          <div style={{marginTop:10,fontFamily:"var(--display)",fontWeight:900,fontSize:sz,letterSpacing:"-.02em",color:"#fff",lineHeight:1.1}}>{joke.punch}</div>
          <div style={{marginTop:12,fontFamily:"var(--mono)",fontSize:10,letterSpacing:".22em",color:"rgba(255,255,255,.5)",textTransform:"uppercase"}}>* That's it. That's the joke.</div>
        </div>
      );
    }
    if (joke.fmt === "knock") {
      const visible = joke.lines.slice(0, step+1);
      return (
        <div onClick={()=>setStep(s => Math.min(s+1, joke.lines.length-1))} style={{marginTop:14,display:"flex",flexDirection:"column",gap:6,cursor:step < joke.lines.length-1 ? "pointer":"default"}}>
          {visible.map((l,i) => (
            <div key={i} style={{alignSelf: i%2===0 ? "flex-start" : "flex-end",maxWidth:"82%",padding:"7px 11px",borderRadius:13,background: i%2===0 ? "var(--purpleTint)" : "var(--ink)",color: i%2===0 ? "var(--purple)" : "#fff",fontSize:13,fontFamily:"var(--display)",fontWeight: i===joke.lines.length-1?800:600}}>{l}</div>
          ))}
          {step < joke.lines.length-1 && <div className="eyebrow" style={{marginTop:6,color:"var(--purple)"}}>Tap to advance · {step+1}/{joke.lines.length}</div>}
        </div>
      );
    }
    if (joke.fmt === "story") {
      return (
        <div style={{marginTop:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span className="tag" style={{background:"var(--amberDark)",color:"var(--amber)",borderColor:"transparent"}}>📖 {joke.read || "30 sec read"}</span>
          </div>
          <div style={{fontFamily:"var(--serif)",fontWeight:400,fontSize: big?17:14,color:skin.fg,lineHeight:1.55,textWrap:"pretty"}}>{joke.text}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background:skin.bg,color:skin.fg,
      border:skin.border,borderRadius:radius,
      padding: big ? 28 : 18,
      transition:"box-shadow .2s ease, transform .2s ease",
      position:"relative",overflow:"hidden",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 10px 28px rgba(15,14,18,.08)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <MetaRow joke={joke} skin={skin}/>
      <Body/>
      <ActionBar joke={joke} saved={saved} onSave={()=>setSaved(s=>!s)} skin={skin}/>
    </div>
  );
}

// global click delegation: any [data-go="screenId"] navigates
window.addEventListener("click", (e) => {
  const el = e.target.closest("[data-go]");
  if (!el) return;
  const id = el.getAttribute("data-go");
  if (window.__goto) window.__goto(id);
});

Object.assign(window, { I, VIBES, FORMATS, THEMES, CATEGORIES, JOKES, VIBE_BG, Logo, StreakChip, FrameLabel, FormatBadge, JokeCard });
