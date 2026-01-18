"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Mail, Search, Star } from "lucide-react";

const mockEmails = [
    { id: 1, from: "Bernhard", subject: "ScyAI Project: Missing login screen", preview: "Hi, I've noticed we're missing the login screen in the current design...", time: "9:24 AM", isStarred: true },
    { id: 2, from: "Support", subject: "Your subscription renewal", preview: "Your subscription for Otto Premium will renew on Feb 1...", time: "8:15 AM", isStarred: false },
    { id: 3, from: "Newsletter", subject: "Weekly Design Digest", preview: "This week we explore the return of skeuomorphism in minimalist interfaces...", time: "7:00 AM", isStarred: false },
];

export default function EmailPage() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl">
                <header className="mb-8">
                    <Mail className="h-6 w-6 mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold text-foreground">Email</h1>

                    <div className="mt-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            className="w-full bg-accent/20 border-border/50 border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        />
                    </div>
                </header>

                <div className="divide-y divide-border/50">
                    {mockEmails.map((email) => (
                        <div key={email.id} className="py-4 hover:bg-accent/10 transition-colors cursor-pointer group flex gap-4 pr-4">
                            <div className="flex-shrink-0 pt-1">
                                <Star className={`h-4 w-4 ${email.isStarred ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-medium text-foreground truncate">{email.from}</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{email.time}</span>
                                </div>
                                <h3 className="text-sm font-medium text-foreground mb-1 truncate">{email.subject}</h3>
                                <p className="text-sm text-muted-foreground truncate">{email.preview}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
