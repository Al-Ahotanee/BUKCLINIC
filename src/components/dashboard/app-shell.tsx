"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings2,
  Shield,
  Stethoscope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Logo } from "@/components/site/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { initials, type SessionUser } from "@/lib/api";
import { StudentDash, STUDENT_SECTIONS, type StudentSection } from "./student-dash";
import { DoctorDash, DOCTOR_SECTIONS, type DoctorSection } from "./doctor-dash";
import { AdminDash, ADMIN_SECTIONS, type AdminSection } from "./admin-dash";

type AnySection = StudentSection | DoctorSection | AdminSection;

interface NavItem {
  key: AnySection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: Record<SessionUser["role"], NavItem[]> = {
  student: STUDENT_SECTIONS,
  doctor: DOCTOR_SECTIONS,
  admin: ADMIN_SECTIONS,
};

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  student: "Student portal",
  doctor: "Doctor portal",
  admin: "Admin console",
};

export function AppShell({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const items = NAV[user.role];
  const [section, setSection] = useState<AnySection>(items[0].key);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = items.find((i) => i.key === section) ?? items[0];

  const nav = (extra?: { badge?: number }) => (
    <nav className="flex flex-col gap-1 px-3" aria-label="Dashboard sections">
      {items.map((item) => {
        const active = item.key === section;
        return (
          <button
            key={item.key}
            onClick={() => {
              setSection(item.key);
              setMobileOpen(false);
            }}
            aria-current={active ? "page" : undefined}
            className={
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")
            }
          >
            <item.icon className={"h-4.5 w-4.5 " + (active ? "text-primary" : "")} />
            {item.label}
            {item.key === "messages" && (extra?.badge ?? 0) > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {extra!.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const sidebarInner = (unread: number) => (
    <div className="flex h-full flex-col gap-1 py-4">
      <div className="px-5 pb-4">
        <Link href="/" aria-label="Bayero University Clinic home">
          <Logo />
        </Link>
      </div>
      <p className="px-6 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {ROLE_LABEL[user.role]}
      </p>
      {nav({ badge: unread })}
      <div className="mt-auto px-4 pt-4">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{user.role}{user.specialization ? ` · ${user.specialization}` : ""}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={onLogout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        {sidebarInner(0)}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b-2 border-b-primary/60 bg-background/85 px-4 backdrop-blur-lg sm:px-6">
          {/* Mobile drawer trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-sidebar p-0 [&>button]:hidden">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebarInner(0)}
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2.5 min-w-0">
            <current.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
            <h1 className="truncate text-[15px] font-bold tracking-tight">{current.label}</h1>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full border px-2 py-1.5 transition-colors hover:bg-accent" aria-label="Account menu">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "student" && (
                  <>
                    <DropdownMenuItem onClick={() => setSection("profile")}>
                      <UserRound className="h-4 w-4" /> My profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSection("appointments")}>
                      <CalendarDays className="h-4 w-4" /> My appointments
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === "doctor" && (
                  <DropdownMenuItem onClick={() => setSection("overview")}>
                    <LayoutDashboard className="h-4 w-4" /> Today's schedule
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => setSection("users")}>
                    <Users className="h-4 w-4" /> Manage users
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onLogout}>
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {user.role === "student" && <StudentDash user={user} section={section as StudentSection} setSection={setSection} />}
          {user.role === "doctor" && <DoctorDash user={user} section={section as DoctorSection} setSection={setSection} />}
          {user.role === "admin" && <AdminDash user={user} section={section as AdminSection} />}
          <p className="mt-10 text-center text-xs text-muted-foreground">
            This platform handles booking and messaging only. It does not replace physical examination — in an
            emergency, go directly to the clinic.
          </p>
        </main>
      </div>
    </div>
  );
}

export const DASH_ICONS = { CalendarPlus, CalendarDays, LayoutDashboard, MessageSquareText, UserRound, Users, Settings2, Shield, Stethoscope };
