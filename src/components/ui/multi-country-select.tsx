"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe, X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

interface MultiCountrySelectProps {
  values: string[];
  onChange: (codes: string[]) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function MultiCountrySelect({
  values,
  onChange,
  id,
  placeholder = "Select countries...",
  className,
}: MultiCountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (code: string) => {
    if (values.includes(code)) {
      onChange(values.filter((v) => v !== code));
    } else {
      onChange([...values, code]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <div className="flex items-center gap-1.5 flex-1 overflow-hidden truncate">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground mr-1" />
            {values.length === 0 && (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
            {values.length === 1 && (
              <span className="truncate">
                {COUNTRIES.find(c => c.code === values[0])?.flag}{" "}
                {COUNTRIES.find(c => c.code === values[0])?.name}
              </span>
            )}
            {values.length > 1 && (
              <span className="truncate text-foreground font-medium">
                {values.length} countries selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {values.length > 0 && (
              <div
                role="button"
                tabIndex={0}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              >
                <X className="h-4 w-4" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search countries..." />
          {values.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 border-b border-border bg-muted/30 max-h-32 overflow-y-auto">
              {values.map((code) => {
                const c = COUNTRIES.find((country) => country.code === code);
                if (!c) return null;
                return (
                  <Badge
                    key={c.code}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-normal bg-background border"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                    <div
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none hover:bg-muted p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(c.code);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </Badge>
                );
              })}
            </div>
          )}
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandItem
              value="All / Reset"
              onSelect={() => {
                onChange([]);
                setOpen(false);
              }}
              className="cursor-pointer font-medium"
            >
              <span className="mr-2 opacity-0">🏳️</span>
              <span className="truncate">All Countries / Reset</span>
            </CommandItem>
            {COUNTRIES.map((c) => {
              const isSelected = values.includes(c.code);
              return (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => {
                    toggleOption(c.code);
                  }}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{c.flag}</span>
                  <span className="truncate">{c.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
