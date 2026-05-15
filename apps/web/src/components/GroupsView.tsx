import { GROUPS } from "../data/wk";
import { GroupCard } from "./GroupCard";

export function GroupsView() {
  return (
    <div className="section">
      <div className="section-head">
        <h2>De twaalf poules</h2>
        <div className="hint">
          geselecteerd via de loting op 5 dec 2025 · Washington D.C.
        </div>
      </div>
      <div className="legend">
        <span className="chip">
          <span className="swatch host"></span> gastland (vooraf geplaatst)
        </span>
        <span className="chip">
          <span className="swatch"></span> België
        </span>
        <span className="chip">
          <span className="swatch placeholder"></span> de top-2 + 8 beste derdes plaatsen zich
        </span>
      </div>
      <div className="groups">
        {GROUPS.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}
