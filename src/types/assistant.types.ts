export type AssistantProvider = 'ollama' | 'openai' | 'anthropic';
export type AssistantRunStatus =
  | 'queued'
  | 'running'
  | 'interrupted'
  | 'waiting_input'
  | 'cancelling'
  | 'completed'
  | 'failed'
  | 'cancelled';
export interface AssistantProfile {
  id: string;
  name: string;
  provider: AssistantProvider;
  base_url: string;
  model: string;
  enabled: boolean;
  has_api_key: boolean;
  temperature?: number;
  max_tokens?: number;
  context_window?: number;
}
export type AssistantProfileInput = Omit<
  AssistantProfile,
  'id' | 'has_api_key'
> & { id?: string; api_key?: string };
export interface AssistantSettings {
  enabled: boolean;
  mutations_enabled: boolean;
  enabled_skills: string[];
  enabled_tools: string[];
  features: {
    planning: boolean;
    memory: boolean;
    ask_user: boolean;
    subagents: boolean;
  };
  default_profile_id: string | null;
}
export interface AssistantSkill {
  id: string;
  name: string;
  description: string;
  tools: string[];
  path?: string;
}
export interface AssistantTool {
  id: string;
  name: string;
  description: string;
  skill_id: string;
  mutating: boolean;
  method: string;
  path: string;
  default_enabled: boolean;
}
export interface AssistantSession {
  id: string;
  title: string;
  status: AssistantRunStatus | 'idle';
  profile_id: string | null;
  created_at: number;
  updated_at: number;
}
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: number;
}
export interface AssistantEvent {
  type: 'event';
  session_id: string;
  seq: number;
  kind: string;
  data: Record<string, unknown>;
  created_at: number;
}
export interface AssistantRun {
  id: string;
  status: AssistantRunStatus;
  interrupt?: unknown;
  interrupts?: unknown[];
  error?: string | null;
}
export interface AssistantUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  runs?: number;
}
export interface AssistantSnapshot {
  session: AssistantSession;
  messages: AssistantMessage[];
  events: AssistantEvent[];
  run: AssistantRun | null;
  partial_content: string;
  last_seq: number;
  has_older_messages: boolean;
}
export interface AssistantBootstrap {
  settings: AssistantSettings;
  profiles: AssistantProfile[];
  skills: AssistantSkill[];
  tools: AssistantTool[];
  sessions: AssistantSession[];
  usage?: AssistantUsage;
  runtime_available: boolean;
}
export interface AssistantDecision {
  type: 'approve' | 'reject';
  message?: string;
}
export interface AssistantMethods {
  'messages.list': {
    params: { session_id: string; before_id?: string; limit?: number };
    result: { messages: AssistantMessage[]; has_more: boolean };
  };
  'settings.get': { params: Record<string, never>; result: AssistantSettings };
  ping: { params: Record<string, never>; result: { time: number } };
  'sessions.unsubscribe': {
    params: { session_id: string };
    result: { subscribed: boolean };
  };
  bootstrap: { params: Record<string, never>; result: AssistantBootstrap };
  'settings.update': {
    params: Partial<AssistantSettings>;
    result: AssistantSettings;
  };
  'profiles.save': { params: AssistantProfileInput; result: AssistantProfile };
  'profiles.delete': { params: { id: string }; result: { deleted: boolean } };
  'sessions.list': {
    params: { before?: number; limit?: number };
    result: AssistantSession[];
  };
  'sessions.create': {
    params: { title?: string; profile_id?: string };
    result: AssistantSession;
  };
  'sessions.get': { params: { session_id: string }; result: AssistantSnapshot };
  'sessions.delete': {
    params: { session_id: string };
    result: { deleted: boolean };
  };
  'sessions.subscribe': {
    params: { session_id: string; after_seq: number };
    result: { subscribed: boolean };
  };
  'runs.start': {
    params: {
      session_id: string;
      message: string;
      request_id: string;
      profile_id?: string;
    };
    result: AssistantRun;
  };
  'runs.cancel': {
    params: { session_id: string; run_id: string };
    result: AssistantRun;
  };
  'runs.resume': {
    params: {
      session_id: string;
      run_id: string;
      request_id: string;
      answer?: unknown;
      decisions?: AssistantDecision[];
      responses?: Record<string, unknown>;
    };
    result: AssistantRun;
  };
}
