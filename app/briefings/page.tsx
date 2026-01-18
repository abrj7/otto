"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RefreshCcw, Sun } from "lucide-react";
import { useState } from "react";

const mockBriefing = {
    greeting: "Good afternoon, hours.",
    sections: [
        {
            type: "calendar",
            content: "You have a meeting coming up in about 3.5 hours - ScyAI x UI/UX Sync at 7pm with Bernhard. Before that call, you should know that Bernhard flagged a missing login screen in the ScyAI Design group. They're implementing one-time passwords for first login, but users need to change their password immediately after. He's looking for that additional screen to be designed."
        },
        {
            type: "whatsapp", // The user's image shows WhatsApp, but they mentioned Slack. I'll stick to the spirit.
            content: "Also in your WhatsApp groups (integrated via Slack), someone from the Visualizations/Branding Co is asking about QR codes and whether you prefer communication through that chat or Roam. Julian pushed back hard on QR codes, but the original question about your preferred communication method is still hanging."
        },
        {
            type: "team",
            content: "Your SuperWhisper team has been busy - they've got a new landing page ready for feedback. The conversation shows they've been iterating on animations and user experience, with some good discussion about making the demo less interactive during autoplay."
        },
        {
            type: "priority",
            content: "I'd prioritize prepping for the ScyAI meeting by reviewing that missing login screen requirement. The day looks manageable with just the one evening meeting."
        }
    ],
    lastUpdated: "3:33 pm"
};

export default function BriefingsPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-prose">
                <header className="mb-12">
                    <Sun className="h-5 w-5 mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-medium text-foreground">{mockBriefing.greeting}</h2>
                </header>

                <div className="space-y-8 text-foreground/90 leading-relaxed">
                    {mockBriefing.sections.map((section, idx) => (
                        <p key={idx}>{section.content}</p>
                    ))}
                </div>

                <footer className="mt-20 flex flex-col items-center gap-4 text-xs text-muted-foreground">
                    <p>Last updated: {mockBriefing.lastUpdated}</p>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                        <RefreshCcw className={isRefreshing ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
                        Refresh
                    </button>
                </footer>
            </div>
        </DashboardLayout>
    );
}
