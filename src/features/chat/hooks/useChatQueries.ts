import React from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
  });
};

export const useInfiniteMessages = (conversationId: string, wsConnected: boolean) => {
  return useInfiniteQuery({
    queryKey: ['chat-messages-v2', conversationId],
    queryFn: ({ pageParam }) =>
      chatApi.getMessagesV2(conversationId, {
        cursor: pageParam as string | null,
        limit: 30,
        direction: 'OLDER',
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMoreOlder ? lastPage.olderCursor : undefined,
    enabled: !!conversationId,
    staleTime: wsConnected ? Infinity : 30_000,
  });
};

export const useMyGroups = (params: { query?: string; sort?: 'activity_newest' | 'name_asc' | 'name_desc' | 'member_count' | 'joined_oldest'; filter?: 'all' | 'owner' | 'admin' | 'member'; page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['my-groups', params],
    queryFn: () => chatApi.getMyGroupConversations(params),
  });
};

export const useLiveMessages = (conversationId: string) => {
  const queryClient = useQueryClient();
  const [liveMessages, setLiveMessages] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!conversationId) return;
    
    // Set initial data
    const initialData = queryClient.getQueryData<any[]>(['chat-live-messages', conversationId]);
    if (initialData) setLiveMessages(initialData);

    // Subscribe to updates
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'chat-live-messages' &&
        event.query.queryKey[1] === conversationId
      ) {
        const data = queryClient.getQueryData<any[]>(['chat-live-messages', conversationId]);
        if (data) setLiveMessages(data);
      }
    });
    return unsub;
  }, [conversationId, queryClient]);

  return liveMessages;
};
