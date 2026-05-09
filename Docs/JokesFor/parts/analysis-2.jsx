// 02 Color Psychology — full breakdown of the chosen palette,
// rationale, accessibility, "why these colors" and what gets used where.

const ColorChip = ({ hex, name, role, fg='#fff', dark=false }) => (
  <div style={{ borderRadius: 20, overflow:'hidden', border: `1px solid ${T.line}`, background:'#fff' }}>
    <div style={{ background: hex, height: 132, padding: 16, color: fg, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing:'.1em', opacity:.85 }}>{role}</div>
      <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 800 }}>{name}</div>
    </div>
    <div style={{ padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily: FONTS.mono, fontSize: 11, color: T.sub }}>
      <span>{hex.toUpperCase()}</span>
      <span>{dark ? 'AAA on white' : ''}</span>
    </div>
  </div>
);

const PsyRow = ({ swatch, name, association, signal, where }) => (
  <tr>
    <td style={{ padding:'14px 0', borderBottom: `1px solid ${T.line}`, width: 56 }}>
      <div style={{ width:36, height:36, borderRadius:8, background: swatch, border: `1px solid ${T.line}` }} />
    </td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, fontFamily: FONTS.display, fontWeight: 800, color: T.ink, width: 130 }}>{name}</td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, ...A.body, fontSize: 13 }}>{association}</td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, ...A.body, fontSize: 13, fontStyle:'italic', color: T.ink }}>{signal}</td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, ...A.small, color: T.mute, width: 220 }}>{where}</td>
  </tr>
);

const ColorBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'48px 56px', display:'grid', gridTemplateRows:'auto auto auto auto', gap: 28 }}>
    <div>
      <div style={A.num}>02 · Color psychology</div>
      <div style={{ ...A.h1, fontSize: 56, marginTop: 12 }}>Joy, with a wink.</div>
      <div style={{ ...A.body, fontSize: 16, marginTop: 12, maxWidth: 880 }}>
        Joke products historically drift into either <strong>kid-yellow chaos</strong> (iFunny, 9GAG) or <strong>monochrome forum gray</strong> (Reddit). Both undersell the brand: humor is grown-up but playful, intimate but performative. The chosen palette pairs a <strong>cultivated violet</strong> — premium, creative, trustworthy — with a <strong>punchy lime</strong> as the laugh itself. The neutrals stay warm so the surface doesn't read as "tech."
      </div>
    </div>

    {/* Palette grid */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 14 }}>
      <ColorChip hex={T.purple}    name="Hero Violet"    role="Primary · #6A1CF6" />
      <ColorChip hex={T.purpleLt}  name="Lavender"       role="Hover · #AC8EFF" fg={T.limeDark} />
      <ColorChip hex={T.lime}      name="Punchline Lime" role="Accent · #CAFD00" fg={T.limeDark} dark />
      <ColorChip hex={T.amber}     name="Honey"          role="Warmth · #FFC965" fg={T.amberDark} />
      <ColorChip hex={T.ink}       name="Type Ink"       role="Foreground · #2E2F2F" />
      <ColorChip hex={T.bg}        name="Paper"          role="Surface · #F8F6F6" fg={T.ink} />
    </div>

    {/* Psychology table */}
    <div>
      <div style={{ ...A.h2, fontSize: 22, marginBottom: 10 }}>Why these, specifically.</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontFamily: FONTS.body }}>
        <thead><tr>
          <th style={{ textAlign:'left', ...A.num, padding:'8px 0' }}></th>
          <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>Color</th>
          <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>Cross-cultural read</th>
          <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>What we want it to signal</th>
          <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>Where it lives</th>
        </tr></thead>
        <tbody>
          <PsyRow swatch={T.purple}  name="Hero Violet"
            association="Royalty, creativity, imagination. In digital products: Twitch, Cash App, Yahoo — used to flag 'this is the brand'."
            signal="Curated. Premium. Not your grandpa's joke book."
            where="CTAs, the search ring, JOTD card, primary type accents." />
          <PsyRow swatch={T.lime} name="Punchline Lime"
            association="Energy, surprise, electricity. Bottega Veneta's reclaim of acid-green made it feel modern again."
            signal="The laugh itself. The dopamine spike of a punchline landing."
            where="Pills marking 'NEW', selected onboarding cards, the Mystery-Box reward FAB." />
          <PsyRow swatch={T.amber} name="Honey"
            association="Warmth, comfort, retro humor. Memory of yellow notebook punchlines."
            signal="Wholesome / family-friendly tier. Saturday-morning energy."
            where="Kid-Safe vibe cards, weekly-curated tile, badges." />
          <PsyRow swatch={T.ink}  name="Type Ink"
            association="Editorial seriousness. Off-black (#2E2F2F) is warmer than #000 — feels like newsprint, not a terminal."
            signal="The jokes are the content. Type does the work."
            where="All body, headlines, navigation. Never pure black."  />
          <PsyRow swatch={T.bg}    name="Paper"
            association="A 4% warm tint of white reads as paper, not screen — supports the 'curated library' mental model."
            signal="Calm canvas. The jokes are the fireworks."
            where="Page background, app shell." />
        </tbody>
      </table>
    </div>

    {/* Pairings + a11y + don'ts */}
    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap: 20 }}>
      <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 24, padding: 22 }}>
        <div style={A.num}>Sanctioned pairings</div>
        <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 12 }}>
          {[
            { l: T.purple,  r: '#fff',     label:'Violet on white — primary CTA' },
            { l: T.lime,    r: T.limeDark, label:'Lime on lime-dark — selected card' },
            { l: T.ink,     r: T.bg,       label:'Ink on paper — body & headline' },
            { l: T.amber,   r: T.amberDark,label:'Honey on espresso — wholesome tier' },
            { l: T.purpleTint,r: T.purple, label:'Tint on violet — secondary chip' },
          ].map((p,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap: 12 }}>
              <div style={{ display:'flex', borderRadius: 8, overflow:'hidden', border:`1px solid ${T.line}` }}>
                <div style={{ width: 24, height: 24, background: p.l }} />
                <div style={{ width: 24, height: 24, background: p.r }} />
              </div>
              <div style={{ ...A.body, fontSize: 13, color: T.ink }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 24, padding: 22 }}>
        <div style={A.num}>Accessibility</div>
        <div style={{ ...A.body, marginTop: 10, fontSize: 13 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap: 6 }}>
            <span>Ink #2E2F2F on Paper</span><strong style={{ color: T.ink }}>13.1 : 1 ✓ AAA</strong>
            <span>Violet on white</span><strong style={{ color: T.ink }}>5.6 : 1 ✓ AA</strong>
            <span>Lime on lime-dark</span><strong style={{ color: T.ink }}>9.2 : 1 ✓ AAA</strong>
            <span>Honey on espresso</span><strong style={{ color: T.ink }}>8.1 : 1 ✓ AAA</strong>
            <span style={{ color: T.ed_red }}>Lime on white (text)</span><strong style={{ color: T.ed_red }}>1.4 : 1 ✗</strong>
          </div>
        </div>
        <div style={{ ...A.small, marginTop: 10 }}>→ Lime is decorative. Never load-bearing for text.</div>
      </div>
      <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 24, padding: 22 }}>
        <div style={A.num}>Don'ts</div>
        <ul style={{ margin: 0, padding:'10px 0 0 16px', ...A.body, fontSize: 13 }}>
          <li>No pure black (#000) — feels like a terminal.</li>
          <li>No two-violet gradients on body cards. Reserve gradient for the JOTD hero.</li>
          <li>Lime + amber together is loud — separate by neutral.</li>
          <li>No red as accent. Red is reserved for destructive only.</li>
          <li>No cool grays — they fight the warm paper.</li>
        </ul>
      </div>
    </div>
  </div>
);

window.ColorBoard = ColorBoard;
