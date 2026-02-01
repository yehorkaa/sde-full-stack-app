'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  fetchMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from '../api/messages';
import type {
  MessageFilters,
  CreateMessageDto,
  UpdateMessageDto,
  MessagesResponse,
  Message,
} from '@sde-challenge/shared-types';

export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (filters: MessageFilters) => [...messageKeys.lists(), filters] as const,
  details: () => [...messageKeys.all, 'detail'] as const,
  detail: (id: string) => [...messageKeys.details(), id] as const,
};

export function useInfiniteMessages(filters: MessageFilters) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(filters),
    queryFn: ({ pageParam }) =>
      fetchMessages({ ...filters, cursor: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMessageDto) => createMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMessageDto }) =>
      updateMessage(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all });

      const previousData = queryClient.getQueriesData<{
        pages: MessagesResponse[];
      }>({
        queryKey: messageKeys.lists(),
      });

      // Optimistic update
      queryClient.setQueriesData<{ pages: MessagesResponse[] }>(
        { queryKey: messageKeys.lists() },
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m: Message) =>
                m._id === id ? { ...m, ...data } : m
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (err, vars, context) => {
      context?.previousData?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all });

      const previousData = queryClient.getQueriesData<{
        pages: MessagesResponse[];
      }>({
        queryKey: messageKeys.lists(),
      });

      // Optimistic update
      queryClient.setQueriesData<{ pages: MessagesResponse[] }>(
        { queryKey: messageKeys.lists() },
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter((m: Message) => m._id !== id),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (err, vars, context) => {
      context?.previousData?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}
