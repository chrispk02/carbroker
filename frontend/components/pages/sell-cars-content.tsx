"use client";

import Link from "next/link";
import { Shield, DollarSign, Users, Clock, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAuth } from "@/lib/auth/context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SellCarsContent() {
  const { locale, dictionary: t } = useLocale();
  const { isAuthenticated } = useAuth();

  const steps = [
    { title: t.sellCars.step1Title, description: t.sellCars.step1Desc },
    { title: t.sellCars.step2Title, description: t.sellCars.step2Desc },
    { title: t.sellCars.step3Title, description: t.sellCars.step3Desc },
  ];

  const benefits = [
    { icon: Shield, title: t.sellCars.benefit1Title, description: t.sellCars.benefit1Desc },
    { icon: Users, title: t.sellCars.benefit2Title, description: t.sellCars.benefit2Desc },
    { icon: DollarSign, title: t.sellCars.benefit3Title, description: t.sellCars.benefit3Desc },
    { icon: Clock, title: t.sellCars.benefit4Title, description: t.sellCars.benefit4Desc },
  ];

  const authPath = `/${locale}/auth`;

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
      <section className="border-b bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t.sellCars.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t.sellCars.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button size="lg" className="gap-2" asChild>
              <Link href={isAuthenticated ? "/dashboard" : authPath}>
                {isAuthenticated ? t.sellCars.ctaButton : t.sellCars.ctaButtonAuth}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">{t.sellCars.ctaSubtext}</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground">
            {t.sellCars.howItWorks}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground text-lg font-bold">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground">
            {t.sellCars.whySell}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary">
                    <benefit.icon className="size-6 text-accent" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      </div>
      <SiteFooter />
    </>
  );
}
