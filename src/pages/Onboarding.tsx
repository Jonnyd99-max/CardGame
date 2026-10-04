import { isPokemon } from "../game/gameMode";
import { GameModeToggle } from "../components/GameModeToggle";
import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { franchises } from "../data/franchises";
import { characters } from "../data/characters";
import { Artwork } from "../components/Card";
export function Onboarding({
  onStart,
}: {
  onStart: (name: string, franchise: string, character: string) => void;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(""),
    [franchise, setFranchise] = useState(franchises[0].id),
    [character, setCharacter] = useState(
      characters.find(
        (c) => c.franchise === franchises[0].id && c.unlockLevel === 1,
      )!.id,
    );
  return (
    <main className="onboarding">
      <GameModeToggle />
      <div className="brand">
        <span className="brand-mark">
          <Zap fill="currentColor" />
        </span>
        <div>
          {isPokemon ? "JD POKÉMON" : "JD MULTIVERSE"}
          <small>BATTLE CARDS</small>
        </div>
      </div>
      <span className="eyebrow">YOUR ORIGIN STORY · 0{step + 1} / 03</span>
      <h1>
        {step === 0 ? (
          <>
            Every legend has
            <br />a <em>beginning.</em>
          </>
        ) : step === 1 ? (
          <>
            Choose your
            <br />
            <em>{isPokemon ? "type." : "universe."}</em>
          </>
        ) : (
          <>
            Meet your first
            <br />
            <em>legend.</em>
          </>
        )}
      </h1>
      <p>
        {step === 0
          ? isPokemon
            ? "Collect the original 151 Pokémon. What should we call you, Trainer?"
            : "A collection across worlds. A battle beyond limits. What should we call you?"
          : step === 1
            ? isPokemon
              ? "Choose your favourite type for your Kanto team and theme. You can change it anytime."
              : "Your universe sets your starting deck and visual theme. You can change it anytime."
            : isPokemon
              ? "Four Common basic Pokémon are yours. Choose your starter, then upgrade it to unlock evolutions."
              : "Four starter cards are yours. Choose the face of your adventure."}
      </p>
      {step === 0 ? (
        <label className="name-input">
          Player name
          <input
            autoFocus
            maxLength={24}
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) setStep(1);
            }}
          />
        </label>
      ) : step === 1 ? (
        <div className="onboard-universes">
          {franchises.map((f) => (
            <button
              className={`panel ${franchise === f.id ? "selected" : ""}`}
              key={f.id}
              onClick={() => {
                setFranchise(f.id);
                setCharacter(
                  characters.find(
                    (c) => c.franchise === f.id && c.unlockLevel === 1,
                  )!.id,
                );
              }}
            >
              <span style={{ color: f.color }}>{f.symbol}</span>
              <b>{f.name}</b>
              <small>{f.subtitle}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="starter-picker">
          {characters
            .filter((c) => c.franchise === franchise && c.unlockLevel === 1)
            .map((c) => (
              <button
                key={c.id}
                className={`panel ${character === c.id ? "selected" : ""}`}
                onClick={() => setCharacter(c.id)}
              >
                <Artwork character={c} />
                <b>{c.name}</b>
                <small>{c.rarity}</small>
              </button>
            ))}
        </div>
      )}
      <div className="button-row">
        {step > 0 && (
          <button className="secondary" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button
          className="primary"
          disabled={!name.trim()}
          onClick={() =>
            step < 2
              ? setStep(step + 1)
              : onStart(name.trim(), franchise, character)
          }
        >
          {step === 2 ? "Begin tutorial battle" : "Continue"}
          <ArrowRight size={18} />
        </button>
      </div>
      <small className="onboarding-note">
        Built for play. No purchases. Your progress stays on this device.
      </small>
    </main>
  );
}
