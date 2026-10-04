import { isPokemon } from "./game/gameMode";
import { GameModeToggle } from "./components/GameModeToggle";
import { progression } from "./data/unlocks";
import { useState, useEffect, useRef } from "react";
import {
  Home as HomeIcon,
  Swords,
  Layers,
  Users,
  Zap,
  Shield,
  Gift,
  Target,
  User,
  Settings as SettingsIcon,
  ChevronRight,
  Coins,
  Menu,
  Box,
} from "lucide-react";
import { Home } from "./pages/Home";
import { Collection } from "./pages/Collection";
import { BattlePage } from "./pages/Battle";
import { Campaign, Packs } from "./pages/Adventures";
import { claimChapter } from "./game/adventures";
import { CharacterDetail } from "./pages/CharacterDetail";
import { Upgrades, Equipment, Rewards, Challenges } from "./pages/Progression";
import { Decks } from "./pages/Decks";
import { Settings } from "./pages/Settings";
import { Profile, Groups } from "./pages/Profile";
import { Onboarding } from "./pages/Onboarding";
import { DevEditor } from "./pages/DevEditor";
import { HeroCreator } from "./pages/HeroCreator";
import { SaveRecovery } from "./pages/SaveRecovery";
import { saveStorage, newSave } from "./state/save";
import { playerLevel, refreshPeriods } from "./game/progression";
import { rewardMatch } from "./game/battle";
import { themes } from "./data/themes";
import { franchises } from "./data/franchises";
import { Progress } from "./components/UI";
import { useInstall } from "./hooks/useInstall";
import { audio } from "./utils/audio";
import type { Save } from "./types";
const nav = [
  ["Home", HomeIcon],
  ["Play", Swords],
  ["Campaign", Target],
  ["Boss Battles", Swords],
  ["Card Packs", Gift],
  ["My Collection", Layers],
  ["Make a Hero", User],
  ["Teams / Groups", Users],
  ["My Decks", Box],
  ["Upgrade", Zap],
  ["Equipment", Shield],
  ["Rewards", Gift],
  ["Challenges", Target],
  ["Profile", User],
  ["Settings", SettingsIcon],
] as const;
export default function App() {
  const installation = useInstall();
  const [save, setSave] = useState<Save | null>(() => saveStorage.load()),
    [page, setPage] = useState(location.hash === "#dev" ? "Developer" : "Home"),
    [detail, setDetail] = useState(""),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [tutorial, setTutorial] = useState(false);
  const previousOwned = useRef(save?.owned.length || 0);
  const previousAudioSave = useRef(save);
  useEffect(() => {
    if (
      save &&
      previousOwned.current &&
      save.owned.length > previousOwned.current
    ) {
      setToast(
        `${save.owned.length - previousOwned.current} new legends unlocked. Find them in your collection.`,
      );
      if (
        save.packsOpened === previousAudioSave.current?.packsOpened &&
        save.history[0]?.date === previousAudioSave.current?.history[0]?.date
      )
        audio.play("unlock");
    }
    previousOwned.current = save?.owned.length || 0;
  }, [save?.owned.length]);
  useEffect(() => {
    const old = previousAudioSave.current;
    previousAudioSave.current = save;
    if (
      !save ||
      !old ||
      save.packsOpened !== old.packsOpened ||
      save.history[0]?.date !== old.history[0]?.date
    )
      return;
    audio.enabled = save.settings.sound;
    const upgraded = Object.entries(save.cards).some(
      ([id, p]) =>
        old.cards[id] &&
        (p.level !== old.cards[id].level ||
          JSON.stringify(p.boosts) !== JSON.stringify(old.cards[id].boosts) ||
          JSON.stringify(p.abilities) !==
            JSON.stringify(old.cards[id].abilities)),
    );
    const equipped = Object.entries(save.cards).some(
      ([id, p]) =>
        old.cards[id] &&
        JSON.stringify(p.equipment) !== JSON.stringify(old.cards[id].equipment),
    );
    if (upgraded) audio.play("upgrade");
    else if (
      equipped ||
      JSON.stringify(save.items) !== JSON.stringify(old.items)
    )
      audio.play("equip");
    else if (
      save.claimed.length > old.claimed.length ||
      save.daily !== old.daily
    )
      audio.play("reward");
  }, [save]);
  useEffect(() => {
    const refresh = () =>
      setSave((current) => {
        if (!current) return current;
        const next = refreshPeriods(structuredClone(current));
        return next.periods.daily === current.periods.daily &&
          next.periods.weekly === current.periods.weekly
          ? current
          : next;
      });
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    audio.enabled = save?.settings.sound || false;
  }, [save?.settings.sound]);
  useEffect(() => {
    if (save)
      try {
        saveStorage.save(save);
      } catch {
        setToast(
          "Storage is full or unavailable. Export your save from Settings.",
        );
      }
  }, [save]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const handler = () => {
      if (location.hash === "#dev") setPage("Developer");
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  function update(fn: (s: Save) => void) {
    setSave((current) => {
      if (!current) return current;
      const next = refreshPeriods(structuredClone(current));
      fn(next);
      return next;
    });
  }
  function navigate(p: string) {
    setPage(p);
    setDetail("");
    setMobile(false);
    window.scrollTo(0, 0);
  }
  if (!save && saveStorage.error)
    return (
      <SaveRecovery
        message={saveStorage.error}
        restore={(restored) => {
          saveStorage.error = "";
          setSave(restored);
        }}
        reset={() => {
          saveStorage.clear();
          saveStorage.error = "";
          setSave(null);
          setPage("Home");
        }}
      />
    );
  if (!save)
    return (
      <Onboarding
        onStart={(name, f, c) => {
          setSave(newSave(name, f, c));
          setTutorial(true);
          setPage("Play");
        }}
      />
    );
  const theme = themes[save.franchise] || themes.marvel;
  const current = page.split(":")[0];
  return (
    <div
      data-universe={save.franchise}
      className={`app ${!save.settings.animations || save.settings.reducedMotion ? "reduce-motion" : ""}`}
      style={
        {
          "--accent": theme.accent,
          "--glow": theme.glow,
        } as React.CSSProperties
      }
    >
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button className="brand" onClick={() => navigate("Home")}>
          <span className="brand-mark">
            <Zap fill="currentColor" />
          </span>
          <div>
            {isPokemon ? "JD POKÉMON" : "JD MULTIVERSE"}
            <small>BATTLE CARDS</small>
          </div>
        </button>
        <span className="nav-caption">
          {isPokemon ? "YOUR KANTO ADVENTURE" : "YOUR MULTIVERSE"}
        </span>
        <nav>
          {nav
            .filter(([name]) => !isPokemon || name !== "Make a Hero")
            .map(([name, Icon]) => (
              <button
                className={
                  current === name ||
                  (current === "Collection" && name === "My Collection")
                    ? "active"
                    : ""
                }
                key={name}
                onClick={() => navigate(name)}
              >
                <Icon size={19} />
                <span>
                  {isPokemon && name === "Teams / Groups"
                    ? "Pokémon Types"
                    : isPokemon && name === "Equipment"
                      ? "Items & Trainers"
                      : isPokemon && name === "Boss Battles" ? "Gym Leaders"
                      : isPokemon && name === "My Collection" ? "Pokédex"
                      : name}
                </span>
                {name === "My Collection" && <small>{save.owned.length}</small>}
                {name === "Play" && <span className="live-dot" />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="theme-tag">
            <span className="live-dot" />
            <section>
              <small>{isPokemon ? "ACTIVE TYPE" : "ACTIVE UNIVERSE"}</small>
              <b>{franchises.find((f) => f.id === save.franchise)?.name}</b>
            </section>
          </div>
          <button
            className="sidebar-profile"
            onClick={() => navigate("Profile")}
          >
            <span className="avatar">
              {save.name.charAt(0).toUpperCase() || "J"}
            </span>
            <section>
              <b>{save.name}</b>
              <small>Level {playerLevel(save.xp)} explorer</small>
              <Progress
                value={save.xp % progression.xpPerPlayerLevel}
                max={progression.xpPerPlayerLevel}
              />
            </section>
            <ChevronRight size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>{isPokemon ? "Pokémon" : "Multiverse"}</span>
            <ChevronRight size={14} />
            <b>
              {detail
                ? "Character details"
                : current === "Collection"
                  ? "My Collection"
                  : isPokemon && current === "Boss Battles" ? "Gym Leaders"
                  : isPokemon && current === "My Collection" ? "Pokédex"
                  : current}
            </b>
          </div>
          <div className="topbar-right">
            <GameModeToggle beforeSwitch={() => saveStorage.save(save)} />
            <span className="currency">
              <Coins size={18} />
              <b>{save.coins.toLocaleString()}</b>
            </span>
            <span className="materials">
              <Box size={17} /> {save.materials}
            </span>
            <span className="level-chip">LV {playerLevel(save.xp)}</span>
            <button
              className="avatar"
              aria-label="Your profile"
              onClick={() => navigate("Profile")}
            >
              {save.name.charAt(0).toUpperCase() || "J"}
            </button>
          </div>
        </header>
        <main className="content" key={detail || page}>
          {detail ? (
            <>
              <button
                className="text-button back"
                onClick={() => setDetail("")}
              >
                ← Back to {current}
              </button>
              <CharacterDetail
                id={detail}
                save={save}
                update={update}
                notify={setToast}
              />
            </>
          ) : current === "Home" ? (
            <Home save={save} navigate={navigate} detail={setDetail} />
          ) : current === "My Collection" || current === "Collection" ? (
            <Collection
              save={save}
              detail={setDetail}
              initial={page.split(":")[1]}
            />
          ) : current === "Make a Hero" ? (
            <HeroCreator
              save={save}
              update={update}
              notify={setToast}
              navigate={navigate}
            />
          ) : current === "Play" ? (
            <BattlePage
              save={save}
              tutorial={tutorial}
              onComplete={(b) => {
                update((s) => {
                  rewardMatch(s, b);
                });
              }}
              onExit={() => {
                setTutorial(false);
                navigate("Home");
              }}
            />
          ) : current === "Campaign" || current === "Boss Battles" ? (
            <Campaign
              save={save}
              bosses={current === "Boss Battles"}
              complete={(b) =>
                update((s) => {
                  claimChapter(s, b);
                  rewardMatch(s, b);
                })
              }
            />
          ) : current === "Card Packs" ? (
            <Packs save={save} update={update} />
          ) : current === "Upgrade" ? (
            <Upgrades save={save} detail={setDetail} />
          ) : current === "Equipment" ? (
            <Equipment save={save} update={update} />
          ) : current === "Rewards" ? (
            <Rewards save={save} update={update} />
          ) : current === "Challenges" ? (
            <Challenges save={save} update={update} />
          ) : current === "My Decks" ? (
            <Decks save={save} update={update} />
          ) : current === "Settings" ? (
            <Settings
              save={save}
              update={update}
              replace={setSave}
              notify={setToast}
              install={
                installation.available ? installation.install : undefined
              }
              reset={() => {
                saveStorage.clear();
                setSave(null);
                navigate("Home");
              }}
            />
          ) : current === "Profile" ? (
            <Profile save={save} />
          ) : current === "Developer" ? (
            <DevEditor save={save} />
          ) : (
            <Groups save={save} detail={setDetail} />
          )}
        </main>
        <footer>
          <span>
            {isPokemon
              ? "JD POKÉMON BATTLE CARDS"
              : "JD MULTIVERSE BATTLE CARDS"}
          </span>
          <small>Collect. Evolve. Become legendary.</small>
          <span>
            LOCAL SAVE <i className="live-dot" />
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
