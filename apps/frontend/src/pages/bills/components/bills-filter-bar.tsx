import { type ReactNode, useState } from "react";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import type { BillStatus } from "@/api/bills";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ALL_STATUSES: { value: BillStatus; labelKey: string }[] = [
  { value: "created", labelKey: "labels.created" },
  { value: "upcoming", labelKey: "labels.upcoming" },
  { value: "due", labelKey: "labels.due" },
  { value: "overdue", labelKey: "labels.overdue" },
  { value: "paid", labelKey: "labels.paid" },
  { value: "cancelled", labelKey: "labels.cancelled" },
];

interface BillsFilterBarProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange) => void;
  selectedStatuses: BillStatus[];
  onStatusChange: (statuses: BillStatus[]) => void;
  descriptionSearch: string;
  onDescriptionChange: (value: string) => void;
  actions?: ReactNode;
}

export function BillsFilterBar({
  dateRange,
  onDateRangeChange,
  selectedStatuses,
  onStatusChange,
  descriptionSearch,
  onDescriptionChange,
  actions,
}: BillsFilterBarProps) {
  const { t } = useTranslation();
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

  const toggleStatus = (status: BillStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const statusLabel =
    selectedStatuses.length === 0
      ? t("bills.filters.statusPlaceholder")
      : t("bills.filters.statusSelected", { count: selectedStatuses.length });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("bills.filters.descriptionPlaceholder")}
          value={descriptionSearch}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={statusPopoverOpen}
            className="w-full justify-between sm:w-[200px]"
          >
            {statusLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No status found.</CommandEmpty>
              <CommandGroup>
                {ALL_STATUSES.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => toggleStatus(item.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedStatuses.includes(item.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {t(item.labelKey)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CalendarDateRangePicker
        startDate={dateRange?.from}
        endDate={dateRange?.to}
        onDateChange={onDateRangeChange}
      />

      {actions}
    </div>
  );
}
