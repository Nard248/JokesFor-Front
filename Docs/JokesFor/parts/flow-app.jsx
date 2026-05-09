/* JokesFor — Router shell */
const SCREENS = {
  login:    { num:"01", name:"Login",                 cmp: () => <LoginScreen/> },
  register: { num:"02", name:"Register",              cmp: () => <RegisterScreen/> },
  onb1:     { num:"03", name:"Onboarding · Vibes",    cmp: () => <OnbVibesScreen/> },
  onb2:     { num:"04", name:"Onboarding · Formats",  cmp: () => <OnbFormatsScreen/> },
  onb3:     { num:"05", name:"Onboarding · Ritual",   cmp: () => <OnbRitualScreen/> },
  today:    { num:"06", name:"Today",                 cmp: () => <TodayScreen/> },
  explore:  { num:"07", name:"Explore",               cmp: () => <ExploreScreen/> },
  search:   { num:"08", name:"Search",                cmp: () => <SearchScreen/> },
  library:  { num:"06b",name:"Today",                 cmp: () => <TodayScreen/> },
};

function App() {
  const initial = (location.hash || "#login").slice(1);
  const [route, setRoute] = React.useState(SCREENS[initial] ? initial : "login");
  React.useEffect(() => {
    window.__goto = (id) => { if (SCREENS[id]) { setRoute(id); location.hash = id; window.scrollTo({top:0,behavior:"instant"}); } };
    const onHash = () => { const id = location.hash.slice(1); if (SCREENS[id]) setRoute(id); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  React.useEffect(() => {
    document.querySelectorAll(".proto-nav [data-go]").forEach(a => {
      a.classList.toggle("is-active", a.getAttribute("data-go") === route);
    });
  }, [route]);
  const S = SCREENS[route];
  return (
    <>
      <FrameLabel num={S.num} name={S.name}/>
      {S.cmp()}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App/>);
