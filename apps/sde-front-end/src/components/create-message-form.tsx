'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useCreateMessage } from '../lib/hooks';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageTag } from '@sde-challenge/shared-types';

const tagOptions = Object.values(MessageTag).map((tag) => ({
  value: tag,
  label: tag.charAt(0).toUpperCase() + tag.slice(1),
}));

export function CreateMessageForm() {
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<MessageTag>(MessageTag.GENERAL);
  const createMutation = useCreateMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await createMutation.mutateAsync({ content: content.trim(), tag });
    setContent('');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Create Message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Textarea
              placeholder="What's on your mind? (max 240 characters)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={240}
              className="min-h-[80px]"
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/240
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="messageTag">Tag</Label>
              <Select
                id="messageTag"
                options={tagOptions}
                value={tag}
                onChange={(e) => setTag(e.target.value as MessageTag)}
              />
            </div>
            <Button
              type="submit"
              disabled={!content.trim() || createMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
