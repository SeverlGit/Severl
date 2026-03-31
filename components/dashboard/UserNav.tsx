"use client";

import * as React from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { CreditCard, LogOut, Settings } from "lucide-react";

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

export function UserNav() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  if (!user) return null;

  const fName = user.firstName || "";
  const lName = user.lastName || "";
  const initials = (fName && lName)
    ? `${fName[0]}${lName[0]}`
    : fName
      ? fName[0]
      : "U";

  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-7 w-7 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-rose/40 cursor-pointer overflow-hidden ring-1 ring-border shadow-sm">
          <Avatar className="h-full w-full">
            <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
            <AvatarFallback className="bg-surface-hover text-[10px] font-medium text-txt-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className="w-56 bg-panel border-border"
        align="start"
        side="right"
        sideOffset={14}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-txt-primary">
              {user.fullName}
            </p>
            <p className="text-xs leading-none text-txt-muted truncate mt-0.5">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer text-txt-primary focus:bg-surface-hover focus:text-txt-primary"
            onClick={() => openUserProfile()}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-txt-primary focus:bg-surface-hover focus:text-txt-primary" asChild>
            <Link href="/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing & Plans</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-border" />
        
        <DropdownMenuItem 
          className="cursor-pointer text-brand-rose-deep focus:bg-brand-rose-dim focus:text-brand-rose-deep"
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
