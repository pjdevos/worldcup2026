// Hand-rolled DB types, mirroring supabase/migrations/0001_init.sql.
// Once the schema stabilises we can regenerate via:
//   pnpm dlx supabase gen types typescript --project-id <ref> > database.types.ts

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type MatchStatus =
  | "SCHEDULED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "SUSPENDED";
export type ResultSource = "cron" | "admin";

export interface DbTeam {
  code: string;
  name_nl: string;
  flag: string;
  is_host: boolean;
  is_home: boolean;
}

export interface DbVenue {
  id: number;
  city: string;
  country: string;
  name: string;
  cap: number;
}

export interface DbMatch {
  id: number;
  stage: Stage;
  group_id: string | null;
  kick_at: string;
  venue_id: number | null;
  home_team: string | null;
  away_team: string | null;
  home_slot: string | null;
  away_slot: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  external_id: string | null;
  result_entered_at: string | null;
  result_source: ResultSource | null;
}

export interface DbProfile {
  user_id: string;
  display_name: string;
  team_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface DbPrediction {
  id: string;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points: number | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbScoringRule {
  key: string;
  value: number;
}

export interface DbCronLog {
  id: number;
  ran_at: string;
  job: string;
  checked: number;
  updated: number;
  errors: number;
  detail: unknown;
}

interface DbLeaderboardRow {
  user_id: string;
  display_name: string;
  team_name: string | null;
  points: number;
  scored: number;
}

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: DbTeam;
        Insert: DbTeam;
        Update: Partial<DbTeam>;
        Relationships: [];
      };
      venues: {
        Row: DbVenue;
        Insert: Omit<DbVenue, "id"> & { id?: number };
        Update: Partial<DbVenue>;
        Relationships: [];
      };
      matches: {
        Row: DbMatch;
        Insert: DbMatch;
        Update: Partial<DbMatch>;
        Relationships: [];
      };
      profiles: {
        Row: DbProfile;
        Insert: Omit<DbProfile, "created_at"> & { created_at?: string };
        Update: Partial<DbProfile>;
        Relationships: [];
      };
      predictions: {
        Row: DbPrediction;
        Insert: Omit<DbPrediction, "id" | "created_at" | "updated_at" | "points" | "locked_at"> & {
          id?: string;
        };
        Update: Partial<DbPrediction>;
        Relationships: [];
      };
      scoring_rules: {
        Row: DbScoringRule;
        Insert: DbScoringRule;
        Update: Partial<DbScoringRule>;
        Relationships: [];
      };
      cron_logs: {
        Row: DbCronLog;
        Insert: Omit<DbCronLog, "id" | "ran_at"> & { id?: number; ran_at?: string };
        Update: Partial<DbCronLog>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: DbLeaderboardRow;
        Relationships: [];
      };
    };
    Functions: {
      // no exposed RPCs yet — score_match will land in a follow-up migration
    };
    Enums: {
      stage: Stage;
      match_status: MatchStatus;
      result_source: ResultSource;
    };
    CompositeTypes: {
      // none
    };
  };
}
