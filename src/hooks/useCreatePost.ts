import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import type { Post } from '../domain/posts';
import { postsService } from '../services/postsService';
import { FEED_QUERY_KEY } from './useFeed';

export interface CreatePostPayload {
  content?: string;
  photoUri?: string;
  taggedPetIds?: string[];
  lat?: number;
  lng?: number;
  locationLabel?: string;
}

async function createPostWithPhoto(payload: CreatePostPayload): Promise<Post> {
  const post = await postsService.create({
    content: payload.content,
    tagged_pet_ids: payload.taggedPetIds,
    lat: payload.lat,
    lng: payload.lng,
    location_label: payload.locationLabel,
  });

  if (payload.photoUri) {
    await postsService.uploadPhoto(post.id, payload.photoUri);
    // Fetch the updated post with signed photo URL
    return postsService.getById(post.id);
  }

  return post;
}

export function useCreatePost(): UseMutationResult<Post, Error, CreatePostPayload> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPostWithPhoto,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}
