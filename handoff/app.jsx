// WK 2026 — main App
const { useState: useStateApp, useEffect: useEffectApp } = React;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "tab": "groups",
  "density": "comfortable",
  "highlightBelgium": true,
  "surface": "dark",
  "accent": "#2fd4b0"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = window.useTweaks(DEFAULTS);

  useEffectApp(() => {
    document.body.dataset.surface = tweaks.surface;
    document.documentElement.style.setProperty("--fari-mint", tweaks.accent);
  }, [tweaks.surface, tweaks.accent]);

  const tab = tweaks.tab;
  const setTab = (v) => setTweak("tab", v);

  return (
    <React.Fragment>
      <div className="fari-bg"></div>
      <div className="shell">
        <Header tz="BE" />
        <FactsRow />
        <Tabs value={tab} onChange={setTab} />
        {tab === "groups"   && <GroupsView tweaks={tweaks} />}
        {tab === "calendar" && <CalendarView tweaks={tweaks} />}
        {tab === "bracket"  && <BracketView tweaks={tweaks} />}
      </div>
      <Footer />

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Weergave">
          <window.TweakRadio
            label="Sectie"
            value={tweaks.tab}
            options={[
              { value: "groups",   label: "Poules" },
              { value: "calendar", label: "Kalender" },
              { value: "bracket",  label: "Bracket" },
            ]}
            onChange={(v) => setTweak("tab", v)}
          />
          <window.TweakRadio
            label="Achtergrond"
            value={tweaks.surface}
            options={[
              { value: "dark",  label: "FARI blauw" },
              { value: "light", label: "Wit" },
            ]}
            onChange={(v) => setTweak("surface", v)}
          />
          <window.TweakRadio
            label="Dichtheid"
            value={tweaks.density}
            options={[
              { value: "comfortable", label: "Comfort" },
              { value: "compact",     label: "Compact" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Stijl">
          <window.TweakColor
            label="Accentkleur"
            value={tweaks.accent}
            options={["#2fd4b0", "#ff8a5b", "#ffc94d", "#c94dff"]}
            onChange={(v) => setTweak("accent", v)}
          />
          <window.TweakToggle
            label="België highlighten"
            value={tweaks.highlightBelgium}
            onChange={(v) => setTweak("highlightBelgium", v)}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
