"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MessageSquare, AtSign, Hash } from "lucide-react";

const mockSlackUpdates = [
    { id: 1, channel: "engineering", user: "Bernhard", content: "Hey, I flagged a missing login screen in the ScyAI Design group.", time: "2h ago", isMention: true },
    { id: 2, channel: "general", user: "Sarah", content: "Has anyone seen the new landing page draft? Looking for feedback.", time: "4h ago", isMention: false },
    { id: 3, channel: "design-sync", user: "Julian", content: "I pushed back on the QR code requirements. Let's discuss in the sync.", time: "5h ago", isMention: true },
];

export default function SlackPage() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl">
                <header className="mb-8">
                    <MessageSquare className="h-6 w-6 mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold text-foreground">Slack Updates</h1>
                    <p className="text-muted-foreground mt-1">Recent unread messages and mentions</p>
                </header>

                <div className="space-y-6">
                    {mockSlackUpdates.map((update) => (
                        <div key={update.id} className="flex gap-4 group cursor-pointer border-b border-border/50 pb-6 last:border-0">
                            <div className="flex-shrink-0 mt-1">
                                {update.isMention ? (
                                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
                                        <AtSign className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <Hash className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-foreground">{update.user} <span className="text-muted-foreground font-normal text-sm">in #{update.channel}</span></span>
                                    <span className="text-xs text-muted-foreground">{update.time}</span>
                                </div>
                                <p className="text-foreground/80 leading-relaxed">{update.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
