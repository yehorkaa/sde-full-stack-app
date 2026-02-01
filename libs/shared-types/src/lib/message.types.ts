export enum MessageTag {
  GENERAL = 'general',
  ANNOUNCEMENT = 'announcement',
  QUESTION = 'question',
  IDEA = 'idea',
  FEEDBACK = 'feedback',
}

export interface MessageAuthor {
  _id: string;
  name: string;
  email: string;
}

export interface Message {
  _id: string;
  authorId: MessageAuthor;
  content: string;
  tag: MessageTag;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageDto {
  content: string;
  tag: MessageTag;
}

export interface UpdateMessageDto {
  content?: string;
  tag?: MessageTag;
}

export interface GetMessagesQueryDto {
  tag?: MessageTag;
  authorId?: string;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type MessageFilters = Omit<GetMessagesQueryDto, 'cursor' | 'limit'>;
