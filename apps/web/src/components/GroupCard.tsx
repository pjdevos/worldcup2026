import { TEAMS, type Group } from "../data/wk";

export function GroupCard({ group }: { group: Group }) {
  return (
    <div className="group" data-group={group.id}>
      <div className="group-head">
        <div className="group-letter">
          Groep <b>{group.id}</b>
        </div>
        <div className="group-cohort">{group.teams[0]}</div>
      </div>
      <ol>
        {group.teams.map((tid, i) => {
          const t = TEAMS[tid];
          const isHome = Boolean(t.home);
          return (
            <li key={tid} className={isHome ? "is-home" : ""}>
              <span className="pos">
                {group.id}
                {i + 1}
              </span>
              <span className="code-badge">{t.code}</span>
              <span className="country">
                {t.name}
                {t.host && <span className="host-badge">GASTLAND</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
