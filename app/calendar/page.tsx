"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    description: string;
    start: string;
}

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch('/api/calendar');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch events');
                }

                setEvents(data.events || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchEvents();
    }, []);

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <DashboardLayout>
            <div className="max-w-2xl">
                <header className="mb-8">
                    <CalendarIcon className="h-6 w-6 mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
                    <p className="text-muted-foreground mt-1">{currentDate}</p>
                </header>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p className="text-sm font-medium uppercase tracking-widest">Fetching your schedule...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-border bg-accent/10 border-dashed">
                            <CardContent className="p-8 flex flex-col items-center text-center">
                                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Connection Required</h3>
                                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                                    {error.includes('No Google token found')
                                        ? "Otto needs access to your Google Calendar to pull your real events."
                                        : error}
                                </p>
                                <Link href="/onboarding">
                                    <Button className="bg-primary text-primary-foreground">
                                        Link Google Account
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                            <p className="text-muted-foreground">No upcoming events found for today.</p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <Card key={event.id} className="border-none shadow-sm bg-card hover:bg-accent/30 transition-all cursor-pointer group">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-semibold text-foreground group-hover:underline underline-offset-4 decoration-border truncate">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap bg-accent/50 px-3 py-1.5 rounded-lg">
                                        <Clock className="h-3.5 w-3.5" />
                                        {event.time}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
