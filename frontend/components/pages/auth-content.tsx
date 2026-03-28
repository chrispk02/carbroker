"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Car, Users, Mail, CheckCircle2, RotateCcw, Phone, KeyRound, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

const GoogleIcon = () => (
  <svg className="mr-2 size-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

function AuthForm() {
  const { locale, dictionary: t } = useLocale();
  const { login, signup, resendConfirmationEmail, sendLoginOtp, verifyLoginOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"signin" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );

  // URL-level error (from Supabase email callback)
  const urlErrorCode = searchParams.get("error_code")
  const urlErrorMessages: Record<string, string> = {
    otp_expired:          locale === "vi" ? "Link xác nhận đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại email." : "Confirmation link has expired. Please sign up again or resend the email.",
    confirmation_failed:  locale === "vi" ? "Xác nhận email thất bại. Vui lòng thử lại." : "Email confirmation failed. Please try again.",
    access_denied:        locale === "vi" ? "Truy cập bị từ chối. Link không hợp lệ hoặc đã hết hạn." : "Access denied. The link is invalid or has expired.",
  }
  const urlError = urlErrorCode ? (urlErrorMessages[urlErrorCode] ?? urlErrorMessages.confirmation_failed) : null

  // Shared
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sign in
  const [signInMode, setSignInMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Phone login
  const [phoneLogin, setPhoneLogin] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");

  // Sign up
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller">("buyer");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  function switchTab(next: "signin" | "signup") {
    setTab(next);
    setAuthError(null);
  }

  // ─── Handlers ────────────────────────────────────────────────
  async function handleSignIn(e: React.SyntheticEvent) {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    const { error } = await login(email, password);
    setIsLoading(false);
    if (error) { setAuthError(error); return; }
    router.push(searchParams.get("returnUrl") || `/${locale}`);
  }

  async function handleSendOtp(e: React.SyntheticEvent) {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    const { error } = await sendLoginOtp(phoneLogin.trim());
    setIsLoading(false);
    if (error) { setAuthError(error); return; }
    setPhoneOtpSent(true);
  }

  async function handleVerifyOtp(e: React.SyntheticEvent) {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    const { error } = await verifyLoginOtp(phoneLogin.trim(), phoneOtp.trim());
    setIsLoading(false);
    if (error) { setAuthError(error); return; }
    router.push(searchParams.get("returnUrl") || `/${locale}`);
  }

  async function handleSignUp(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!agreeTerms) return;
    setAuthError(null);
    setIsLoading(true);
    const { error } = await signup(signupName, signupEmail, signupPassword, selectedRole);
    setIsLoading(false);
    if (error) { setAuthError(error); return; }
    setSignupSuccess(true);
  }

  async function handleResendEmail() {
    setResendLoading(true);
    await resendConfirmationEmail(signupEmail);
    setResendLoading(false);
    setResendSent(true);
    setTimeout(() => setResendSent(false), 60000);
  }

  // ─── Shared UI ───────────────────────────────────────────────
  const Divider = () => (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
      </div>
    </div>
  );

  const GoogleButton = () => (
    <Button variant="outline" type="button" className="w-full">
      <GoogleIcon />{t.auth.google}
    </Button>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel */}
      <div className="relative hidden w-1/2 bg-primary lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(0,0,0,0.3),rgba(0,0,0,0.5))]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-foreground">CarBroker</span>
          </Link>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-primary-foreground text-balance">
              Your Trusted Car<br />Marketplace
            </h1>
            <p className="max-w-md text-lg text-primary-foreground/80">{t.auth.platformBenefit}</p>
            <div className="flex gap-8 pt-4">
              {[
                { icon: Shield, label: "Broker Protected" },
                { icon: Car, label: "Verified Cars" },
                { icon: Users, label: "Trusted Sellers" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10">
                    <Icon className="size-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-primary-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-primary-foreground/60">© 2026 CarBroker. {t.footer.allRightsReserved}</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <Link href={`/${locale}`} className="flex items-center gap-2 lg:hidden">
            <span className="text-xl font-bold text-foreground">CarBroker</span>
          </Link>
          <div className="ml-auto"><LanguageSwitcher /></div>
        </div>

        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            {urlError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {urlError}
              </div>
            )}

            <Tabs value={tab} onValueChange={(v) => switchTab(v as "signin" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t.nav.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{t.nav.signUp}</TabsTrigger>
              </TabsList>

              {/* ── Sign In ── */}
              <TabsContent value="signin" className="mt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">{t.auth.welcomeBack}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t.auth.signInSubtitle}</p>
                </div>

                {/* Email / Phone toggle */}
                <div className="mb-4 flex rounded-lg border p-1 gap-1">
                  {(["email", "phone"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setSignInMode(mode); setAuthError(null); setPhoneOtpSent(false); setPhoneOtp(""); }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-colors",
                        signInMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === "email" ? <><Mail className="size-3.5" /> Email</> : <><Phone className="size-3.5" /> {t.phoneAuth.phoneLabel}</>}
                    </button>
                  ))}
                </div>

                {authError && (
                  <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{authError}</div>
                )}

                {signInMode === "email" ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <FieldGroup>
                      <Field>
                        <FieldLabel>{t.auth.email}</FieldLabel>
                        <Input type="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </Field>
                      <Field>
                        <FieldLabel>{t.auth.password}</FieldLabel>
                        <Input type="password" placeholder={t.auth.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </Field>
                    </FieldGroup>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={rememberMe} onCheckedChange={(c) => setRememberMe(!!c)} />
                        {t.auth.rememberMe}
                      </label>
                      <Link href="#" className="text-sm font-medium text-accent hover:underline">{t.auth.forgotPassword}</Link>
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? t.common.loading : t.auth.signInButton}
                    </Button>
                  </form>
                ) : !phoneOtpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <Field>
                      <FieldLabel>{t.phoneAuth.phoneLabel}</FieldLabel>
                      <Input type="tel" placeholder="+84912345678" value={phoneLogin} onChange={(e) => setPhoneLogin(e.target.value)} required />
                      <p className="mt-1 text-[11px] text-muted-foreground">{t.phoneAuth.hint}</p>
                    </Field>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading || !phoneLogin.trim()}>
                      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Phone className="mr-2 size-4" />}
                      {isLoading ? t.phoneAuth.sending : t.phoneAuth.sendOtp}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t.phoneAuth.otpSentTo} <span className="font-medium text-foreground">{phoneLogin}</span>
                    </p>
                    <Field>
                      <FieldLabel>{t.phoneAuth.otpCode}</FieldLabel>
                      <Input placeholder="123456" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} maxLength={6} className="text-center tracking-widest text-xl font-mono" required />
                    </Field>
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading || phoneOtp.length < 4}>
                      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
                      {isLoading ? t.phoneAuth.verifying : t.phoneAuth.signIn}
                    </Button>
                    <button type="button" onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                      {t.phoneAuth.changePhone}
                    </button>
                  </form>
                )}

                <Divider />
                <GoogleButton />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t.auth.dontHaveAccount}{" "}
                  <button type="button" onClick={() => switchTab("signup")} className="font-medium text-accent hover:underline">
                    {t.nav.signUp}
                  </button>
                </p>
              </TabsContent>

              {/* ── Sign Up ── */}
              <TabsContent value="signup" className="mt-6">
                {signupSuccess ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Mail className="size-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{t.auth.checkEmail}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.auth.confirmSentTo} <span className="font-medium text-foreground">{signupEmail}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.auth.clickLinkToActivate}</p>
                    <div className="mt-6 rounded-lg border bg-secondary/50 px-4 py-3 text-left text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{t.auth.didntReceive}</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        <li>{t.auth.checkSpam}</li>
                        <li>{t.auth.waitAndRetry}</li>
                      </ul>
                    </div>
                    {selectedRole === 'seller' && (
                      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-left text-xs">
                        <p className="font-medium text-amber-800 dark:text-amber-300">{t.kyc.kycRequired}</p>
                        <p className="mt-0.5 text-amber-700 dark:text-amber-400">{t.kyc.kycRequiredDesc}</p>
                      </div>
                    )}
                    {resendSent ? (
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-600">
                        <CheckCircle2 className="size-4" /> {t.auth.emailResent}
                      </div>
                    ) : (
                      <button onClick={handleResendEmail} disabled={resendLoading} className="mt-4 mx-auto flex items-center gap-2 text-sm text-accent hover:underline disabled:opacity-50">
                        <RotateCcw className={cn("size-3.5", resendLoading && "animate-spin")} />
                        {resendLoading ? t.auth.resendSending : t.auth.resendConfirmation}
                      </button>
                    )}
                    <Button variant="outline" className="mt-6 w-full" onClick={() => { setSignupSuccess(false); setSignupName(""); setSignupEmail(""); setSignupPassword(""); setAgreeTerms(false); }}>
                      {t.auth.registerAnother}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground">{t.auth.createAccount}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{t.auth.signUpSubtitle}</p>
                    </div>

                    {authError && (
                      <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{authError}</div>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-4">
                      <FieldGroup>
                        <Field>
                          <FieldLabel>{t.auth.fullName}</FieldLabel>
                          <Input type="text" placeholder={t.auth.fullNamePlaceholder} value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                        </Field>
                        <Field>
                          <FieldLabel>{t.auth.email}</FieldLabel>
                          <Input type="email" placeholder={t.auth.emailPlaceholder} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                        </Field>
                        <Field>
                          <FieldLabel>{t.auth.password}</FieldLabel>
                          <Input type="password" placeholder={t.auth.passwordPlaceholder} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                        </Field>
                      </FieldGroup>

                      <div>
                        <FieldLabel className="mb-2 block">{t.auth.selectRole}</FieldLabel>
                        <div className="grid grid-cols-2 gap-3">
                          {(["buyer", "seller"] as const).map((r) => (
                            <button key={r} type="button" onClick={() => setSelectedRole(r)} className={cn("rounded-lg border-2 p-4 text-left transition-colors", selectedRole === r ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground")}>
                              {r === "buyer" ? <Car className="mb-2 size-5 text-muted-foreground" /> : <Users className="mb-2 size-5 text-muted-foreground" />}
                              <p className="font-medium text-foreground">{r === "buyer" ? t.auth.buyer : t.auth.sellerRole}</p>
                              <p className="text-xs text-muted-foreground">{r === "buyer" ? t.auth.buyerDesc : t.auth.sellerDesc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox className="mt-0.5" checked={agreeTerms} onCheckedChange={(c) => setAgreeTerms(!!c)} />
                        <span>
                          {t.auth.agreeTerms}{" "}
                          <Link href="#" className="text-accent hover:underline">{t.auth.termsOfService}</Link>
                          {" "}{t.auth.and}{" "}
                          <Link href="#" className="text-accent hover:underline">{t.auth.privacyPolicy}</Link>
                        </span>
                      </label>

                      <Button type="submit" className="w-full" size="lg" disabled={isLoading || !agreeTerms}>
                        {isLoading ? t.common.loading : t.auth.signUpButton}
                      </Button>
                    </form>

                    <Divider />
                    <GoogleButton />

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                      {t.auth.alreadyHaveAccount}{" "}
                      <button type="button" onClick={() => switchTab("signin")} className="font-medium text-accent hover:underline">
                        {t.nav.signIn}
                      </button>
                    </p>
                  </>
                )}
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
