"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { locale, dictionary: t } = useLocale();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  // Localized paths
  const buyPath = locale === "vi" ? `/${locale}/mua-xe` : `/${locale}/buy-cars`;
  const sellPath = locale === "vi" ? `/${locale}/ban-xe` : `/${locale}/sell-cars`;
  const authPath = `/${locale}/auth`;
  const dashboardPath = `/${locale}/dashboard`;
  const profilePath = `/${locale}/profile`;
  const isVi = locale === "vi"
  const postCarPath = isVi
    ? `/${locale}/ban-xe/dang-tin`
    : `/${locale}/sell-cars/post`

  const navLinks = [
    { href: `/${locale}`, label: t.nav.home },
    { href: buyPath, label: t.nav.buyCars },
    { href: sellPath, label: t.nav.sellCars },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === `/${locale}`;
    return pathname.startsWith(href);
  };

  const isAdminPage = pathname.includes('/admin');

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-7 text-primary" aria-hidden="true">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
          <span className="text-xl font-bold text-foreground">CarBroker</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {/* Desktop Auth */}
          <div className="hidden items-center gap-2 md:flex">
            <Button size="sm" asChild>
              <Link href={postCarPath}>
                {isVi ? "Đăng Tin" : "Post Car"}
              </Link>
            </Button>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {!isAdminPage && (
                    <DropdownMenuItem asChild>
                      <Link href={dashboardPath} className="flex items-center gap-2">
                        <LayoutDashboard className="size-4" />
                        {t.nav.dashboard}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={profilePath} className="flex items-center gap-2">
                      <UserCircle className="size-4" />
                      {t.nav.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href={authPath}>{t.nav.signIn}</Link>
                </Button>
                <Button asChild>
                  <Link href={`${authPath}?tab=signup`}>{t.nav.signUp}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 text-primary" aria-hidden="true">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                  CarBroker
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t pt-6">
                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!isAdminPage && (
                        <Link
                          href={dashboardPath}
                          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        >
                          <LayoutDashboard className="size-4" />
                          {t.nav.dashboard}
                        </Link>
                      )}
                      <Link
                        href={profilePath}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      >
                        <UserCircle className="size-4" />
                        {t.nav.profile}
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="size-4" />
                        {t.nav.logout}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href={authPath}>{t.nav.signIn}</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href={`${authPath}?tab=signup`}>{t.nav.signUp}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
