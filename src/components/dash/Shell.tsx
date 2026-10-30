"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { roleTone } from "@/lib/format";
import { SITE } from "@/lib/site";

export interface ShellUser {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "trainer" | "frontdesk" | "member";
  avatarMediaId: number | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  match: string;
}

const NAV: Record<string, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard, match: "/dashboard/admin" },
    { label: "Members", href: "/dashboard/admin/members", icon: Users, match: "/dashboard/admin/members" },
    { label: "Trainers", href: "/dashboard/admin/trainers", icon: UsersRound, match: "/dashboard/admin/trainers" },
    { label: "Classes", href: "/dashboard/admin/classes", icon: CalendarCheck, match: "/dashboard/admin/classes" },
    { label: "Payments", href: "/dashboard/admin/payments", icon: Receipt, match: "/dashboard/admin/payments" },
    { label: "Staff accounts", href: "/dashboard/admin/staff", icon: Settings, match: "/dashboard/admin/staff" },
    { label: "Inbox", href: "/dashboard/admin/inbox", icon: Inbox, match: "/dashboard/admin/inbox" },
  ],
  trainer: [
    { label: "Overview", href: "/dashboard/trainer", icon: LayoutDashboard, match: "/dashboard/trainer" },
    { label: "My classes", href: "/dashboard/trainer/classes", icon: CalendarCheck, match: "/dashboard/trainer/classes" },
    { label: "My members", href: "/dashboard/trainer/members", icon: Users, match: "/dashboard/trainer/members" },
    { label: "Profile", href: "/dashboard/trainer/profile", icon: UserRound, match: "/dashboard/trainer/profile" },
  ],
  frontdesk: [
    { label: "Overview", href: "/dashboard/frontdesk", icon: LayoutDashboard, match: "/dashboard/frontdesk" },
    { label: "Members", href: "/dashboard/frontdesk/members", icon: Users, match: "/dashboard/frontdesk/members" },
    { label: "Check-ins", href: "/dashboard/frontdesk/checkins", icon: ClipboardCheck, match: "/dashboard/frontdesk/checkins" },
    { label: "Payments", href: "/dashboard/frontdesk/payments", icon: CreditCard, match: "/dashboard/frontdesk/payments" },
    { label: "Inbox", href: "/dashboard/frontdesk/inbox", icon: Inbox, match: "/dashboard/frontdesk/inbox" },
  ],
  member: [
    { label: "My dashboard", href: "/dashboard/member", icon: Home, match: "/dashboard/member" },
    { label: "Membership", href: "/dashboard/member/membership", icon: CreditCard, match: "/dashboard/member/membership" },
    { label: "Classes", href: "/dashboard/member/classes", icon: CalendarCheck, match: "/dashboard/member/classes" },
    { label: "Contact coach", href: "/dashboard/member/contact", icon: Inbox, match: "/dashboard/member/contact" },
  ],
};

const TITLES: Record<string, string> = {
  "/dashboard/admin": "Admin overview",
  "/dashboard/admin/members": "Member management",
  "/dashboard/admin/trainers": "Trainer profiles",
  "/dashboard/admin/classes": "Class schedule",
  "/dashboard/admin/payments": "Payments & revenue",
  "/dashboard/admin/staff": "Staff accounts",
  "/dashboard/admin/inbox": "Contact inbox",
  "/dashboard/trainer": "Trainer overview",
  "/dashboard/trainer/classes": "My classes",
  "/dashboard/trainer/members": "Members I train",
  "/dashboard/trainer/profile": "My profile",
  "/dashboard/frontdesk": "Front desk overview",
  "/dashboard/frontdesk/members": "Member registry",
  "/dashboard/frontdesk/checkins": "Check-in desk",
  "/dashboard/frontdesk/payments": "Collect payments",
  "/dashboard/frontdesk/inbox": "Contact inbox",
  "/dashboard/member": "Member portal",
};

export function Shell({
  user,
  announcement,
  children,
}: {
  user: ShellUser;
  announcement?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const items = NAV[user.role] ?? NAV.member;

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const title =
    TITLES[pathname] ?? Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "Dashboard";

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* brand */}
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/8 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-9 w-auto" />
        </Link>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-smoke-400 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Dashboard">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider2 text-smoke-600">
          {user.role === "admin" ? "Management" : user.role === "trainer" ? "Coaching" : user.role === "member" ? "Member portal" : "Front desk"}
        </p>
        <ul className="space-y-1">
          {items.map((item, i) => {
            const active =
              item.match === pathname ||
              (item.href !== "/dashboard/" + user.role && pathname.startsWith(item.match) && item.match !== "/");

            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35 }}
              >
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                    active
                      ? "bg-volt-300/12 text-volt-300"
                      : "text-smoke-400 hover:bg-white/5 hover:text-smoke-100"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-bar"
                      className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-volt-300"
                    />
                  )}
                  <item.icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-volt-300" : "text-smoke-500 group-hover:text-smoke-300"}`}
                  />
                  {item.label}
                </Link>
              </motion.li>
            );
          })}
        </ul>

        {announcement && (
          <div className="mt-6 rounded-xl border border-volt-300/25 bg-volt-300/8 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-volt-300">
              Notice
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-smoke-300">{announcement}</p>
          </div>
        )}
      </nav>

      {/* user */}
      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
          <Avatar name={user.fullName} mediaId={user.avatarMediaId} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-smoke-100">{user.fullName}</p>
            <p className="truncate text-[11px] capitalize">
              <span className={`rounded px-1.5 py-0.5 ${roleTone(user.role)}`}>{user.role}</span>
            </p>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-smoke-500 transition hover:border-ember/50 hover:text-ember"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950">
      {/* ------------------------------------------------ desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-ink-900 lg:block">
        {sidebar}
      </aside>

      {/* ------------------------------------------------ mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-ink-900 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------ content */}
      <div className="lg:pl-64">
        {/* topbar */}
        <header className="sticky top-0 z-30 glass border-b border-white/10">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-smoke-300 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-smoke-100 sm:text-lg">
                  {title}
                </p>
                <p className="hidden text-[11px] uppercase tracking-wider text-smoke-500 sm:block">
                  {SITE.name} · {SITE.address.line1}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost btn-sm hidden sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View site
              </a>

              <div className="relative">
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="flex items-center gap-2 rounded-full border border-white/12 p-1 pr-3 transition hover:border-volt-300/50"
                  aria-label="Account menu"
                >
                  <Avatar name={user.fullName} mediaId={user.avatarMediaId} size="xs" />
                  <span className="hidden text-xs font-medium text-smoke-200 sm:block">
                    {user.fullName.split(" ")[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {menu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-white/12 bg-ink-900 p-2 shadow-card"
                      onMouseLeave={() => setMenu(false)}
                    >
                      <div className="border-b border-white/8 px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-smoke-100">
                          {user.fullName}
                        </p>
                        <p className="truncate text-[11px] text-smoke-500">{user.email}</p>
                      </div>
                      <Link
                        href={
                          user.role === "trainer"
                            ? "/dashboard/trainer/profile"
                            : user.role === "member"
                              ? "/membership"
                              : "/dashboard/" + user.role
                        }
                        onClick={() => setMenu(false)}
                        className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-smoke-300 transition hover:bg-white/5 hover:text-smoke-100"
                      >
                        <UserRound className="h-4 w-4" />
                        My profile
                      </Link>
                      <Link
                        href="/"
                        onClick={() => setMenu(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-smoke-300 transition hover:bg-white/5 hover:text-smoke-100"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Public site
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ember transition hover:bg-ember/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
