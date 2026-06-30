"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  id,
  placeholder = "Select your country",
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => COUNTRIES.find((c) => c.code === value),
    [value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selected ? (
              <span className="truncate">
                <span className="mr-1">{selected.flag}</span>
                {selected.name}
              </span>
            ) : (
              <span className="truncate text-muted-foreground">
                {placeholder}
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {COUNTRIES.map((c) => (
              <CommandItem
                key={c.code}
                value={`${c.name} ${c.code}`}
                onSelect={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="mr-2">{c.flag}</span>
                <span className="truncate">{c.name}</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === c.code ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
