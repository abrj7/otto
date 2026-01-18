'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Github, Calendar, MessageSquare, Video, FileText, Bell, Briefcase } from 'lucide-react'

interface SummaryBlockProps {
    content: string
    title?: string
}

interface ParsedSection {
    category: string
    icon: React.ReactNode
    items: string[]
    color: string
}

function parseSummaryContent(content: string): ParsedSection[] {
    const sections: ParsedSection[] = []

    // Define category patterns and their configs
    const categoryConfigs: Record<string, { icon: React.ReactNode; color: string; keywords: string[] }> = {
        'Email': {
            icon: <Mail className="w-4 h-4" />,
            color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
            keywords: ['email', 'gmail', 'inbox', 'message from', 'mail', 'unread']
        },
        'GitHub': {
            icon: <Github className="w-4 h-4" />,
            color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
            keywords: ['github', 'commit', 'pull request', 'pr', 'merge', 'repository', 'repo', 'branch', 'push', 'issue']
        },
        'Calendar': {
            icon: <Calendar className="w-4 h-4" />,
            color: 'from-green-500/20 to-green-600/10 border-green-500/30',
            keywords: ['calendar', 'meeting', 'event', 'schedule', 'appointment', 'call at', 'today at', 'tomorrow at']
        },
        'Slack': {
            icon: <MessageSquare className="w-4 h-4" />,
            color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
            keywords: ['slack', 'channel', 'dm', 'direct message', 'thread', 'mentioned']
        },
        'Zoom': {
            icon: <Video className="w-4 h-4" />,
            color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
            keywords: ['zoom', 'video call', 'webinar', 'meeting link']
        },
        'Tasks': {
            icon: <FileText className="w-4 h-4" />,
            color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
            keywords: ['task', 'todo', 'to-do', 'action item', 'deadline', 'due']
        },
        'Notifications': {
            icon: <Bell className="w-4 h-4" />,
            color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
            keywords: ['notification', 'alert', 'reminder', 'update']
        },
    }

    // Split content into sentences
    const sentences = content
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

    // Categorize each sentence
    const categorizedItems: Record<string, string[]> = {}
    const uncategorized: string[] = []

    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase()
        let matched = false

        for (const [category, config] of Object.entries(categoryConfigs)) {
            if (config.keywords.some(kw => lowerSentence.includes(kw))) {
                if (!categorizedItems[category]) {
                    categorizedItems[category] = []
                }
                categorizedItems[category].push(sentence)
                matched = true
                break
            }
        }

        if (!matched) {
            uncategorized.push(sentence)
        }
    }

    // Build sections array
    for (const [category, items] of Object.entries(categorizedItems)) {
        const config = categoryConfigs[category]
        sections.push({
            category,
            icon: config.icon,
            items,
            color: config.color
        })
    }

    // Add uncategorized as "Overview" if there are items
    if (uncategorized.length > 0) {
        sections.unshift({
            category: 'Overview',
            icon: <Briefcase className="w-4 h-4" />,
            items: uncategorized,
            color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30'
        })
    }

    return sections
}

export function SummaryBlock({ content, title = 'Summary' }: SummaryBlockProps) {
    const sections = parseSummaryContent(content)

    // If no sections were parsed, show the original content
    if (sections.length === 0) {
        return (
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground leading-relaxed">{content}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section, index) => (
                    <Card
                        key={index}
                        className={`bg-gradient-to-br ${section.color} border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-background/50">
                                    {section.icon}
                                </div>
                                <CardTitle className="text-sm font-semibold text-foreground">
                                    {section.category}
                                </CardTitle>
                                <span className="ml-auto text-xs text-muted-foreground bg-background/30 px-2 py-0.5 rounded-full">
                                    {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ul className="space-y-2">
                                {section.items.map((item, itemIndex) => (
                                    <li
                                        key={itemIndex}
                                        className="text-sm text-foreground/90 leading-relaxed flex items-start gap-2"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0 opacity-50" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
