/**
 * Client-side implementation for timestamp fields
 */
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parse, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { ClockIcon, CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const DATE_FORMAT = "yyyy-MM-dd"
const TIME_FORMAT = "HH:mm:ss"
const DATETIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`
const DISPLAY_FORMAT = "MMMM do yyyy 'at' h:mma"

interface Field {
  path: string
  label: string
  description?: string
  fieldMeta?: any
}

interface FilterProps {
  value: string
  onChange: (value: string) => void
}

interface CellProps {
  item: Record<string, any>
  field: Field
}

interface FieldProps {
  field: Field
  value?: { value: string | null; initial?: string | null; kind: 'update' | 'create' }
  rawValue?: any
  kind?: 'create' | 'update'
  onChange?: (value: { value: string | null; initial?: string | null; kind: 'update' | 'create' }) => void
}

interface FilterLabelProps {
  label: string
  type: keyof FilterTypes
  value: string
}

interface GraphQLProps {
  path: string
  type: keyof FilterTypes
  value: string
}

interface FilterType {
  label: string
  initialValue: string
}

interface FilterTypes {
  equals: FilterType
  not_equals: FilterType
  gt: FilterType
  lt: FilterType
  gte: FilterType
  lte: FilterType
}

function formatDate(date: string | null): string {
  if (!date) return ""
  return format(new Date(date), DATETIME_FORMAT)
}

function formatDateForDisplay(date: string | null | undefined): string {
  if (!date) return "Select date and time"
  try {
    return format(new Date(date), DISPLAY_FORMAT)
  } catch (e) {
    return "Select date and time"
  }
}

function parseDateTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null

  const fullStr = timeStr ? `${dateStr} ${timeStr}` : dateStr

  const parsed = parse(fullStr, DATETIME_FORMAT, new Date())
  return isValid(parsed) ? parsed.toISOString() : null
}

export function Field({ field, value, rawValue, kind = 'update', onChange }: FieldProps) {
  // Handle internal deserialization if rawValue is provided
  let processedValue = value;
  
  if (rawValue !== undefined) {
    // Create a controller directly
    const fieldController = controller({
      path: field.path,
      label: field.label,
      description: field.description,
      fieldMeta: field.fieldMeta || {}
    });
    
    // Deserialize the raw value and cast to the correct type
    const deserialized = fieldController.deserialize({ [field.path]: rawValue });
    processedValue = {
      value: deserialized.value,
      initial: deserialized.initial,
      kind: deserialized.kind as 'update' | 'create'
    };
  }

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    processedValue?.value ? new Date(processedValue.value) : undefined
  );
  const [timeValue, setTimeValue] = useState(
    selectedDate ? format(selectedDate, TIME_FORMAT) : "00:00:00"
  );

  // Update the date/time when props change
  useEffect(() => {
    if (processedValue?.value) {
      const date = new Date(processedValue.value);
      setSelectedDate(date);
      setTimeValue(format(date, TIME_FORMAT));
    }
  }, [processedValue?.value]);
  
  // Update value when date changes
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    
    // Preserve the time when changing date
    const currentTime = timeValue || "00:00:00";
    const dateStr = format(date, DATE_FORMAT);
    const newValue = parseDateTime(dateStr, currentTime);
    
    onChange?.({
      kind: "update",
      value: newValue,
      initial: processedValue?.initial,
    });
  };
  
  // Update value when time changes
  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    
    if (!selectedDate) {
      // If no date selected yet, use today's date
      const today = new Date();
      setSelectedDate(today);
      const dateStr = format(today, DATE_FORMAT);
      const newValue = parseDateTime(dateStr, time);
      
      onChange?.({
        kind: "update",
        value: newValue,
        initial: processedValue?.initial,
      });
    } else {
      // Use the existing selected date
      const dateStr = format(selectedDate, DATE_FORMAT);
      const newValue = parseDateTime(dateStr, time);
      
      onChange?.({
        kind: "update",
        value: newValue,
        initial: processedValue?.initial,
      });
    }
  };

  return (
    <div className="grid gap-2">
      <Label>{field.label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal ${!processedValue?.value ? 'text-muted-foreground' : ''}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateForDisplay(processedValue?.value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            initialFocus
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-3">
              <Label className="text-xs">
                Enter time
              </Label>
              <div className="relative grow">
                <Input
                  type="time"
                  step="1"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="peer appearance-none ps-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <ClockIcon size={16} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </div>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  if (!value) {
    return <span className="text-muted-foreground">No value</span>
  }

  return (
    <time dateTime={value} className="text-sm tabular-nums">
      {formatDateForDisplay(typeof value === 'string' ? value : null)}
    </time>
  )
}

export function Filter({ value, onChange }: FilterProps) {
  return <Input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className="h-8" />
}

export function getFilterTypes(): FilterTypes {
  return {
    equals: {
      label: "Equals",
      initialValue: "",
    },
    not_equals: {
      label: "Does not equal",
      initialValue: "",
    },
    gt: {
      label: "After",
      initialValue: "",
    },
    lt: {
      label: "Before",
      initialValue: "",
    },
    gte: {
      label: "After or equal to",
      initialValue: "",
    },
    lte: {
      label: "Before or equal to",
      initialValue: "",
    },
  }
}

// Filter controller for timestamp fields
export const filter = {
  Filter,
  types: getFilterTypes(),
  Label: ({ label, type, value }: FilterLabelProps) => {
    const filterType = getFilterTypes()[type]
    return filterType ? `${label} ${filterType.label.toLowerCase()}: ${value}` : ""
  },
  graphql: ({ path, type, value }: GraphQLProps) => {
    // Parse the value to a valid ISO date string, return empty if invalid
    const date = new Date(value)
    if (isNaN(date.getTime())) return {}

    const isoString = date.toISOString()

    switch (type) {
      case 'equals':
        return { [path]: { equals: isoString } }
      case 'not_equals':
        return { [path]: { not: { equals: isoString } } }
      case 'gt':
        return { [path]: { gt: isoString } }
      case 'lt':
        return { [path]: { lt: isoString } }
      case 'gte':
        return { [path]: { gte: isoString } }
      case 'lte':
        return { [path]: { lte: isoString } }
      default:
        return {}
    }
  }
}

/**
 * Controller for timestamp fields
 */
export const controller = (config: any) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: {
      kind: 'create' as const,
      value: null,
    },
    deserialize: (data: Record<string, any>) => {
      const value = data[config.path];
      return {
        kind: 'update' as const,
        initial: value,
        value: value,
      };
    },
    serialize: (value: any) => {
      return {
        [config.path]: value.value,
      };
    },
  };
};

