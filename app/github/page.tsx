"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Github, GitPullRequest, GitMerge, CircleDot } from "lucide-react";

const mockGithubEvents = [
    { id: 1, type: "pr", repo: "otto-ai/dashboard", title: "Implement dark mode toggle", status: "open", time: "1h ago" },
    { id: 2, type: "merge", repo: "otto-ai/dashboard", title: "Add sidebar navigation", status: "merged", time: "3h ago" },
    { id: 3, type: "issue", repo: "otto-ai/backend", title: "Fix API authentication flow", status: "closed", time: "5h ago" },
];

export default function GithubPage() {
    return (
        <DashboardLayout>
            <div className="max-w-2xl">
                <header className="mb-8">
                    <Github className="h-6 w-6 mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold text-foreground">GitHub Activity</h1>
                    <p className="text-muted-foreground mt-1">Recent updates from your repositories</p>
                </header>

                <div className="space-y-4">
                    {mockGithubEvents.map((event) => (
                        <div key={event.id} className="flex flex-col gap-1 p-4 rounded-lg border border-border/50 hover:bg-accent/10 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 mb-1">
                                {event.type === "pr" && <GitPullRequest className="h-4 w-4 text-green-500" />}
                                {event.type === "merge" && <GitMerge className="h-4 w-4 text-purple-500" />}
                                {event.type === "issue" && <CircleDot className="h-4 w-4 text-red-500" />}
                                <span className="text-xs font-mono text-muted-foreground">{event.repo}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{event.time}</span>
                            </div>
                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${event.status === "open" ? "bg-green-500/10 text-green-500" :
                                    event.status === "merged" ? "bg-purple-500/10 text-purple-500" :
                                        "bg-muted text-muted-foreground"
                                    }`}>
                                    {event.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
