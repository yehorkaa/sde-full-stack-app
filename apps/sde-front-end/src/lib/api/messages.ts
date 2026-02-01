import api from '../axios';
import type {
  Message,
  CreateMessageDto,
  UpdateMessageDto,
  GetMessagesQueryDto,
  MessagesResponse,
} from '@sde-challenge/shared-types';

const messageQueries = {
  tag: 'tag',
  authorId: 'authorId',
  fromDate: 'fromDate',
  toDate: 'toDate',
  cursor: 'cursor',
  limit: 'limit',
} as const;

const queriesList = Object.values(messageQueries);

export async function fetchMessages(
  query: GetMessagesQueryDto
): Promise<MessagesResponse> {
  const params = new URLSearchParams();

  queriesList.forEach((queryKey) => {
    const queryValue = query[queryKey];
    if (queryValue !== undefined && queryValue !== null) {
      params.append(queryKey, queryValue?.toString());
    }
  });

  const response = await api.get<MessagesResponse>(
    `/messages?${params.toString()}`
  );
  return response.data;
}

export async function createMessage(data: CreateMessageDto): Promise<Message> {
  const response = await api.post<Message>('/messages', data);
  return response.data;
}

export async function updateMessage(
  id: string,
  data: UpdateMessageDto
): Promise<Message> {
  const response = await api.patch<Message>(`/messages/${id}`, data);
  return response.data;
}

export async function deleteMessage(id: string): Promise<void> {
  await api.delete(`/messages/${id}`);
}

export async function getMessage(id: string): Promise<Message> {
  const response = await api.get<Message>(`/messages/${id}`);
  return response.data;
}
