import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { ArrowRight, BadgeCheck, Building2, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  useGetMeAction,
  useSetSelectedOrganizationId,
} from "@/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";

import logoImg from "/assets/app-icon.png";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(1),
});

type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>;

const benefits = [
  { icon: Building2, key: "workspace" },
  { icon: Users, key: "invites" },
  { icon: BadgeCheck, key: "settings" },
] as const;

export function CreateOrganization() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getMe = useGetMeAction();
  const setSelectedOrganizationId = useSetSelectedOrganizationId();
  const { createOrganizationAsync, isCreatingOrganization } =
    useOrganizationMutations();

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
    },
  });

  const handleSubmit = async (data: CreateOrganizationFormValues) => {
    try {
      const response = await createOrganizationAsync({
        name: data.name,
      });

      await getMe();
      setSelectedOrganizationId(response.id);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 via-background to-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <Card className="w-full animate-in fade-in-0 slide-in-from-bottom-4 overflow-hidden border-zinc-200/80 shadow-xl backdrop-blur duration-500">
          <div className="flex flex-col lg:flex-row">
            {/* Left panel — gradient info */}
            <div className="relative order-2 flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 text-white dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 sm:p-10 lg:order-1 lg:w-[45%] lg:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative space-y-6">
                <Badge
                  variant="outline"
                  className="border-white/20 bg-white/15 text-white hover:bg-white/20"
                >
                  {t("organization.create.eyebrow")}
                </Badge>

                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    {t("organization.create.title")}
                  </h1>
                  <p className="text-sm leading-relaxed text-blue-100 sm:text-base">
                    {t("organization.create.description")}
                  </p>
                </div>
              </div>

              <div className="relative mt-8 space-y-3">
                {benefits.map((benefit, i) => (
                  <div
                    key={benefit.key}
                    className="animate-in fade-in-0 slide-in-from-left-2 flex items-start gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm transition-colors duration-300 fill-mode-both hover:bg-white/15"
                    style={{ animationDelay: `${(i + 1) * 100 + 400}ms` }}
                  >
                    <benefit.icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-200" />
                    <p className="text-sm font-medium leading-snug">
                      {t(`organization.create.benefits.${benefit.key}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel — form */}
            <div className="order-1 flex flex-col justify-center p-8 sm:p-10 lg:order-2 lg:w-[55%]">
              <div className="mx-auto w-full max-w-md space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      alt="BitFinance"
                      src={logoImg}
                      className="h-10 w-auto"
                    />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        BitFinance
                      </p>
                      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {t("organization.create.formTitle")}
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("organization.create.formDescription")}
                  </p>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("organization.create.nameLabel")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                "organization.create.namePlaceholder"
                              )}
                              autoComplete="organization"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("organization.create.nameDescription")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      disabled={
                        !form.formState.isValid || isCreatingOrganization
                      }
                      className="w-full justify-center gap-2"
                    >
                      {isCreatingOrganization ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {isCreatingOrganization
                        ? t("organization.create.submitting")
                        : t("organization.create.submit")}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
