import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, CircleCheck } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { AdaptiveModal } from "@/components/ui/adaptive-modal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Bill } from "../types";

const MarkAsPaidSchema = z.object({
  amountPaid: z.number().positive(),
  paymentDate: z.date(),
});

type MarkAsPaidForm = z.infer<typeof MarkAsPaidSchema>;

export interface MarkAsPaidData {
  id: string;
  amountPaid: number;
  paymentDate: Date;
}

interface MarkAsPaidDialogProps {
  bill: Bill;
  onMarkAsPaid: (data: MarkAsPaidData) => Promise<void>;
}

export function MarkAsPaidDialog({ bill, onMarkAsPaid }: MarkAsPaidDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const form = useForm<MarkAsPaidForm>({
    resolver: zodResolver(MarkAsPaidSchema),
    defaultValues: {
      amountPaid: bill.amountDue,
      paymentDate: new Date(),
    },
  });

  const handleSubmit: SubmitHandler<MarkAsPaidForm> = (data) => {
    setOpen(false);
    onMarkAsPaid({
      id: bill.id,
      amountPaid: data.amountPaid,
      paymentDate: data.paymentDate,
    });
  };

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="icon" variant="outline">
          <CircleCheck className="h-4 w-4" />
          <span className="sr-only">{t("labels.markAsPaid")}</span>
        </Button>
      }
      title={t("bills.dialog.markAsPaid.title")}
      description={t("bills.dialog.markAsPaid.description")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            <p className="font-medium">{bill.description}</p>
            <p className="mt-1 text-muted-foreground">
              {t("labels.amountDue")}: {formatCurrency(bill.amountDue)}
            </p>
          </div>

          <FormField
            control={form.control}
            name="amountPaid"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">{t("labels.amountPaid")}</FormLabel>
                <FormControl>
                  <Input
                    className="col-span-3"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(event) =>
                      field.onChange(parseFloat(event.target.value))
                    }
                    inputMode="decimal"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">{t("labels.paymentDate")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t("labels.pickDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              {t("labels.cancel")}
            </Button>
            <Button variant="default" type="submit">
              {t("labels.confirm")}
            </Button>
          </div>
        </form>
      </Form>
    </AdaptiveModal>
  );
}
