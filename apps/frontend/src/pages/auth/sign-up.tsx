import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { getSafeReturnUrl } from "@/auth/get-safe-return-url";
import { useRegisterAction } from "@/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { passwordValidation } from "@/lib/validations";

import logoImg from "/assets/app-icon.png";

const signUpForm = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Must be a valid email" }),
  password: z
    .string()
    .min(8, { message: "Must have at least 8 characters" })
    .regex(passwordValidation, { message: "Password format is invalid" }),
});

type SignUpForm = z.infer<typeof signUpForm>;

export function SignUp() {
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpForm),
  });

  const register = useRegisterAction();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"));
  const signInHref = `/auth/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`;

  async function handleSignUp(data: SignUpForm) {
    const isSuccess = await register({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });

    if (isSuccess) {
      navigate(returnUrl, { replace: true });
    }
  }

  return (
    <div className="w-full max-w-sm py-2">
      <div className="w-full">
        <img alt="BitFinance logo" src={logoImg} className="mx-auto h-14 w-auto" />
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {t("auth.signUp.title")}
        </h2>
      </div>
      <div className="mt-8 w-full">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSignUp)}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-medium leading-6 text-gray-900">
                      {t("labels.firstName")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Steve" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-medium leading-6 text-gray-900">
                      {t("labels.lastName")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Jobs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium leading-6 text-gray-900">
                    {t("labels.email")}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe@email.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium leading-6 text-gray-900">
                    {t("labels.password")}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="********" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("labels.signingUp")}
                </>
              ) : (
                t("labels.signUp")
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          <p className="text-center text-sm leading-5 text-gray-600">
            {t("auth.signUp.redirect")}{" "}
              <NavLink
               to={form.formState.isSubmitting ? "#" : signInHref}
               className="font-medium text-blue-600 hover:text-blue-500"
             >
              {t("labels.signIn")}
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
