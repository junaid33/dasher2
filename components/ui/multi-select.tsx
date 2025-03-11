"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"

type Option = {
  value: string
  label: string
  data?: any
  disable?: boolean
  /** Fixed option that can't be removed. */
  fixed?: boolean
  /** Group the option belongs to. */
  group?: string
}

interface MultiSelectorProps {
  value?: Option[]
  defaultValue?: Option[]
  placeholder?: string
  options: Option[]
  maxSelected?: number
  disabled?: boolean
  /** Callback when selected options change. */
  onChange?: (options: Option[]) => void
  /** Custom function to render option label. */
  renderOption?: (option: Option) => React.ReactNode
  /** Custom function to render selected option label. */
  renderSelectedOption?: (option: Option) => React.ReactNode
  /** Custom function to filter options based on input value. */
  filterOption?: (option: Option, search: string) => boolean
  /** Group options by key. */
  groupBy?: keyof Option
  className?: string
}

export function MultipleSelector({
  value,
  defaultValue,
  placeholder = "Select options...",
  options: optionsProp,
  maxSelected,
  disabled,
  onChange,
  renderOption,
  renderSelectedOption,
  filterOption,
  groupBy,
  className,
}: MultiSelectorProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Option[]>(value || defaultValue || [])
  const [inputValue, setInputValue] = React.useState("")

  const options = React.useMemo(() => {
    return optionsProp.filter((option) => {
      if (filterOption) {
        return filterOption(option, inputValue)
      }

      return option.label.toLowerCase().includes(inputValue.toLowerCase())
    })
  }, [optionsProp, inputValue, filterOption])

  const handleSelect = React.useCallback(
    (option: Option) => {
      if (disabled) return

      const isSelected = selected.some((item) => item.value === option.value)

      let updatedSelected: Option[]

      if (isSelected) {
        updatedSelected = selected.filter((item) => item.value !== option.value)
      } else {
        if (maxSelected && selected.length >= maxSelected) {
          updatedSelected = [...selected.slice(1), option]
        } else {
          updatedSelected = [...selected, option]
        }
      }

      setSelected(updatedSelected)
      onChange?.(updatedSelected)
      setInputValue("")
    },
    [disabled, maxSelected, onChange, selected],
  )

  const handleRemove = React.useCallback(
    (option: Option) => {
      if (disabled) return

      if (option.fixed) return

      const updatedSelected = selected.filter((item) => item.value !== option.value)

      setSelected(updatedSelected)
      onChange?.(updatedSelected)
    },
    [disabled, onChange, selected],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return

      if (e.key === "Backspace" && inputValue === "" && selected.length > 0) {
        const lastSelected = selected[selected.length - 1]

        if (!lastSelected.fixed) {
          handleRemove(lastSelected)
        }
      }

      if (e.key === "Escape") {
        setOpen(false)
        inputRef.current?.blur()
      }
    },
    [disabled, inputValue, selected, handleRemove],
  )

  // Update the internal state when the value prop changes
  React.useEffect(() => {
    if (value) {
      setSelected(value)
    }
  }, [value])

  // Grouped options for rendering
  const groupedOptions = React.useMemo(() => {
    if (!groupBy) {
      return { "": options }
    }

    const grouped: Record<string, Option[]> = {}

    for (const option of options) {
      const groupKey = option[groupBy] as string
      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(option)
    }

    return grouped
  }, [options, groupBy])

  return (
    <Command onKeyDown={handleKeyDown} className={`overflow-visible bg-transparent ${className}`} shouldFilter={false}>
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <Badge key={option.value} variant="secondary" className={`${option.fixed ? "opacity-50" : ""}`}>
              {renderSelectedOption ? renderSelectedOption(option) : option.label}
              {!option.fixed && (
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleRemove(option)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative">
        {open && (
          <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto">
              {Object.entries(groupedOptions).map(([group, options]) => (
                <React.Fragment key={group}>
                  {group && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{group}</div>}
                  {options.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No options found.</div>
                  )}
                  {options.map((option) => {
                    const isSelected = selected.some((item) => item.value === option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        disabled={option.disable}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onSelect={() => handleSelect(option)}
                        className={`flex items-center gap-2 ${isSelected ? "bg-accent" : ""}`}
                      >
                        {renderOption ? renderOption(option) : option.label}
                      </CommandItem>
                    )
                  })}
                </React.Fragment>
              ))}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  )
}

