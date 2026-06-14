"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}) => {
  return (
    <div className="w-56 h-full border-r bg-muted/30 flex flex-col overflow-hidden">
      <div className="p-3 border-b">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full justify-start gap-2"
          onClick={onNew}
        >
          <Plus className="h-4 w-4" />
          Nuevo Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="group relative"
          >
            <button
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full text-left p-2 rounded-lg text-xs hover:bg-muted transition-colors flex items-center gap-2 pr-8",
                activeId === conv.id && "bg-muted font-medium"
              )}
            >
              <MessageSquare className="h-3 w-3 shrink-0 opacity-50" />
              <span className="truncate">{conv.title}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="text-xs text-muted-foreground text-center p-4">
            No hay conversaciones anteriores
          </div>
        )}
      </div>
    </div>
  );
};
