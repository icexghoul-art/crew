import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Sword,
  Users,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/wars", label: "War Logs", icon: Sword },
    { href: "/pvp", label: "1v1 Arena", icon: Users },
    { href: "/war-team", label: "War Teams", icon: Zap },
  ];

  if (user) {
    navItems.push({
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    });
    if (user.role === "admin" || user.role === "moderator") {
      navItems.push({ href: "/admin", label: "Admin", icon: Shield });
    }
  }

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-accent flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all duration-300">
            <Sword className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <span className="font-display text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 group-hover:to-primary transition-all">
            NICK STAN
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          <div className="h-6 w-px bg-white/10 mx-2" />

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-display text-primary">
                {user.username}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium shadow-lg shadow-[#5865F2]/20 border-none"
            >
              <a href="/api/auth/discord">Log In with Discord</a>
            </Button>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-secondary/95 border-l border-white/10 w-[300px]"
          >
            <div className="flex flex-col gap-6 mt-10">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 text-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}

              <div className="h-px w-full bg-white/10 my-2" />

              {user ? (
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              ) : (
                <Button
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
                  asChild
                >
                  <a href="/api/auth/discord">Log In with Discord</a>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
