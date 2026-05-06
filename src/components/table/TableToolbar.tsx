'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Download,
  Upload,
  Settings2,
  MoreHorizontal,
  Trash2,
  Archive,
} from 'lucide-react';
import { useState } from 'react';

interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onExport?: () => void;
  onImport?: () => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onBulkArchive?: () => void;
  onColumnSettings?: () => void;
  placeholder?: string;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  onExport,
  onImport,
  selectedCount = 0,
  onBulkDelete,
  onBulkArchive,
  onColumnSettings,
  placeholder = 'Search...',
}: TableToolbarProps) {
  const [showBulkActions, setShowBulkActions] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="gap-2 border-border text-foreground hover:bg-muted"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2 border-border text-foreground hover:bg-muted"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}

          {onColumnSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onColumnSettings}
              className="gap-2 border-border text-foreground hover:bg-muted"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}

          {selectedCount > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="gap-2 border-border text-foreground hover:bg-muted"
              >
                <MoreHorizontal className="w-4 h-4" />
                {selectedCount}
              </Button>

              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
                  {onBulkArchive && (
                    <button
                      onClick={() => {
                        onBulkArchive();
                        setShowBulkActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  )}
                  {onBulkDelete && (
                    <button
                      onClick={() => {
                        onBulkDelete();
                        setShowBulkActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors text-sm flex items-center gap-2 border-t border-border"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
