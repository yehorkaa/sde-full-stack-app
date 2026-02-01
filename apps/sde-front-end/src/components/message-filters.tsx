'use client';

import { X } from 'lucide-react';
import { useUsers } from '../lib/hooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { MessageTag, type MessageFilters as Filters } from '@sde-challenge/shared-types';

interface MessageFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const tagOptions = [
  { value: '', label: 'All Tags' },
  ...Object.values(MessageTag).map((tag) => ({
    value: tag,
    label: tag.charAt(0).toUpperCase() + tag.slice(1),
  })),
];

export function MessageFilters({
  filters,
  onFiltersChange,
}: MessageFiltersProps) {
  const { data: users = [] } = useUsers();

  const userOptions = [
    { value: '', label: 'All Authors' },
    ...users.map((u) => ({ value: u._id, label: u.name })),
  ];

  const handleClear = () => {
    onFiltersChange({});
  };

  const hasFilters =
    filters.tag || filters.authorId || filters.fromDate || filters.toDate;

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="tag">Tag</Label>
          <Select
            id="tag"
            options={tagOptions}
            value={filters.tag || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                tag: (e.target.value as MessageTag) || undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="author">Author</Label>
          <Select
            id="author"
            options={userOptions}
            value={filters.authorId || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                authorId: e.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            type="datetime-local"
            value={filters.fromDate?.slice(0, 16) || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                fromDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            type="datetime-local"
            value={filters.toDate?.slice(0, 16) || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                toDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
