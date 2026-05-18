import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export function DatePicker({ value, onChange, min, required, className = '', label }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(value + 'T00:00:00') : undefined;
  const minDate = min ? new Date(min + 'T00:00:00') : undefined;

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      const yyyy = selected.getFullYear();
      const mm = String(selected.getMonth() + 1).padStart(2, '0');
      const dd = String(selected.getDate()).padStart(2, '0');
      onChange?.(`${yyyy}-${mm}-${dd}`);
    }
    setOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className={cn('block text-sm font-inter font-medium mb-1.5')}>
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-3 w-full rounded-xl px-4 py-3.5 text-sm font-inter text-left',
              'border border-remons-border bg-white hover:border-remons-primary/40',
              'focus:outline-none focus:ring-2 focus:ring-remons-primary/20 focus:border-remons-primary',
              'transition-all duration-200',
              !value && 'text-remons-gray'
            )}
          >
            <Calendar size={18} className="shrink-0 text-remons-primary" />
            <span className={cn(
              'truncate',
              value ? 'text-remons-dark font-medium' : 'text-remons-gray'
            )}>
              {value ? format(new Date(value + 'T00:00:00'), 'd MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarUI
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={minDate ? { before: minDate } : undefined}
            locale={fr}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {required && !value && (
        <input
          type="text"
          required
          value=""
          tabIndex={-1}
          className="sr-only"
          onChange={() => {}}
        />
      )}
    </div>
  );
}
