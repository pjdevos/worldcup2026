import { GROUPS } from "../data/wk";
import { GroupCard } from "./GroupCard";

export function GroupsView() {
  return (
    <div className="section">
      <div className="section-head">
        <h2>The twelve groups</h2>
        <div className="hint">
          drawn on 5 Dec 2025 · Washington D.C.
        </div>
      </div>
      <div className="legend">
        <span className="chip">
          <span className="swatch host"></span> host (seeded in advance)
        </span>
        <span className="chip">
          <span className="swatch"></span> Belgium
        </span>
        <span className="chip">
          <span className="swatch placeholder"></span> top 2 + 8 best thirds advance
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
