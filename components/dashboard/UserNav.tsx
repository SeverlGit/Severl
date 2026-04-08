"use client";

import * as React from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { CreditCard, LogOut, Settings2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

export function UserNav() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  if (!user) return null;

  const fName = user.firstName || "";
  const lName = user.lastName || "";
  const initials = fName && lName
    ? `${fName[0]}${lName[0]}`
    : fName
      ? fName[0]
      : "U";

  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative h-7 w-7 rounded-full cursor-pointer overflow-hidden ring-1 ring-white/10 transition-all hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose/40"
            aria-label="Open account menu"
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
              <AvatarFallback className="bg-surface-hover text-[10px] font-medium text-txt-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 bg-panel border-border shadow-lg"
          align="start"
          side="right"
          sideOffset={14}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              <p className="text-[13px] font-semibold leading-none text-txt-primary">
                {user.fullName}
              </p>
              <p className="text-[11px] leading-none text-txt-muted truncate mt-1">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer text-txt-primary focus:bg-surface-hover focus:text-txt-primary gap-2"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5 text-txt-muted" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-txt-primary focus:bg-surface-hover focus:text-txt-primary gap-2"
              asChild
            >
              <Link href="/billing">
                <CreditCard className="h-3.5 w-3.5 text-txt-muted" />
                <span>Billing &amp; Plans</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem
            className="cursor-pointer gap-2 text-brand-rose-deep focus:bg-brand-rose-dim focus:text-brand-rose-deep"
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
