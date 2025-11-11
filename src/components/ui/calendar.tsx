import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,66%,0.2)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 bg-[hsl(0,0%,7%)] rounded-xl p-4 border border-[hsl(0,0%,66%,0.2)]",
        caption: "flex justify-center pt-1 relative items-center px-4",
        caption_label: "text-base font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 bg-transparent p-0 text-[hsl(43,100%,68%)] hover:text-[hsl(211,100%,50%)] border border-border rounded-lg transition-all",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-medium text-xs uppercase",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0.5 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-lg transition-all hover:scale-105",
          "aria-selected:opacity-100 aria-selected:bg-[hsl(43,100%,68%)] aria-selected:text-[hsl(0,0%,7%)] aria-selected:font-bold"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[hsl(43,100%,68%)] text-[hsl(0,0%,7%)] hover:bg-[hsl(43,100%,68%)] hover:text-[hsl(0,0%,7%)] focus:bg-[hsl(43,100%,68%)] focus:text-[hsl(0,0%,7%)] font-bold",
        day_today: "bg-[hsl(211,100%,50%)] text-[hsl(0,0%,7%)] font-bold",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-[hsl(0,0%,29%)] opacity-40 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-[hsl(43,100%,68%,0.2)] aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
