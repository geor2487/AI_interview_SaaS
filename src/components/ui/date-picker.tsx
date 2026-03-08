"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ja } from "date-fns/locale";
import { format, parse, isValid } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const defaultClassNames = getDefaultClassNames();

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const displayValue = selected && isValid(selected) ? format(selected, "yyyy年M月d日") : "";

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-left outline-none",
          "focus:border-accent focus:ring-2 focus:ring-accent/20 transition",
          !displayValue && "text-text-muted",
          className
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
        {displayValue || placeholder}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <DayPicker
            mode="single"
            locale={ja}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected || new Date()}
            classNames={{
              root: `${defaultClassNames.root} text-sm`,
              today: "border-2 border-accent rounded-lg",
              selected: "bg-accent text-white rounded-lg",
              chevron: `${defaultClassNames.chevron} fill-accent`,
              day: "rounded-lg hover:bg-accent-light transition-colors",
            }}
          />
        </div>
      )}
    </div>
  );
}

interface DateTimePickerProps {
  value: string; // ISO or "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "日時を選択",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState(() => {
    if (!value) return "12:00";
    const d = new Date(value);
    return isValid(d) ? format(d, "HH:mm") : "12:00";
  });
  const ref = useRef<HTMLDivElement>(null);
  const defaultClassNames = getDefaultClassNames();

  const selected = value ? new Date(value) : undefined;
  const displayValue =
    selected && isValid(selected) ? format(selected, "yyyy年M月d日 HH:mm") : "";

  const buildDateTimeString = (date: Date, timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(buildDateTimeString(date, time));
    } else {
      onChange("");
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (selected && isValid(selected)) {
      onChange(buildDateTimeString(selected, newTime));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-left outline-none",
          "focus:border-accent focus:ring-2 focus:ring-accent/20 transition",
          !displayValue && "text-text-muted",
          className
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
        {displayValue || placeholder}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <DayPicker
            mode="single"
            locale={ja}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected || new Date()}
            classNames={{
              root: `${defaultClassNames.root} text-sm`,
              today: "border-2 border-accent rounded-lg",
              selected: "bg-accent text-white rounded-lg",
              chevron: `${defaultClassNames.chevron} fill-accent`,
              day: "rounded-lg hover:bg-accent-light transition-colors",
            }}
          />
          <div className="border-t border-border pt-3 mt-1 flex items-center gap-2">
            <label className="text-xs font-medium text-text-sub">時刻</label>
            <input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
            />
          </div>
        </div>
      )}
    </div>
  );
}
