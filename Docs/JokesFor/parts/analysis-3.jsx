// 03 Typography — pairing rationale, scale, samples, type DNA.

const TypeSample = ({ font, weight=900, size=64, label, sample, lh=1, ls='-.02em', italic=false }) => (
  <div style={{ borderTop: `1px solid ${T.line}`, padding:'18px 0' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 8 }}>
      <div style={{ ...A.num, color: T.ink }}>{label}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: T.sub }}>{font.replace(/"/g,'')} · {weight} · {size}/{(size*lh)|0}</div>
    </div>
    <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: lh, letterSpacing: ls, fontStyle: italic ? 'italic' : 'normal', color: T.ink }}>{sample}</div>
  </div>
);

const TypeBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'48px 56px', display:'grid', gridTemplateColumns:'1fr 1fr', columnGap: 40, rowGap: 28 }}>
    <div style={{ gridColumn:'1 / span 2' }}>
      <div style={A.num}>03 · Typography</div>
      <div style={{ ...A.h1, fontSize: 56, marginTop: 12 }}>Two voices.<br/>One library.</div>
      <div style={{ ...A.body, fontSize: 16, marginTop: 12, maxWidth: 920 }}>
        Jokes are <em>spoken</em> objects rendered visually. The system needs a typographic <strong>presenter</strong> (sets the room — bold, theatrical, declarative) and a typographic <strong>narrator</strong> (delivers the line — neutral, legible, low-ego). Display does the announcing; Body does the punchline. A serif italic sneaks in as the laugh track — used <em>sparingly</em> to mark the word-play in headlines.
      </div>
    </div>

    {/* Left: pairing rationale */}
    <div>
      <div style={{ ...A.h2, fontSize: 22, marginBottom: 8 }}>The pairing</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 20, padding: 20 }}>
          <Tag bg={T.purpleTint} fg={T.purple}>Display · Epilogue</Tag>
          <div style={{ fontFamily: FONTS.display, fontWeight:900, fontSize: 36, marginTop: 12, color: T.ink, lineHeight: 1, letterSpacing:'-.02em' }}>Aa</div>
          <div style={{ ...A.small, marginTop: 10 }}>
            Geometric grotesk with humanist overshoots — feels editorial, not corporate. Closed apertures keep weight at large sizes; rounded terminals keep it warm.
          </div>
        </div>
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 20, padding: 20 }}>
          <Tag bg={T.lime} fg={T.limeDark}>Body · Plus Jakarta Sans</Tag>
          <div style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: 36, marginTop: 12, color: T.ink, lineHeight: 1 }}>Aa</div>
          <div style={{ ...A.small, marginTop: 10 }}>
            High x-height, open counters, designed for tight UI. Reads cleanly at 13–16px which is where 90% of joke text lives.
          </div>
        </div>
      </div>
      <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 20, padding: 20, marginTop: 14 }}>
        <Tag bg={T.amber} fg={T.amberDark}>Italic accent · Fraunces</Tag>
        <div style={{ fontFamily: FONTS.serif, fontStyle:'italic', fontWeight: 500, fontSize: 44, marginTop: 8, color: T.ink, lineHeight: 1 }}>laughing</div>
        <div style={{ ...A.small, marginTop: 8 }}>
          Used <em>once per page max</em>: the "wink" word in a headline, the curated-pick callout. Carries the editorial bookplate energy without taking over.
        </div>
      </div>
      {/* Pairing diagram */}
      <div style={{ marginTop: 18 }}>
        <div style={A.num}>Hierarchy in one glance</div>
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 20, padding: 22, marginTop: 10 }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 40, color: T.ink, lineHeight: 1, letterSpacing:'-.02em' }}>
            Pick your <em style={{ fontFamily: FONTS.serif, fontWeight: 500, fontStyle:'italic', color: T.purple }}>flavor</em> of funny.
          </div>
          <div style={{ ...A.body, fontSize: 15, marginTop: 12 }}>
            We'll tailor your daily dose of dopamine based on the kind of humor that actually makes you smile.
          </div>
          <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
            <Pill bg={T.purple} fg="#fff" border={T.purple}>Continue →</Pill>
            <Pill>Maybe later</Pill>
          </div>
        </div>
      </div>
    </div>

    {/* Right: scale */}
    <div>
      <div style={{ ...A.h2, fontSize: 22 }}>The scale</div>
      <TypeSample font={FONTS.display} weight={900} size={88} label="Display / Headline · 88" lh={1} sample="Joke first." />
      <TypeSample font={FONTS.display} weight={800} size={48} label="Display / Section · 48" lh={1.05} sample="Fresh arrivals" />
      <TypeSample font={FONTS.display} weight={700} size={28} label="Display / Card · 28" lh={1.1} sample="The All-Time Classics" />
      <TypeSample font={FONTS.serif}   weight={500} size={40} label="Serif / Italic accent · 40" lh={1.05} sample="laughing" italic ls="0" />
      <TypeSample font={FONTS.body}    weight={500} size={20} label="Body / Lead · 20" lh={1.45} ls="0" sample="The web's most curated library of punchlines for parents, teachers, and anyone who needs a quick giggle." />
      <TypeSample font={FONTS.body}    weight={400} size={15} label="Body / Run · 15" lh={1.55} ls="0" sample="Why don't scientists trust atoms anymore? Because they make up everything." />
      <TypeSample font={FONTS.mono}    weight={500} size={11} label="Eyebrow / Mono · 11" lh={1.5} ls=".18em" sample="03 · TYPOGRAPHY" />
    </div>

    {/* Bottom rules */}
    <div style={{ gridColumn:'1 / span 2', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16, borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
      {[
        ['Headlines', 'Always Epilogue 800-900. Tight tracking (-2%). 1.0 line-height. Italic-Fraunces is the only allowed sub-substitution.'],
        ['Joke text', 'Plus Jakarta Sans 400-500. Setup line 17px / punchline 19-22px / 1.45-1.5 line. Quote-marks in display font as ornament.'],
        ['Numbers / meta', 'JetBrains Mono 11-13. UPPERCASE eyebrows + tracking .18em. Used for tags, counters, dates.'],
        ['Forbidden', 'No system-ui in production. No bold-on-bold. No center-aligned body copy. No more than three sizes per surface.'],
      ].map(([k,v],i)=>(
        <div key={i}>
          <div style={{ ...A.h2, fontSize: 14, color: T.ink, marginBottom: 6 }}>{k}</div>
          <div style={{ ...A.small }}>{v}</div>
        </div>
      ))}
    </div>
  </div>
);

window.TypeBoard = TypeBoard;
