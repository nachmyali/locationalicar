"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const WEEKDAYS_SHORT = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-white p-5 [[data-slot=popover-content]_&]:bg-transparent",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        formatWeekdayName: (date) => WEEKDAYS_SHORT[date.getDay()],
        ...formatters,
      }}
      classNames={{
        root: cn("w-[300px] sm:w-[320px] select-none", defaultClassNames.root),
        months: cn("flex flex-col", defaultClassNames.months),
        month: cn("flex flex-col w-full", defaultClassNames.month),
        nav: cn(
          "flex items-center justify-between w-full mb-5",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-remons-gray hover:text-remons-primary hover:bg-remons-light-gray transition-colors duration-150",
          "aria-disabled:opacity-30 aria-disabled:pointer-events-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-remons-gray hover:text-remons-primary hover:bg-remons-light-gray transition-colors duration-150",
          "aria-disabled:opacity-30 aria-disabled:pointer-events-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "text-sm font-semibold text-remons-dark",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8",
          defaultClassNames.caption_label
        ),
        dropdowns: cn(
          "flex items-center gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-lg border border-remons-border has-focus:ring-2 has-focus:ring-remons-primary/20",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-white inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        table: "w-full border-collapse",
        weekdays: cn(
          "flex mb-3",
          defaultClassNames.weekdays
        ),
        weekday: cn(
          "text-remons-gray/50 text-xs font-medium text-center flex-1 h-8 flex items-center justify-center",
          defaultClassNames.weekday
        ),
        week: cn(
          "flex",
          defaultClassNames.week
        ),
        day: cn(
          "relative w-full text-center",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-full",
          defaultClassNames.range_start
        ),
        range_middle: cn("", defaultClassNames.range_middle),
        range_end: cn("rounded-r-full", defaultClassNames.range_end),
        today: cn(
          "",
          defaultClassNames.today
        ),
        outside: cn(
          "text-remons-gray/30",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-remons-gray/20 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSingleSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle
  const isToday = modifiers.today && !isSingleSelected

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        "relative w-10 h-10 mx-auto p-0 rounded-full font-inter text-sm transition-all duration-150",
        isSingleSelected
          ? "bg-remons-primary text-white hover:bg-remons-primary-dark shadow-sm shadow-remons-primary/30 scale-105"
          : "text-remons-dark hover:bg-remons-light-gray hover:text-remons-dark",
        isToday && "after:absolute after:bottom-[3px] after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-remons-primary",
        modifiers.outside && "text-remons-gray/30 hover:bg-transparent",
        modifiers.disabled && "text-remons-gray/20 hover:bg-transparent cursor-not-allowed pointer-events-none",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
