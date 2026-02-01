'use client';

import { useState, forwardRef } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../providers';
import { useUpdateMessage, useDeleteMessage } from '../lib/hooks';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import type { Message, MessageTag } from '@sde-challenge/shared-types';

interface MessageCardProps {
  message: Message;
}

const tagColors: Record<MessageTag, string> = {
  general: 'bg-gray-500',
  announcement: 'bg-blue-500',
  question: 'bg-purple-500',
  idea: 'bg-green-500',
  feedback: 'bg-orange-500',
};

export const MessageCard = forwardRef<HTMLDivElement, MessageCardProps>(
  ({ message }, ref) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const updateMutation = useUpdateMessage();
    const deleteMutation = useDeleteMessage();

    const isOwner = user?._id === message.authorId._id;

    const handleSave = async () => {
      if (editContent.trim() && editContent !== message.content) {
        await updateMutation.mutateAsync({
          id: message._id,
          data: { content: editContent },
        });
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditContent(message.content);
      setIsEditing(false);
    };

    const handleDelete = async () => {
      if (confirm('Are you sure you want to delete this message?')) {
        await deleteMutation.mutateAsync(message._id);
      }
    };

    return (
      <Card ref={ref} className="mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{message.authorId.name}</span>
              <Badge
                className={`${tagColors[message.tag]} text-white border-0`}
                variant="secondary"
              >
                {message.tag}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={240}
              className="min-h-[60px]"
            />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </CardContent>
        {isOwner && (
          <CardFooter className="pt-2 gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    );
  }
);

MessageCard.displayName = 'MessageCard';
