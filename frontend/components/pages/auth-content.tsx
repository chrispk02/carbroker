"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Car, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

function AuthForm() {
  const { locale, dictionary: t } = useLocale();
  const { login, signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller">("buyer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    rememberMe: false,
    agreeTerms: false,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(formData.email, formData.password);
    setIsLoading(false);
    if (success) {
      const returnUrl = searchParams.get("returnUrl") || `/${locale}`;
      router.push(returnUrl);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms) return;
    setIsLoading(true);
    const success = await signup(
      formData.name,
      formData.email,
      formData.password,
      selectedRole
    );
    setIsLoading(false);
    if (success) {
      router.push(`/${locale}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 bg-primary lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(0,0,0,0.3),rgba(0,0,0,0.5))]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-foreground">
              CarBroker
            </span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-primary-foreground text-balance">
              Your Trusted Car
              <br />
              Marketplace
            </h1>
            <p className="max-w-md text-lg text-primary-foreground/80">
              {t.auth.platformBenefit}
            </p>

            <div className="flex gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10">
                  <Shield className="size-5 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-primary-foreground">
                  Broker Protected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10">
                  <Car className="size-5 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-primary-foreground">
                  Verified Cars
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10">
                  <Users className="size-5 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-primary-foreground">
                  Trusted Sellers
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © 2026 CarBroker. {t.footer.allRightsReserved}
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 lg:p-6">
          <Link href={`/${locale}`} className="flex items-center gap-2 lg:hidden">
            <span className="text-xl font-bold text-foreground">CarBroker</span>
          </Link>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t.nav.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{t.nav.signUp}</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t.auth.welcomeBack}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.auth.signInSubtitle}
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>{t.auth.email}</FieldLabel>
                      <Input
                        type="email"
                        placeholder={t.auth.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>{t.auth.password}</FieldLabel>
                      <Input
                        type="password"
                        placeholder={t.auth.passwordPlaceholder}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                      />
                    </Field>
                  </FieldGroup>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, rememberMe: !!checked })
                        }
                      />
                      {t.auth.rememberMe}
                    </label>
                    <Link
                      href="#"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {t.auth.forgotPassword}
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? t.common.loading : t.auth.signInButton}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t.auth.orContinueWith}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button">
                    <svg className="mr-2 size-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t.auth.google}
                  </Button>
                  <Button variant="outline" type="button">
                    <svg className="mr-2 size-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      />
                    </svg>
                    {t.auth.facebook}
                  </Button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t.auth.dontHaveAccount}{" "}
                  <Link
                    href={`/${locale}/auth?tab=signup`}
                    className="font-medium text-accent hover:underline"
                  >
                    {t.nav.signUp}
                  </Link>
                </p>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    {t.auth.createAccount}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.auth.signUpSubtitle}
                  </p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>{t.auth.fullName}</FieldLabel>
                      <Input
                        type="text"
                        placeholder={t.auth.fullNamePlaceholder}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>{t.auth.email}</FieldLabel>
                      <Input
                        type="email"
                        placeholder={t.auth.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel>{t.auth.password}</FieldLabel>
                      <Input
                        type="password"
                        placeholder={t.auth.passwordPlaceholder}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                      />
                    </Field>
                  </FieldGroup>

                  {/* Role Selection */}
                  <div>
                    <FieldLabel className="mb-2 block">{t.auth.selectRole}</FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("buyer")}
                        className={cn(
                          "rounded-lg border-2 p-4 text-left transition-colors",
                          selectedRole === "buyer"
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        <Car className="mb-2 size-5 text-muted-foreground" />
                        <p className="font-medium text-foreground">{t.auth.buyer}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.auth.buyerDesc}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("seller")}
                        className={cn(
                          "rounded-lg border-2 p-4 text-left transition-colors",
                          selectedRole === "seller"
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-muted-foreground"
                        )}
                      >
                        <Users className="mb-2 size-5 text-muted-foreground" />
                        <p className="font-medium text-foreground">
                          {t.auth.sellerRole}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.auth.sellerDesc}
                        </p>
                      </button>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, agreeTerms: !!checked })
                      }
                      required
                    />
                    <span>
                      {t.auth.agreeTerms}{" "}
                      <Link href="#" className="text-accent hover:underline">
                        {t.auth.termsOfService}
                      </Link>{" "}
                      {t.auth.and}{" "}
                      <Link href="#" className="text-accent hover:underline">
                        {t.auth.privacyPolicy}
                      </Link>
                    </span>
                  </label>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || !formData.agreeTerms}
                  >
                    {isLoading ? t.common.loading : t.auth.signUpButton}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t.auth.orContinueWith}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button">
                    <svg className="mr-2 size-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t.auth.google}
                  </Button>
                  <Button variant="outline" type="button">
                    <svg className="mr-2 size-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      />
                    </svg>
                    {t.auth.facebook}
                  </Button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t.auth.alreadyHaveAccount}{" "}
                  <Link
                    href={`/${locale}/auth`}
                    className="font-medium text-accent hover:underline"
                  >
                    {t.nav.signIn}
                  </Link>
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthContent() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
