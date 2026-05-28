import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const AddBillSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string(),
  amount: z.coerce
    .number({ required_error: "Amount is required" })
    .positive("Amount must be a positive number"),
  dueDate: z.date(),
});

type AddBillForm = z.infer<typeof AddBillSchema>;

interface AddBillDialogProps {
  onAddBill: (data: AddBillForm) => void;
  defaultOpen?: boolean;
}

export function AddBillDialog({
  onAddBill,
  defaultOpen = false,
}: AddBillDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const form = useForm<AddBillForm>({
    resolver: zodResolver(AddBillSchema),
  });
  const { t } = useTranslation();

  const handleAddBill: SubmitHandler<AddBillForm> = (data: AddBillForm) => {
    setOpen(false);
    onAddBill(data);
  };

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus className="h-4 w-4" />
          {t("bills.cta")}
        </Button>
      }
      title={t("bills.dialog.add.title")}
      description={t("bills.dialog.add.description")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddBill)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">{t("labels.description")}</FormLabel>
                <FormControl>
                  <Input
                    className="col-span-3"
                    placeholder={t("labels.description")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">{t("labels.category")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t("labels.selectCategory")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="housing">{t("labels.housing")}</SelectItem>
                    <SelectItem value="transportation">
                      {t("labels.transportation")}
                    </SelectItem>
                    <SelectItem value="food">{t("labels.food")}</SelectItem>
                    <SelectItem value="utilities">{t("labels.utilities")}</SelectItem>
                    <SelectItem value="clothing">{t("labels.clothing")}</SelectItem>
                    <SelectItem value="healthcare">{t("labels.healthcare")}</SelectItem>
                    <SelectItem value="insurance">{t("labels.insurance")}</SelectItem>
                    <SelectItem value="personal">{t("labels.personal")}</SelectItem>
                    <SelectItem value="debt">{t("labels.debt")}</SelectItem>
                    <SelectItem value="savings">{t("labels.savings")}</SelectItem>
                    <SelectItem value="education">{t("labels.education")}</SelectItem>
                    <SelectItem value="entertainment">
                      {t("labels.entertainment")}
                    </SelectItem>
                    <SelectItem value="pets">{t("labels.pets")}</SelectItem>
                    <SelectItem value="subscriptions">
                      {t("labels.subscriptions")}
                    </SelectItem>
                    <SelectItem value="taxes">{t("labels.taxes")}</SelectItem>
                    <SelectItem value="miscellaneous">
                      {t("labels.miscellaneous")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">{t("labels.amount")}</FormLabel>
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">{t("labels.dueDate")}</FormLabel>
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
            <Button variant="secondary" type="button" onClick={() => form.reset()}>
              {t("labels.reset")}
            </Button>
            <Button
              variant="default"
              type="submit"
            >
              {t("bills.cta")}
            </Button>
          </div>
        </form>
      </Form>
    </AdaptiveModal>
  );
}
