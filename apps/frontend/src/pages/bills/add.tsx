import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { billsService } from "@/api/bills";
import { useSelectedOrganization } from "@/auth/auth-provider";

const AddBillSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "housing",
    "transportation",
    "food",
    "utilities",
    "clothing",
    "healthcare",
    "insurance",
    "personal",
    "debt",
    "savings",
    "education",
    "entertainment",
    "pets",
    "subscriptions",
    "taxes",
    "miscellaneous",
  ]),
  amount: z.coerce
    .number({ required_error: "Amount is required" })
    .positive("Amount must be a positive number"),
  date: z.date(),
});

type AddBillFormValues = z.infer<typeof AddBillSchema>;

export function AddBill() {
  const selectedOrganization = useSelectedOrganization();
  const form = useForm<AddBillFormValues>({
    resolver: zodResolver(AddBillSchema),
  });

  const { t } = useTranslation();
  const navigate = useNavigate();

  async function onSubmit(data: AddBillFormValues) {
    try {
      const response = await billsService.createAsync({
        description: data.description,
        category: data.category,
        status: "upcoming",
        dueDate: data.date.toISOString(),
        amountDue: data.amount,
        paymentDate: null,
        amountPaid: null,
        organizationId: selectedOrganization!.id,
      });
      if (response) {
        navigate("/dashboard/bills");
      }
    } catch (error) {
      console.error("Failed to add the bill:", error);
    }
  }

  return (
    <div className="space-y-6 lg:w-1/2 p-4">
      <div>
        <h3 className="text-lg font-bold">Add Bill</h3>
        <p className="text-sm text-zinc-500">
          Keep track of your expenses by adding a new bill. Fill in the details
          below to stay organized and never miss a due date!
        </p>
      </div>
      <Separator />
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.description")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("labels.description")} {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a brief name or description for this bill to help
                    identify it easily.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("labels.selectCategory")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="housing">
                        {t("labels.housing")}
                      </SelectItem>
                      <SelectItem value="transportation">
                        {t("labels.transportation")}
                      </SelectItem>
                      <SelectItem value="food">{t("labels.food")}</SelectItem>
                      <SelectItem value="utilities">
                        {t("labels.utilities")}
                      </SelectItem>
                      <SelectItem value="clothing">
                        {t("labels.clothing")}
                      </SelectItem>
                      <SelectItem value="healthcare">
                        {t("labels.healthcare")}
                      </SelectItem>
                      <SelectItem value="insurance">
                        {t("labels.insurance")}
                      </SelectItem>
                      <SelectItem value="personal">
                        {t("labels.personal")}
                      </SelectItem>
                      <SelectItem value="debt">{t("labels.debt")}</SelectItem>
                      <SelectItem value="savings">
                        {t("labels.savings")}
                      </SelectItem>
                      <SelectItem value="education">
                        {t("labels.education")}
                      </SelectItem>
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
                  <FormDescription>
                    Select a category to organize your bill, such as utilities,
                    rent, or subscriptions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.amount")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the total amount for this bill, including any
                    applicable taxes or fees.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Choose the due date to keep track of when this bill needs to
                    be paid.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-x-4">
              <Button type="submit">Add bill</Button>
              <Link to=".." relative="path">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
