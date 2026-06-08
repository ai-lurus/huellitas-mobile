import { z } from 'zod';

export const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  authorName: z.string().nullable(),
  authorAvatar: z.string().nullable(),
  content: z.string().nullable(),
  photoUrls: z.array(z.string()).default([]),
  coverPhotoUrl: z.string().nullable(),
  taggedPetIds: z.array(z.string()).default([]),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  locationLabel: z.string().nullable(),
  likeCount: z.number().default(0),
  commentCount: z.number().default(0),
  likedByMe: z.boolean().default(false),
  createdAt: z.string(),
});

export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  authorName: z.string().nullable(),
  authorAvatar: z.string().nullable(),
  content: z.string(),
  createdAt: z.string(),
});

export const feedPageSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
});

export const commentsPageSchema = z.object({
  comments: z.array(commentSchema),
  nextCursor: z.string().nullable(),
});

export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type FeedPage = z.infer<typeof feedPageSchema>;
export type CommentsPage = z.infer<typeof commentsPageSchema>;
