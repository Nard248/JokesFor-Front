// 04 Hooked framework — Trigger / Action / Variable Reward / Investment
// 05 Competitive scan
// 06 Mood directions

const HookStep = ({ tag, title, body, mock, accent=T.purple }) => (
  <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius: 24, padding: 22, display:'grid', gridTemplateRows:'auto 1fr auto', gap: 14, height: 360 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <Tag bg={accent === T.lime ? T.lime : (accent === T.amber ? T.amber : T.purpleTint)}
           fg={accent === T.lime ? T.limeDark : (accent === T.amber ? T.amberDark : T.purple)}>{tag}</Tag>
      <div style={{ width: 28, height: 28, borderRadius: 999, background: accent, color: '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 800, fontSize: 12 }}>{tag.split(' ')[0]}</div>
    </div>
    <div>
      <div style={{ ...A.h2, fontSize: 22 }}>{title}</div>
      <div style={{ ...A.body, fontSize: 13, marginTop: 8 }}>{body}</div>
    </div>
    <div>{mock}</div>
  </div>
);

const PushMock = () => (
  <div style={{ background: T.bg, borderRadius: 16, border:`1px solid ${T.line}`, padding: 12, display:'flex', gap: 10, alignItems:'center' }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: T.ink, color: T.lime, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: FONTS.display, fontWeight: 900 }}>J</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 12, color: T.ink }}>JokesFor · 8:02 AM</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 12, color: T.mute }}>☕ Morning. Today's joke is a 3-second read for your standup.</div>
    </div>
  </div>
);

const SearchMock = () => (
  <div style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: 999, padding: '8px 14px', display:'flex', alignItems:'center', gap: 8 }}>
    <Icon name="search" size={14} stroke={2.2} />
    <span style={{ fontFamily: FONTS.body, fontSize: 12, color: T.sub }}>"icebreaker for engineering all-hands"</span>
  </div>
);

const RewardMock = () => (
  <div style={{ background: `linear-gradient(135deg, ${T.purple}, ${T.purpleLt})`, color:'#fff', borderRadius: 16, padding: 14 }}>
    <div style={{ ...A.num, color:'rgba(255,255,255,.7)' }}>Mystery box</div>
    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, marginTop: 6, lineHeight: 1.15 }}>Tap for a joke you didn't ask for.</div>
    <div style={{ display:'inline-flex', alignItems:'center', gap: 6, marginTop: 10, height: 26, borderRadius: 999, background: T.lime, color: T.limeDark, padding:'0 10px', fontSize: 11, fontWeight: 800, fontFamily: FONTS.body }}>SHUFFLE →</div>
  </div>
);

const InvestMock = () => (
  <div style={{ display:'flex', gap: 8 }}>
    <div style={{ flex: 1, background:'#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: 10 }}>
      <div style={{ ...A.num, color: T.ink }}>14d</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: T.ink, marginTop: 2 }}>Streak</div>
    </div>
    <div style={{ flex: 1, background: T.lime, borderRadius: 14, padding: 10 }}>
      <div style={{ ...A.num, color: T.limeDark }}>42</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: T.limeDark, marginTop: 2 }}>Saved</div>
    </div>
    <div style={{ flex: 1, background: T.amber, borderRadius: 14, padding: 10 }}>
      <div style={{ ...A.num, color: T.amberDark }}>3</div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: T.amberDark, marginTop: 2 }}>Boards</div>
    </div>
  </div>
);

const HookedBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'48px 56px', display:'grid', gridTemplateRows:'auto 1fr auto', gap: 24 }}>
    <div>
      <div style={A.num}>04 · Hooked behaviour loop</div>
      <div style={{ ...A.h1, fontSize: 56, marginTop: 12 }}>The dopamine engine.</div>
      <div style={{ ...A.body, fontSize: 16, marginTop: 12, maxWidth: 940 }}>
        Nir Eyal's loop is a useful diagnostic, not a manipulation playbook — the question is whether each step earns its place. Here is how the four moments are designed into the surface, what they cost, and the small feature each one ships as.
      </div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16 }}>
      <HookStep tag="01 Trigger" accent={T.purple}
        title="Morning Kickoff push"
        body="External trigger times to the standup window (8 AM weekdays) — internal trigger over time becomes 'I'm about to walk into a room.' The push opens a one-tap JOTD."
        mock={<PushMock />} />
      <HookStep tag="02 Action" accent={T.lime}
        title="Search-by-context"
        body="Lowest-friction action in the category. No login required for one search. Type the moment ('engineering all-hands'), get five appropriate punchlines."
        mock={<SearchMock />} />
      <HookStep tag="03 Reward" accent={T.amber}
        title="Mystery Box & vibe roulette"
        body="Variable schedule beats fixed feed. The Shuffle FAB returns a joke from a humor type the user has saved at least once — recognizable enough to land, surprising enough to dopamine."
        mock={<RewardMock />} />
      <HookStep tag="04 Investment" accent={T.purpleSec}
        title="Boards, streaks, submissions"
        body="The user does work that improves their next session: saves a joke into a board, extends a 14-day streak, or submits an original. Investment beats engagement metrics for retention."
        mock={<InvestMock />} />
    </div>
    <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 16, display:'grid', gridTemplateColumns:'2fr 1fr', gap: 24 }}>
      <div>
        <div style={A.num}>Loop diagram</div>
        <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap: 12, color: T.ink, fontFamily: FONTS.display, fontWeight: 800, fontSize: 18 }}>
          <span>Push</span><Icon name="arrow-r" size={16}/>
          <span>Search/Tap</span><Icon name="arrow-r" size={16}/>
          <span style={{ color: T.purple }}>Punchline</span><Icon name="arrow-r" size={16}/>
          <span>Save / Streak / Submit</span><Icon name="arrow-r" size={16}/>
          <span style={{ color: T.sub }}>↻ stronger trigger next time</span>
        </div>
      </div>
      <div>
        <div style={A.num}>Anti-pattern guardrails</div>
        <div style={{ ...A.small, marginTop: 8 }}>
          • No infinite scroll. The feed paginates. <br/>
          • Streak does not punish breaks (forgiving "freeze" days). <br/>
          • Notifications never use red badges or fake urgency.
        </div>
      </div>
    </div>
  </div>
);

// 05 Competitive scan
const CompetitorRow = ({ name, what, takeaway, avoid, dot }) => (
  <tr>
    <td style={{ padding:'14px 0', borderBottom: `1px solid ${T.line}`, width: 140, ...A.h2, fontSize: 16 }}>
      <span style={{ display:'inline-block', width: 8, height: 8, borderRadius: 999, background: dot, marginRight: 8, verticalAlign:'middle' }} />
      {name}
    </td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, ...A.body, fontSize: 13, width: 260 }}>{what}</td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, ...A.body, fontSize: 13, color: T.ink }}><strong>Steal:</strong> {takeaway}</td>
    <td style={{ padding:'14px 12px', borderBottom: `1px solid ${T.line}`, ...A.body, fontSize: 13, color: T.ed_red }}><strong>Avoid:</strong> {avoid}</td>
  </tr>
);

const CompetitiveBoard = () => (
  <div style={{ ...A.paper, width:'100%', height:'100%', padding:'48px 56px', display:'grid', gridTemplateRows:'auto auto 1fr', gap: 22 }}>
    <div>
      <div style={A.num}>05 · Competitive landscape</div>
      <div style={{ ...A.h1, fontSize: 56, marginTop: 12 }}>The white space.</div>
      <div style={{ ...A.body, fontSize: 16, marginTop: 12, maxWidth: 940 }}>
        Nobody owns "joke search". The category is split between social-first chaos (Reddit, iFunny), passive feed (TikTok), curation surfaces (Pinterest, Substack), and the recommendation-engine playbook (Spotify). The opening: marry Spotify's <em>contextual surfacing</em> with Pinterest's <em>save-and-curate</em> craft, against a far more focused content type.
      </div>
    </div>

    {/* matrix */}
    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap: 24, alignItems:'stretch' }}>
      <div style={{ position:'relative', width: 260, height: 260, background:'#fff', border: `1px solid ${T.line}`, borderRadius: 20 }}>
        {/* axes */}
        <div style={{ position:'absolute', inset:'8% 8%', borderLeft:`1px solid ${T.line}`, borderBottom:`1px solid ${T.line}` }} />
        <div style={{ position:'absolute', left: 18, top: 8, ...A.num, color: T.ink }}>Curated</div>
        <div style={{ position:'absolute', left: 18, bottom: 8, ...A.num, color: T.ink }}>Chaotic</div>
        <div style={{ position:'absolute', right: 18, bottom: 16, ...A.num, color: T.ink }}>Personal →</div>
        <div style={{ position:'absolute', left: 24, bottom: 24, ...A.num, color: T.ink }}>← Public</div>
        {/* dots */}
        {[
          { l:'Reddit', x: 30, y: 78, c: '#FF4500' },
          { l:'iFunny',  x: 18, y: 92, c: '#FFC700' },
          { l:'TikTok', x: 56, y: 84, c: '#000' },
          { l:'Pinterest', x: 84, y: 18, c: '#E60023' },
          { l:'Spotify', x: 88, y: 30, c: '#1DB954' },
          { l:'Substack', x: 36, y: 24, c: '#FF6719' },
          { l:'JokesFor', x: 76, y: 24, c: T.purple },
        ].map((p,i)=>(
          <div key={i} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`, transform:'translate(-50%,-50%)', textAlign:'center' }}>
            <div style={{ width: p.l==='JokesFor'? 14:9, height: p.l==='JokesFor'? 14:9, borderRadius: 999, background: p.c, margin:'0 auto', boxShadow: p.l==='JokesFor'? `0 0 0 4px ${T.purpleTint}` : 'none' }} />
            <div style={{ fontFamily: FONTS.body, fontSize: 10, fontWeight: p.l==='JokesFor'? 800:600, marginTop: 4, color: T.ink }}>{p.l}</div>
          </div>
        ))}
      </div>
      <div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily: FONTS.body }}>
          <thead><tr>
            <th style={{ textAlign:'left', ...A.num, padding:'8px 0' }}>Player</th>
            <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>What they do</th>
            <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>What we steal</th>
            <th style={{ textAlign:'left', ...A.num, padding:'8px 12px' }}>What we avoid</th>
          </tr></thead>
          <tbody>
            <CompetitorRow dot="#1DB954" name="Spotify" what="Context-aware feed (Daylist, mood radio). Surfaces music for the moment." takeaway="Time-of-day surfacing. The morning kickoff. Generative session names ('chaotic Tuesday energy')." avoid="Aggressive personalization that flattens variety." />
            <CompetitorRow dot="#E60023" name="Pinterest" what="Visual save-and-board surface. Identity through curation." takeaway="Boards as the user's hero surface. Cover-images, multi-board saves." avoid="Pinning everything is allowed — humor needs taste filters." />
            <CompetitorRow dot="#FF4500" name="Reddit r/Jokes" what="Largest joke corpus. Voted, threaded, raw." takeaway="Voting as ranking signal. Format diversity (story, one-liner, riddle)." avoid="Comment culture, shock humor races, anonymous abuse." />
            <CompetitorRow dot="#000"   name="TikTok"     what="Algorithmic short-form. Humor mostly performed, not written." takeaway="Variable reward done well — but stay text-first to differentiate." avoid="Endless scroll. Bottomless feeds erode the curation promise." />
            <CompetitorRow dot="#FF6719" name="Substack"  what="Curated long-form by author. Subscriptions." takeaway="Editor's-pick weekly. Top Jokesters as creators." avoid="Paywalled content too early — corpus first." />
            <CompetitorRow dot="#FFC700" name="iFunny / 9GAG" what="Image-meme aggregators. Loud, ad-heavy." takeaway="The negative space — there is no curated, calm humor home." avoid="Yellow-and-black, banner ads, race-to-the-bottom edginess." />
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

window.HookedBoard = HookedBoard;
window.CompetitiveBoard = CompetitiveBoard;
