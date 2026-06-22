"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-8 w-8 rounded-lg"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 rounded-lg"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1 mx-2">
        <span className="text-xs font-bold text-muted-foreground">Página</span>
        <span className="text-xs font-black text-foreground">{currentPage}</span>
        <span className="text-xs font-bold text-muted-foreground">de {totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 rounded-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 rounded-lg"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
