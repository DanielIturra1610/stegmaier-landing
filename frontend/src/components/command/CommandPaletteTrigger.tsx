/**
 * Trigger button para el Command Palette
 * Muestra un botón visual con el atajo Cmd+K / Ctrl+K
 */
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommandPaletteTriggerProps {
  onClick: () => void;
  className?: string;
}

export const CommandPaletteTrigger: React.FC<CommandPaletteTriggerProps> = ({
  onClick,
  className,
}) => {
  // Detectar si es Mac o Windows/Linux
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutKey = isMac ? '⌘' : 'Ctrl';

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        'hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground',
        'px-3 h-9 w-[240px] justify-between',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4" />
        <span className="text-sm">Buscar...</span>
      </div>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">{shortcutKey}</span>K
      </kbd>
    </Button>
  );
};

export default CommandPaletteTrigger;
