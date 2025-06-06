"use client";

import {
  Home,
  BarChart3,
  MessageSquare,
  DollarSign,
  LayoutDashboard,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Brain,
    isNew: true,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: BarChart3,
  },
  {
    title: "Chat History",
    url: "/chat-history",
    icon: MessageSquare,
  },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Finance AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          {items.map((item) => (
            <Button
              key={item.title}
              variant={pathname === item.url ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link
                href={item.url}
                className="flex items-center gap-2 relative"
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.title}</span>
                {item.isNew && (
                  <Badge
                    variant="secondary"
                    className="text-xs ml-1 hidden md:inline"
                  >
                    New
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
