"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FileText,
    Calendar,
    MessageSquare,
    Github,
    Mail,
    Sun,
    Moon,
    Search,
    ChevronLeft,
    Settings,
    FileText as LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
    { name: "My Briefings", href: "/briefings", icon: FileText },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Slack Updates", href: "/slack", icon: MessageSquare },
    { name: "GitHub Activity", href: "/github", icon: Github },
    { name: "Email", href: "/email", icon: Mail },
    { name: "Add Integration", href: "/onboarding", icon: LayoutDashboard },
];

export function Sidebar() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else {
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    return (
        <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-full transition-colors duration-200">
            {/* Workspace Header */}
            <div className="p-4 flex items-center justify-between border-b border-border">
                <h1 className="text-xl font-semibold tracking-tight">Otto</h1>
                <ChevronLeft className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </div>

            {/* Search */}
            <div className="p-3">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 text-muted-foreground text-sm hover:bg-accent/80 transition-all">
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname === "/dashboard" && item.href === "/briefings");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle & Settings */}
            <div className="border-t border-border p-4 space-y-2">
                <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground"
                >
                    {theme === "light" ? (
                        <>
                            <Moon className="h-4 w-4" />
                            <span>Dark Mode</span>
                        </>
                    ) : (
                        <>
                            <Sun className="h-4 w-4" />
                            <span>Light Mode</span>
                        </>
                    )}
                </button>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    );
}
