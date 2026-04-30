import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import {
  inboxNotificationSchema,
  type InboxNotification,
  type InboxNotificationKind,
} from '../domain/inboxNotifications';

const STORAGE_KEY_INBOX = '@huellitas/inbox_notifications_v1';
const MAX_ITEMS = 200;

const listSchema = z.array(inboxNotificationSchema);

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function guessKindFromTitle(title: string): InboxNotificationKind {
  const t = title.toLowerCase();
  if (t.includes('avist')) return 'sighting';
  if (t.includes('perdid')) return 'lost';
  if (t.includes('encontr') || t.includes('resuelt')) return 'resolved';
  if (t.includes('recordatorio')) return 'reminder';
  return 'system';
}

async function readAll(): Promise<InboxNotification[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY_INBOX);
  if (!raw) return [];
  try {
    const parsedJson = JSON.parse(raw) as unknown;
    const parsed = listSchema.safeParse(parsedJson);
    if (!parsed.success) return [];
    return parsed.data;
  } catch {
    return [];
  }
}

async function writeAll(items: InboxNotification[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_INBOX, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

function uniqByIdNewestFirst(items: InboxNotification[]): InboxNotification[] {
  const seen = new Set<string>();
  const out: InboxNotification[] = [];
  for (const item of items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

async function list(): Promise<InboxNotification[]> {
  return await readAll();
}

async function upsert(input: Partial<InboxNotification> & { id: string }): Promise<void> {
  const existing = await readAll();
  const createdAt = input.createdAt ?? nowIso();
  const title = normalizeString(input.title) ?? 'Huellitas';
  const kind = input.kind ?? guessKindFromTitle(title);

  const merged = inboxNotificationSchema.parse({
    id: input.id,
    createdAt,
    title,
    body: normalizeString(input.body),
    kind,
    reportId: normalizeString(input.reportId),
    imageUrl: normalizeString(input.imageUrl),
    isRead: Boolean(input.isRead),
  });

  const next = uniqByIdNewestFirst([merged, ...existing]);
  await writeAll(next);
}

async function markAllRead(): Promise<void> {
  const existing = await readAll();
  await writeAll(existing.map((x) => ({ ...x, isRead: true })));
}

async function markRead(id: string): Promise<void> {
  const existing = await readAll();
  await writeAll(existing.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
}

async function remove(id: string): Promise<void> {
  const existing = await readAll();
  await writeAll(existing.filter((x) => x.id !== id));
}

async function clear(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_INBOX);
}

export const inboxNotificationsService = {
  list,
  upsert,
  markAllRead,
  markRead,
  remove,
  clear,
  STORAGE_KEY_INBOX,
};
