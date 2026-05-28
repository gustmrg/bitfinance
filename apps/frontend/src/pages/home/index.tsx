import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  FileText,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { useAuthInitialization, useIsAuthenticated } from "@/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { CTAButton } from "./components/cta-button";
import { GoToDashboardButton } from "./components/dashboard-button";
import { Footer } from "./components/footer";
import { LoginButton } from "./components/login-button";
import { LogoutButton } from "./components/logout-button";

import logoImg from "/assets/app-icon.png";

interface FeatureItem {
  icon: LucideIcon;
  colorClass: string;
  iconColorClass: string;
  translationKey: string;
}

const features: FeatureItem[] = [
  { icon: BarChart3, colorClass: "bg-blue-100", iconColorClass: "text-blue-600", translationKey: "expenseTracking" },
  { icon: FileText, colorClass: "bg-green-100", iconColorClass: "text-green-600", translationKey: "billManagement" },
  { icon: TrendingUp, colorClass: "bg-purple-100", iconColorClass: "text-purple-600", translationKey: "financialInsights" },
  { icon: Shield, colorClass: "bg-orange-100", iconColorClass: "text-orange-600", translationKey: "secureData" },
];

interface StatItem {
  icon: LucideIcon;
  bgClass: string;
  iconColorClass: string;
  valueKey: string;
  labelKey: string;
}

const stats: StatItem[] = [
  { icon: Users, bgClass: "bg-blue-500/20", iconColorClass: "text-blue-400", valueKey: "users", labelKey: "usersLabel" },
  { icon: CreditCard, bgClass: "bg-green-500/20", iconColorClass: "text-green-400", valueKey: "billsTracked", labelKey: "billsLabel" },
  { icon: DollarSign, bgClass: "bg-purple-500/20", iconColorClass: "text-purple-400", valueKey: "moneySaved", labelKey: "moneySavedLabel" },
];

function NavAuthButtons() {
  const isInitialized = useAuthInitialization();
  const isAuthenticated = useIsAuthenticated();

  if (!isInitialized) {
    return <Skeleton className="h-10 w-24" />;
  }

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <GoToDashboardButton />
      <LogoutButton />
    </div>
  );
}

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Global"
          className="flex items-center justify-between p-4 sm:p-6 lg:px-8"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">BitFinance</span>
              <img alt="BitFinance logo" src={logoImg} className="h-14 w-auto sm:h-16" />
            </a>
          </div>

          <NavAuthButtons />
        </nav>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-400 to-indigo-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-4xl py-24 sm:py-40 lg:py-56">
          <div className="text-center">
            <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm">
              ✨ Now with enhanced security features
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              {t("home.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
              {t("home.subtitle")}
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-auto">
                <CTAButton />
              </div>
              <div className="w-full sm:w-auto">
                <NavLink to="/auth/sign-in" className="block">
                  <Button variant="outline" size="lg" className="w-full px-8">
                    {t("home.ctaSecondary")}
                  </Button>
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-400 to-blue-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      <div className="bg-white/50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("home.features.title")}
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              {t("home.features.subtitle")}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.translationKey} className="border-0 shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <CardHeader className="pb-2 text-center">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${feature.colorClass}`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColorClass}`} />
                  </div>
                  <CardTitle className="text-lg">
                    {t(`home.features.${feature.translationKey}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {t(`home.features.${feature.translationKey}.description`)}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("home.benefits.title")}
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.valueKey} className="text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${stat.bgClass}`}>
                    <stat.icon className={`h-8 w-8 ${stat.iconColorClass}`} />
                  </div>
                  <div className="text-4xl font-bold text-white">
                    {t(`home.benefits.stats.${stat.valueKey}`)}
                  </div>
                  <div className="mt-2 text-lg text-gray-300">
                    {t(`home.benefits.stats.${stat.labelKey}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
