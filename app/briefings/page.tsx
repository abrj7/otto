"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RefreshCcw, Sun, Loader2, AlertCircle, Mail, Calendar, GitBranch } from "lucide-react";
import { useState, useEffect } from "react";

export default function BriefingsPage() {
    const [briefing, setBriefing] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBriefing = async () => {
        try {
            const response = await fetch('/api/briefing');
            if (!response.ok) {
                throw new Error('Failed to fetch briefing');
            }
            const data = await response.json();
            setBriefing(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBriefing();
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchBriefing();
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">
                        Loading your briefing...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl">
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-destructive text-sm">{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                {/* Header */}
                <header className="mb-12">
                    <Sun className="h-5 w-5 mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-medium text-foreground">{greeting}, hours.</h2>
                </header>

                {/* Summary */}
                <div className="mb-12 text-foreground/90 leading-relaxed">
                    {briefing?.summary && (
                        <p className="whitespace-pre-wrap text-base">{briefing.summary}</p>
                    )}
                </div>

                {/* Stats */}
                {briefing?.stats && (
                    <div className="mb-12 grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-semibold text-foreground">
                                {briefing.stats.unreadEmails}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                Unread Emails
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-semibold text-foreground">
                                {briefing.stats.todayMeetings}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                Today's Meetings
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-semibold text-foreground">
                                {briefing.stats.activeRepos}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                Active Repos
                            </div>
                        </div>
                    </div>
                )}

                {/* Detailed Sections */}
                {briefing?.sections?.map((section: any, idx: number) => (
                    <div key={idx} className="mb-10">
                        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                            {section.title.includes('Email') && <Mail className="h-4 w-4" />}
                            {section.title.includes('Meeting') && <Calendar className="h-4 w-4" />}
                            {section.title.includes('GitHub') && <GitBranch className="h-4 w-4" />}
                            {section.title}
                        </h3>

                        <div className="space-y-4">
                            {section.items?.map((item: any, itemIdx: number) => (
                                <div key={itemIdx} className="border-l-2 border-border pl-4 py-2">
                                    {/* Email Item */}
                                    {item.from && (
                                        <div>
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="font-medium text-foreground text-sm">
                                                    {item.subject}
                                                    {item.unread && (
                                                        <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full"></span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-1">From: {item.from}</div>
                                            <p className="text-sm text-foreground/70 line-clamp-2">{item.body || item.snippet}</p>
                                        </div>
                                    )}

                                    {/* Meeting Item */}
                                    {item.time && !item.from && (
                                        <div>
                                            <div className="font-medium text-foreground text-sm mb-1">{item.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.time}
                                                {item.location && ` • ${item.location}`}
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{item.description}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* GitHub Commit */}
                                    {item.type === 'commit' && (
                                        <div>
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="font-mono text-xs text-foreground">{item.message}</div>
                                                <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">by {item.author}</div>
                                        </div>
                                    )}

                                    {/* GitHub PR */}
                                    {item.type === 'pull_request' && (
                                        <div>
                                            <div className="font-medium text-foreground text-sm mb-1">{item.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                by {item.author} • {item.state}
                                            </div>
                                        </div>
                                    )}

                                    {/* GitHub Repo */}
                                    {item.name && !item.from && !item.time && !item.type && (
                                        <div>
                                            <div className="font-medium text-foreground text-sm mb-1">{item.name}</div>
                                            <div className="text-xs text-muted-foreground mb-1">Updated: {item.updatedAt}</div>
                                            {item.description && (
                                                <p className="text-sm text-foreground/70">{item.description}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Footer */}
                <footer className="mt-20 flex flex-col items-center gap-4 text-xs text-muted-foreground border-t border-border pt-8">
                    <p>Last updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw className={isRefreshing ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
                        Refresh
                    </button>
                </footer>
            </div>
        </DashboardLayout>
    );
}
