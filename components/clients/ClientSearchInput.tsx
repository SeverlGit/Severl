"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  search: string;
  filter: string;
  placeholder: string;
};

export function ClientSearchInput({ search, filter, placeholder }: Props) {
  const [value, setValue] = useState(search);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (filter && filter !== "all") params.set("filter", filter);
      if (value) params.set("search", value);
      const qs = params.toString();
      router.push(`/clients${qs ? `?${qs}` : ""}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(255,255,255,0.25)]" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-56 pl-8 font-sans text-[13px]"
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted transition-colors hover:text-txt-primary"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
