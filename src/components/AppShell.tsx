import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Activity, Globe, Heart, LogIn, LogOut, Search, Star, User } from "lucide-react";
import type { ReactNode } from "react";
import { LANGS, useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NetworkBanner } from "@/components/NetworkBanner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label={t("nav.language")}>
          <Globe className="size-4" />
          <span className="uppercase">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.code} onSelect={() => setLang(l.code as Lang)}>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children, showBack }: { children: ReactNode; showBack?: boolean }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-3 sm:gap-2 sm:px-4">
          {showBack ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{t("nav.back")}</span>
            </Button>
          ) : null}

          <Link to="/" className="mr-auto flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground shadow-float">
              €
            </span>
            <span className="truncate font-display text-lg font-bold tracking-tight">
              {t("app.name")}
            </span>
          </Link>

          <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
            <Link to="/">
              <Search className="size-4" />
              <span className="hidden sm:inline">{t("nav.feed")}</span>
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
                <Link to="/saved">
                  <Heart className="size-4" />
                  <span className="hidden sm:inline">{t("nav.saved")}</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
                <Link to="/profile">
                  <User className="size-4" />
                  <span className="hidden sm:inline">{t("profile.title")}</span>
                </Link>
              </Button>
            </>
          ) : null}
          <LanguageSwitcher />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={async () => {
                await supabase.auth.signOut();
                router.invalidate();
              }}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("nav.signout")}</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
              <Link to="/auth">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">{t("nav.signin")}</span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      <NetworkBanner />

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link to="/info" className="text-muted-foreground hover:text-foreground">
              {t("footer.info")}
            </Link>
            <Link to="/support" className="text-muted-foreground hover:text-foreground">
              {t("footer.support")}
            </Link>
            <Link to="/imprint" className="text-muted-foreground hover:text-foreground">
              {t("footer.imprint")}
            </Link>
            <Link
              to="/reviews"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Star className="size-3.5" />
              {t("footer.reviews")}
            </Link>
            <Link to="/invite" className="text-muted-foreground hover:text-foreground">
              {t("footer.invite")}
            </Link>
            <Link
              to="/monitoring"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Activity className="size-3.5" />
              {t("monitor.title")}
            </Link>
          </nav>
          <p className="mt-6 text-xs text-muted-foreground">{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
