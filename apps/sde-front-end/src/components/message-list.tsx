'use client';

import { useCallback, useEffect } from 'react';
import useVirtual from 'react-cool-virtual';
import { useInfiniteMessages } from '../lib/hooks';
import { MessageCard } from './message-card';
import type { MessageFilters } from '@sde-challenge/shared-types';

interface MessageListProps {
  filters: MessageFilters;
}

export function MessageList({ filters }: MessageListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteMessages(filters);

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { outerRef, innerRef, items } = useVirtual<
    HTMLDivElement,
    HTMLDivElement
  >({
    itemCount: messages.length,
    itemSize: 150,
    loadMoreCount: 5,
    isItemLoaded: (index) => index < messages.length,
    loadMore,
  });

  useEffect(() => {
    if (messages.length === 0 && !isLoading && hasNextPage) {
      loadMore();
    }
  }, [messages.length, isLoading, hasNextPage, loadMore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading messages...
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No messages found. Be the first to post!
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className="h-[600px] overflow-auto rounded-lg border bg-muted/20 p-4"
    >
      <div ref={innerRef}>
        {items.map(({ index, measureRef }) => {
          const message = messages[index];
          if (!message) return null;
          return (
            <MessageCard
              key={message._id}
              ref={measureRef}
              message={message}
            />
          );
        })}
        {isFetchingNextPage && (
          <div className="py-4 text-center text-muted-foreground">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
