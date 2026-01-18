"use client";

import { Sidebar } from "./Sidebar";
import { VoiceAgent } from "../voice/VoiceAgent";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-background text-foreground transition-colors duration-200 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-4xl px-8 py-12">
                    {children}
                </div>
            </main>
            <aside className="w-[400px] border-l border-border hidden lg:block">
                <VoiceAgent />
            </aside>
        </div>
    );
}
