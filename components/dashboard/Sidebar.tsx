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
    LayoutDashboard,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Slack Updates", href: "/slack", icon: MessageSquare },
    { name: "GitHub Activity", href: "/github", icon: Github },
    { name: "Email", href: "/email", icon: Mail },
    { name: "Add Integration", href: "/onboarding", icon: Plus },
];

export function Sidebar() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        <aside
            className={cn(
                "bg-sidebar border-r border-border flex flex-col h-full transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Workspace Header */}
            <div className={cn(
                "p-4 flex items-center border-b border-border",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && <h1 className="text-xl font-semibold tracking-tight">otto</h1>}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                    <ChevronLeft className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-300",
                        isCollapsed && "rotate-180"
                    )} />
                </button>
            </div>

            {/* Search */}
            <div className="p-3">
                <button className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 text-muted-foreground text-sm hover:bg-accent/80 transition-all",
                    isCollapsed && "justify-center px-0"
                )}>
                    <Search className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Search</span>}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.name : ""}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                isCollapsed ? "justify-center px-0" : "",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle & Back to Onboarding */}
            <div className="border-t border-border p-4 space-y-2">
                <button
                    onClick={toggleTheme}
                    title={isCollapsed ? (theme === "light" ? "Dark Mode" : "Light Mode") : ""}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground",
                        isCollapsed && "justify-center px-0"
                    )}
                >
                    {theme === "light" ? (
                        <>
                            <Moon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span>Dark Mode</span>}
                        </>
                    ) : (
                        <>
                            <Sun className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span>Light Mode</span>}
                        </>
                    )}
                </button>
                <Link
                    href="/onboarding"
                    title={isCollapsed ? "Back" : ""}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/50 hover:text-foreground",
                        isCollapsed && "justify-center px-0"
                    )}
                >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="text-red-500 font-semibold">Back</span>}
                </Link>
            </div>
        </aside>
    );
}
