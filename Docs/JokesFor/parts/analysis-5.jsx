// 06 Three visual directions — the spectrum of "how fresh".
// Each artboard shows the same JOTD card in that direction.

const DirectionCard = ({ dirName, sub, take, audience, swatches, board, recommend }) => (
  <div style={{ width:'100%', height:'100%', display:'grid', gridTemplateRows:'auto 1fr auto', background:'#FBFAF7', padding: 24 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={A.num}>Direction · {dirName}</div>
        <div style={{ ...A.h2, fontSize: 30, marginTop: 6, lineHeight: 1.05 }}>{sub}</div>
      </div>
      {recommend && <Tag bg={T.lime} fg={T.limeDark}>Recommended</Tag>}
    </div>
    <div style={{ marginTop: 18, marginBottom: 18 }}>{board}</div>
    <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
      <div>
        <div style={A.num}>Take</div>
        <div style={{ ...A.body, fontSize: 13, marginTop: 4 }}>{take}</div>
      </div>
      <div>
        <div style={A.num}>Right for</div>
        <div style={{ ...A.body, fontSize: 13, marginTop: 4 }}>{audience}</div>
        <div style={{ display:'flex', gap: 6, marginTop: 8 }}>
          {swatches.map((s,i)=>(
            <div key={i} style={{ width: 22, height: 22, borderRadius: 6, background: s, border: `1px solid ${T.line}` }} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Direction A — Curated playful (current refined)
const DirA = () => (
  <div style={{ background: T.bg, borderRadius: 28, padding: 24, height: '100%' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <Pill bg={T.purpleTint} fg={T.purple} border={T.purpleTint}>Joke of the day</Pill>
      <div style={{ ...A.num, color: T.sub }}>WED · FEB 12</div>
    </div>
    <div style={{ background: `linear-gradient(135deg, ${T.purple}, ${T.purpleLt})`, borderRadius: 24, padding: 24, color:'#fff', marginTop: 16, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top: -20, right: -10, fontFamily: FONTS.display, fontWeight: 900, fontSize: 140, opacity: .15, lineHeight: 1, color: T.lime }}>"</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>Why don't scientists trust atoms anymore?</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, lineHeight: 1.15, marginTop: 8 }}>Because they <em style={{ fontFamily: FONTS.serif, fontStyle:'italic', color: T.lime, fontWeight: 600 }}>make up</em> everything.</div>
      <div style={{ display:'flex', gap: 8, marginTop: 16 }}>
        <Pill bg={T.lime} fg={T.limeDark} border={T.lime}>+ Save</Pill>
        <Pill bg="rgba(255,255,255,.15)" fg="#fff" border="rgba(255,255,255,.3)">Share</Pill>
      </div>
    </div>
  </div>
);

// Direction B — Editorial / newsprint
const DirB = () => (
  <div style={{ background:'#F4EFE6', borderRadius: 8, padding: 24, height: '100%', fontFamily: FONTS.serif }}>
    <div style={{ borderBottom: `2px solid ${T.ed_ink}`, paddingBottom: 8, display:'flex', justifyContent:'space-between' }}>
      <div style={{ fontFamily: FONTS.serif, fontWeight: 700, fontSize: 18, color: T.ed_ink, letterSpacing:'.02em' }}>The JokesFor Daily</div>
      <div style={{ ...A.num, color: T.ed_ink }}>VOL. I · NO. 042</div>
    </div>
    <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing:'.18em', color: T.ed_red, textTransform:'uppercase', marginTop: 14 }}>The Daily Pick</div>
    <div style={{ fontFamily: FONTS.serif, fontWeight: 600, fontStyle:'italic', fontSize: 28, lineHeight: 1.15, color: T.ed_ink, marginTop: 6 }}>"Why don't scientists trust atoms anymore?"</div>
    <div style={{ fontFamily: FONTS.serif, fontWeight: 600, fontSize: 36, lineHeight: 1.05, color: T.ed_ink, marginTop: 12 }}>Because they make up<span style={{ color: T.ed_red }}> everything.</span></div>
    <div style={{ borderTop: `1px solid ${T.ed_ink}`, marginTop: 20, paddingTop: 12, display:'flex', justifyContent:'space-between' }}>
      <div style={{ fontFamily: FONTS.body, fontSize: 12, color: T.ed_ink }}>filed under <em>Punny / Science</em></div>
      <div style={{ display:'flex', gap: 8 }}>
        <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 12, color: T.ed_red }}>SAVE</span>
        <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 12, color: T.ed_ink }}>SHARE</span>
      </div>
    </div>
  </div>
);

// Direction C — Soft brutalist
const DirC = () => (
  <div style={{ background:'#0F0E12', borderRadius: 8, padding: 24, height: '100%', color:'#fff' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing:'.2em', color: T.noir_neon }}>SYS / DAILY 042</div>
      <div style={{ width: 8, height: 8, borderRadius: 999, background: T.noir_neon, boxShadow: `0 0 12px ${T.noir_neon}` }} />
    </div>
    <div style={{ background: T.noir_card, borderRadius: 0, padding: 18, marginTop: 14, border: `1px solid #2A2933` }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 18, color:'#fff', lineHeight: 1.2 }}>Why don't scientists trust atoms anymore?</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 30, color: T.noir_neon, lineHeight: 1.1, marginTop: 10, letterSpacing:'-.02em' }}>Because they make up everything.</div>
      <div style={{ height: 1, background:'#2A2933', margin:'14px 0' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap: 6 }}>
          <span style={{ height: 22, padding:'0 8px', background: T.noir_neon, color:'#0F0E12', fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, display:'inline-flex', alignItems:'center', letterSpacing:'.1em' }}>SAVE</span>
          <span style={{ height: 22, padding:'0 8px', background:'transparent', border:'1px solid #555', color:'#fff', fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, display:'inline-flex', alignItems:'center', letterSpacing:'.1em' }}>SHARE</span>
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, color:'#888', letterSpacing:'.1em' }}>+412 LOLs</div>
      </div>
    </div>
  </div>
);

const DirectionsBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'48px 56px', display:'grid', gridTemplateRows:'auto 1fr auto', gap: 24 }}>
    <div>
      <div style={A.num}>06 · Visual directions</div>
      <div style={{ ...A.h1, fontSize: 56, marginTop: 12 }}>How fresh, exactly?</div>
      <div style={{ ...A.body, fontSize: 16, marginTop: 12, maxWidth: 940 }}>
        Three coherent options, ordered by distance from the existing draft. The screens to the right ship in <strong>Direction A — Curated Playful</strong> (recommended): it keeps the equity of the Figma draft while sharpening the editorial layer. B and C are reference points if the brand wants to go further.
      </div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 16, height: 460 }}>
      <div style={{ border:`1px solid ${T.line}`, borderRadius: 28, overflow:'hidden' }}>
        <DirectionCard dirName="A · Curated Playful" sub="Refined draft." recommend
          take="Keeps purple+lime DNA; introduces serif-italic 'wink' and editorial eyebrows. Highest brand recognizability for the existing investment."
          audience="Mainstream + parent persona. Safest commercial direction."
          swatches={[T.purple, T.lime, T.amber, T.bg, T.ink]}
          board={<DirA />} />
      </div>
      <div style={{ border:`1px solid ${T.line}`, borderRadius: 8, overflow:'hidden' }}>
        <DirectionCard dirName="B · Bookplate Editorial" sub="The Joke Times."
          take="Newsprint serif on warm cream. Says 'curation' loudest of the three; nudges away from current chromatic identity."
          audience="Skews older / Substack-y. Strong for long-form & weekly digest."
          swatches={['#F4EFE6', T.ed_ink, T.ed_red, '#E5DDC9']}
          board={<DirB />} />
      </div>
      <div style={{ border:`1px solid ${T.line}`, borderRadius: 8, overflow:'hidden' }}>
        <DirectionCard dirName="C · Late-Night Neon" sub="After-hours mode."
          take="Dark base, mono-eyebrows, neon punchline. Closer to a stand-up venue. Polarizing — risks shock-humor association."
          audience="Younger, urban; doubles as theme variant for night mode."
          swatches={[T.noir_bg, T.noir_card, T.noir_neon, T.noir_lav]}
          board={<DirC />} />
      </div>
    </div>
    <div style={{ borderTop:`1px solid ${T.line}`, paddingTop: 16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ ...A.body, fontSize: 14 }}>
        <strong>Recommendation:</strong> ship A. Keep B's serif-italic accent as a token used sparingly in A. Keep C's neon palette in the back pocket as a future "Night Mode" theme — same components, different paint.
      </div>
      <div style={{ display:'flex', gap: 8 }}>
        <Pill bg={T.lime} fg={T.limeDark} border={T.lime}>Direction A → screens →</Pill>
      </div>
    </div>
  </div>
);

window.DirectionsBoard = DirectionsBoard;
