import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { getSafeReturnUrl } from "@/auth/get-safe-return-url";
import { useIsAuthenticated, useLoginAction } from "@/auth/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const signInForm = z.object({
  email: z.string().email({ message: "Must be a valid email" }),
  password: z
    .string()
    .min(8, { message: "Must have at least 8 characters" })
    .regex(passwordValidation, { message: "Password format is invalid" }),
});

type SignInForm = z.infer<typeof signInForm>;

export function SignIn() {
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInForm),
  });

  const login = useLoginAction();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl"));
  const signUpHref = `/auth/sign-up?returnUrl=${encodeURIComponent(returnUrl)}`;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  async function handleSignIn(data: SignInForm) {
    const isSuccess = await login({
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
          {t("auth.signIn.title")}
        </h2>
      </div>
      <div className="mt-8 w-full">
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("auth.signIn.demoAccount")}
            <br />
            <strong>Username:</strong> demo@bitfinance.com
            <br />
            <strong>{t("labels.password")}:</strong> Demo@123
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSignIn)}>
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
                  {t("labels.signingIn")}
                </>
              ) : (
                t("labels.signIn")
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-6">
          <p className="text-center text-sm leading-5 text-gray-600">
            {t("auth.signIn.redirect")}{" "}
              <NavLink
               to={form.formState.isSubmitting ? "#" : signUpHref}
               className="font-medium text-blue-600 hover:text-blue-500"
             >
              {t("labels.signUp")}
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
