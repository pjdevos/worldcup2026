import { useSearchParams } from "react-router-dom";
import { BracketView } from "../components/BracketView";
import { CalendarView } from "../components/CalendarView";
import { FactsRow } from "../components/FactsRow";
import { GroupsView } from "../components/GroupsView";
import { Header } from "../components/Header";
import { Tabs, type ScheduleTab } from "../components/Tabs";

const VALID: ReadonlyArray<ScheduleTab> = ["groups", "calendar", "bracket"];

function isTab(v: string | null): v is ScheduleTab {
  return v !== null && (VALID as ReadonlyArray<string>).includes(v);
}

export function SchedulePage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: ScheduleTab = isTab(raw) ? raw : "groups";

  const setTab = (next: ScheduleTab) => {
    const p = new URLSearchParams(params);
    p.set("tab", next);
    setParams(p, { replace: true });
  };

  return (
    <>
      <Header />
      <FactsRow />
      <Tabs value={tab} onChange={setTab} />
      {tab === "groups" && <GroupsView />}
      {tab === "calendar" && <CalendarView />}
      {tab === "bracket" && <BracketView />}
    </>
  );
}
