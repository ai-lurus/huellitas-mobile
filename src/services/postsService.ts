import type { Post, Comment, FeedPage, CommentsPage } from '../domain/posts';
import { postSchema, commentSchema, feedPageSchema, commentsPageSchema } from '../domain/posts';
import { httpClient } from '../network';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

function extractData(res: unknown): unknown {
  const r = asRecord(res);
  return r?.['data'] ?? r;
}

async function getFeed(params: {
  lat?: number;
  lng?: number;
  radius?: number;
  cursor?: string;
  limit?: number;
}): Promise<FeedPage> {
  const query = new URLSearchParams();
  if (params.lat !== undefined) query.set('lat', String(params.lat));
  if (params.lng !== undefined) query.set('lng', String(params.lng));
  if (params.radius !== undefined) query.set('radius', String(params.radius));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  const res = await httpClient.get(`/api/v1/posts/feed?${query.toString()}`);
  return feedPageSchema.parse(extractData(res));
}

async function getById(id: string): Promise<Post> {
  const res = await httpClient.get(`/api/v1/posts/${id}`);
  return postSchema.parse(extractData(res));
}

interface CreatePostInput {
  content?: string;
  tagged_pet_ids?: string[];
  lat?: number;
  lng?: number;
  location_label?: string;
}

async function create(input: CreatePostInput): Promise<Post> {
  const res = await httpClient.post('/api/v1/posts', input);
  return postSchema.parse(extractData(res));
}

async function uploadPhoto(postId: string, uri: string): Promise<{ url: string }> {
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('photo', { uri, name: filename, type } as unknown as Blob);
  const res = await httpClient.upload(`/api/v1/posts/${postId}/photos`, formData);
  const data = asRecord(extractData(res));
  return { url: String(data?.['url'] ?? '') };
}

async function deletePost(id: string): Promise<void> {
  await httpClient.delete(`/api/v1/posts/${id}`);
}

async function like(postId: string): Promise<{ likeCount: number }> {
  const res = await httpClient.post(`/api/v1/posts/${postId}/like`, {});
  const data = asRecord(extractData(res));
  return { likeCount: typeof data?.['likeCount'] === 'number' ? data['likeCount'] : 0 };
}

async function unlike(postId: string): Promise<{ likeCount: number }> {
  const res = await httpClient.delete(`/api/v1/posts/${postId}/like`);
  const data = asRecord(extractData(res));
  return { likeCount: typeof data?.['likeCount'] === 'number' ? data['likeCount'] : 0 };
}

async function getComments(postId: string, cursor?: string): Promise<CommentsPage> {
  const query = new URLSearchParams();
  if (cursor) query.set('cursor', cursor);
  const res = await httpClient.get(`/api/v1/posts/${postId}/comments?${query.toString()}`);
  return commentsPageSchema.parse(extractData(res));
}

async function addComment(postId: string, content: string): Promise<Comment> {
  const res = await httpClient.post(`/api/v1/posts/${postId}/comments`, { content });
  return commentSchema.parse(extractData(res));
}

async function deleteComment(postId: string, commentId: string): Promise<void> {
  await httpClient.delete(`/api/v1/posts/${postId}/comments/${commentId}`);
}

async function getUserPosts(userId: string, cursor?: string): Promise<FeedPage> {
  const query = new URLSearchParams();
  if (cursor) query.set('cursor', cursor);
  const res = await httpClient.get(`/api/v1/posts/users/${userId}?${query.toString()}`);
  return feedPageSchema.parse(extractData(res));
}

export const postsService = {
  getFeed,
  getById,
  create,
  uploadPhoto,
  deletePost,
  like,
  unlike,
  getComments,
  addComment,
  deleteComment,
  getUserPosts,
};
