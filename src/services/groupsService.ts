import type { Group, GroupsResponse } from '../domain/groups';
import { groupSchema, groupsResponseSchema } from '../domain/groups';
import type { FeedPage } from '../domain/posts';
import { feedPageSchema } from '../domain/posts';
import { httpClient } from '../network';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

// Unwraps axios response → API body ({ success, data: payload }) → payload
function extractData(res: unknown): unknown {
  const body = asRecord(res)?.['data'] ?? res;
  const r = asRecord(body);
  return r?.['data'] ?? body;
}

async function getMyGroups(params: { lat?: number; lng?: number }): Promise<GroupsResponse> {
  const query = new URLSearchParams();
  if (params.lat !== undefined) query.set('lat', String(params.lat));
  if (params.lng !== undefined) query.set('lng', String(params.lng));
  const res = await httpClient.get(`/api/v1/groups?${query.toString()}`);
  return groupsResponseSchema.parse(extractData(res));
}

async function getById(id: string): Promise<Group> {
  const res = await httpClient.get(`/api/v1/groups/${id}`);
  return groupSchema.parse(extractData(res));
}

async function join(groupId: string): Promise<Group> {
  const res = await httpClient.post(`/api/v1/groups/${groupId}/join`, {});
  return groupSchema.parse(extractData(res));
}

async function leave(groupId: string): Promise<void> {
  await httpClient.delete(`/api/v1/groups/${groupId}/leave`);
}

async function getGroupFeed(groupId: string, cursor?: string): Promise<FeedPage> {
  const query = new URLSearchParams();
  if (cursor) query.set('cursor', cursor);
  const res = await httpClient.get(`/api/v1/groups/${groupId}/feed?${query.toString()}`);
  return feedPageSchema.parse(extractData(res));
}

export const groupsService = {
  getMyGroups,
  getById,
  join,
  leave,
  getGroupFeed,
};
