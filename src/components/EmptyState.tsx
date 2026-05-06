'use client';

import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  imageSrc?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel = 'Create',
  onAction,
  imageSrc,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {imageSrc ? (
        <img src={imageSrc} alt={title} className="w-32 h-32 mb-6 opacity-60" />
      ) : icon ? (
        <div className="mb-6 p-4 rounded-lg bg-muted">
          <div className="text-4xl text-muted-foreground/50">{icon}</div>
        </div>
      ) : null}

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">{description}</p>

      {onAction && (
        <Button onClick={onAction} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
