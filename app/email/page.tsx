"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Mail, Search, Star, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Email {
    id: string;
    from: string;
    email: string;
    subject: string;
    snippet: string;
    timeAgo: string;
    unread: boolean;
}

export default function EmailPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(true);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gmail');
            const data = await response.json();

            if (!response.ok) {
                if (data.connected === false) {
                    setConnected(false);
                }
                throw new Error(data.error || 'Failed to fetch emails');
            }

            setEmails(data.messages || []);
            setConnected(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Not connected state
    if (!connected && !isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl">
                    <header className="mb-8">
                        <Mail className="h-6 w-6 mb-4 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold text-foreground">Email</h1>
                    </header>

                    <Card className="border-border bg-accent/10 border-dashed">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">Connect Gmail</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                                Connect your Google account to see your emails.
                            </p>
                            <Link href="/onboarding">
                                <Button className="bg-primary text-primary-foreground">
                                    Connect Gmail
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

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

                {/* Error State */}
                {error && (
                    <Card className="border-destructive/50 bg-destructive/10 mb-6">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="text-destructive text-sm">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground uppercase tracking-widest">
                            Loading your emails...
                        </p>
                    </div>
                )}

                {/* Emails List */}
                {!isLoading && emails.length > 0 && (
                    <div className="divide-y divide-border/50">
                        {emails.map((email) => (
                            <div key={email.id} className="py-4 hover:bg-accent/10 transition-colors cursor-pointer group flex gap-4 pr-4">
                                <div className="flex-shrink-0 pt-1">
                                    <div className={`h-2 w-2 rounded-full ${email.unread ? 'bg-primary' : 'bg-transparent'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`font-medium text-foreground truncate ${email.unread ? 'font-semibold' : ''}`}>
                                            {email.from}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {email.timeAgo}
                                        </span>
                                    </div>
                                    <h3 className={`text-sm text-foreground mb-1 truncate ${email.unread ? 'font-semibold' : 'font-medium'}`}>
                                        {email.subject}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate">{email.snippet}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && emails.length === 0 && !error && (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No emails found</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Your inbox appears to be empty.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
