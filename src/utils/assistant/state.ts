import type {
  AssistantEvent,
  AssistantMessage,
  AssistantRun,
  AssistantSnapshot,
} from '@/types/assistant.types';
export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function textField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
export function mergeAssistantEvents(
  current: AssistantEvent[],
  incoming: AssistantEvent[]
): AssistantEvent[] {
  const events = new Map(current.map((event) => [event.seq, event]));
  for (const event of incoming) events.set(event.seq, event);
  return Array.from(events.values()).sort(
    (left, right) => left.seq - right.seq
  );
}
export function isActiveStatus(status: string): boolean {
  return ['queued', 'running', 'cancelling', 'waiting_input'].includes(status);
}
export function activeRun(run: AssistantRun | null): boolean {
  return !!run && isActiveStatus(run.status);
}
export function transcript(
  snapshot: AssistantSnapshot | null,
  snapshotSeq: number
): { messages: AssistantMessage[]; streaming: string } {
  if (!snapshot) return { messages: [], streaming: '' };
  const messages = [...snapshot.messages];
  let streaming = snapshot.partial_content;
  for (const event of snapshot.events) {
    if (event.seq <= snapshotSeq) continue;
    if (event.kind === 'message.created' && event.data.role === 'user') {
      streaming = '';
      messages.push({
        id: `event-${event.seq}`,
        role: 'user',
        content: textField(event.data.content),
        created_at: event.created_at,
      });
    }
    if (event.kind === 'message.delta')
      streaming += textField(event.data.content);
    if (event.kind === 'message.completed') {
      streaming = '';
      if (event.seq > snapshotSeq)
        messages.push({
          id: `event-${event.seq}`,
          role: 'assistant',
          content: textField(event.data.content),
          created_at: event.created_at,
        });
    }
    if (event.kind === 'run.status' && event.data.status === 'queued')
      streaming = '';
  }
  return { messages, streaming };
}
export interface AssistantInterrupt {
  id: string;
  type: 'ask_user' | 'approval';
  question: string;
  options: string[];
  actions: { name: string; args: unknown; description: string }[];
}
export function readInterrupts(
  snapshot: AssistantSnapshot | null
): AssistantInterrupt[] {
  if (!snapshot || !snapshot.run || snapshot.run.status !== 'waiting_input')
    return [];
  const last = [...snapshot.events]
    .reverse()
    .find(
      (event) =>
        event.kind === 'interrupt' &&
        (!event.data.run_id || event.data.run_id === snapshot.run?.id)
    );
  const envelope = record(
    last?.data ??
      snapshot.run.interrupt ?? { interrupts: snapshot.run.interrupts }
  );
  const values: unknown[] = Array.isArray(envelope.interrupts)
    ? envelope.interrupts
    : [];
  return values.map((item, index) => {
    const entry = record(item);
    const value = { ...record(entry.value), ...entry };
    return {
      id: textField(entry.id) || String(index),
      type: value.type === 'ask_user' ? 'ask_user' : 'approval',
      question: textField(value.question),
      options: Array.isArray(value.options)
        ? value.options.filter(
            (option): option is string => typeof option === 'string'
          )
        : [],
      actions: Array.isArray(value.action_requests)
        ? value.action_requests.map((action: unknown) => {
            const item = record(action);
            return {
              name: textField(item.name),
              args: item.args,
              description: textField(item.description),
            };
          })
        : [],
    };
  });
}
