"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Github, GitPullRequest, GitMerge, GitCommit, CircleDot,
    Loader2, AlertCircle, Star, GitFork, ExternalLink, ChevronDown, Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Repo {
    id: number;
    name: string;
    fullName: string;
    description: string;
    private: boolean;
    updatedAt: string;
}

interface RepoInfo {
    name: string;
    description: string;
    stars: number;
    forks: number;
    openIssues: number;
    language: string;
    url: string;
}

interface Commit {
    id: string;
    title: string;
    author: string;
    timeAgo: string;
    sha: string;
    url: string;
}

interface PullRequest {
    id: number;
    title: string;
    author: string;
    state: string;
    merged: boolean;
    timeAgo: string;
    number: number;
    url: string;
}

interface Issue {
    id: number;
    title: string;
    author: string;
    state: string;
    timeAgo: string;
    number: number;
    url: string;
}

interface RepoData {
    repo: RepoInfo;
    commits: Commit[];
    pullRequests: PullRequest[];
    issues: Issue[];
}

export default function GithubPage() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [data, setData] = useState<RepoData | null>(null);
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(true);
    const [activeTab, setActiveTab] = useState<'commits' | 'prs' | 'issues'>('commits');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Fetch user's repos on mount
    useEffect(() => {
        fetchRepos();
    }, []);

    // Load saved repo selection
    useEffect(() => {
        const saved = localStorage.getItem('otto_github_repo');
        if (saved && repos.length > 0) {
            setSelectedRepo(saved);
            fetchRepoDetails(saved);
        }
    }, [repos]);

    const fetchRepos = async () => {
        setIsLoadingRepos(true);
        try {
            const response = await fetch('/api/github?action=repos');
            const result = await response.json();

            if (!response.ok) {
                if (result.connected === false) {
                    setConnected(false);
                }
                throw new Error(result.error || 'Failed to fetch repos');
            }

            setRepos(result.repos || []);
            setConnected(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const fetchRepoDetails = async (repoFullName: string) => {
        setIsLoadingDetails(true);
        setError(null);

        const [owner, repo] = repoFullName.split('/');

        try {
            const response = await fetch(`/api/github?action=details&owner=${owner}&repo=${repo}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch repo details');
            }

            setData(result);
            setSelectedRepo(repoFullName);
            localStorage.setItem('otto_github_repo', repoFullName);
        } catch (err: any) {
            setError(err.message);
            setData(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleSelectRepo = (repoFullName: string) => {
        setDropdownOpen(false);
        fetchRepoDetails(repoFullName);
    };

    // Not connected state
    if (!connected && !isLoadingRepos) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl">
                    <header className="mb-8">
                        <Github className="h-6 w-6 mb-4 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold text-foreground">GitHub Activity</h1>
                    </header>

                    <Card className="border-border bg-accent/10 border-dashed">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">Connect GitHub</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                                Connect your GitHub account to see your repositories and activity.
                            </p>
                            <Link href="/onboarding">
                                <Button className="bg-primary text-primary-foreground">
                                    Connect GitHub
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
            <div className="max-w-3xl">
                <header className="mb-8">
                    <Github className="h-6 w-6 mb-4 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold text-foreground">GitHub Activity</h1>
                    <p className="text-muted-foreground mt-1">
                        {selectedRepo ? `Tracking ${selectedRepo}` : 'Select a repository to track'}
                    </p>
                </header>

                {/* Repository Selector Dropdown */}
                <div className="mb-8 relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={isLoadingRepos}
                        className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-accent/30 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Github className="h-5 w-5 text-muted-foreground" />
                            {isLoadingRepos ? (
                                <span className="text-muted-foreground">Loading your repositories...</span>
                            ) : selectedRepo ? (
                                <span className="text-foreground font-medium">{selectedRepo}</span>
                            ) : (
                                <span className="text-muted-foreground">Select a repository</span>
                            )}
                        </div>
                        {isLoadingRepos ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && repos.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                            {repos.map((repo) => (
                                <button
                                    key={repo.id}
                                    onClick={() => handleSelectRepo(repo.fullName)}
                                    className={`w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left border-b border-border last:border-b-0 ${selectedRepo === repo.fullName ? 'bg-accent' : ''
                                        }`}
                                >
                                    {repo.private ? (
                                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <Github className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-foreground font-medium truncate">{repo.fullName}</p>
                                        {repo.description && (
                                            <p className="text-muted-foreground text-sm truncate">{repo.description}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <Card className="border-destructive/50 bg-destructive/10 mb-6">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="text-destructive text-sm">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Loading Details State */}
                {isLoadingDetails && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground uppercase tracking-widest">
                            Loading repository data...
                        </p>
                    </div>
                )}

                {/* Repository Data */}
                {data && !isLoadingDetails && (
                    <>
                        {/* Repo Stats */}
                        <Card className="mb-6 border-border bg-card">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">{data.repo.name}</h2>
                                        <p className="text-muted-foreground text-sm mt-1">{data.repo.description || 'No description'}</p>
                                    </div>
                                    <a
                                        href={data.repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </a>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Star className="h-4 w-4" />
                                        {data.repo.stars.toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <GitFork className="h-4 w-4" />
                                        {data.repo.forks.toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CircleDot className="h-4 w-4" />
                                        {data.repo.openIssues} open issues
                                    </span>
                                    {data.repo.language && (
                                        <span className="bg-accent px-2 py-0.5 rounded text-foreground">
                                            {data.repo.language}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 border-b border-border pb-2">
                            <button
                                onClick={() => setActiveTab('commits')}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'commits'
                                        ? 'bg-accent text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <GitCommit className="h-4 w-4 inline mr-2" />
                                Commits ({data.commits.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('prs')}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'prs'
                                        ? 'bg-accent text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <GitPullRequest className="h-4 w-4 inline mr-2" />
                                PRs ({data.pullRequests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('issues')}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'issues'
                                        ? 'bg-accent text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <CircleDot className="h-4 w-4 inline mr-2" />
                                Issues ({data.issues.length})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            {activeTab === 'commits' && data.commits.map((commit) => (
                                <a key={commit.id} href={commit.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <Card className="border-none shadow-sm bg-card hover:bg-accent/30 transition-all cursor-pointer group">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            <GitCommit className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-foreground text-sm font-medium truncate group-hover:underline underline-offset-4">
                                                    {commit.title}
                                                </p>
                                                <p className="text-muted-foreground text-xs mt-1">
                                                    <code className="bg-accent px-1 rounded">{commit.sha}</code>
                                                    {' '}by {commit.author} • {commit.timeAgo}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            ))}

                            {activeTab === 'prs' && data.pullRequests.map((pr) => (
                                <a key={pr.id} href={pr.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <Card className="border-none shadow-sm bg-card hover:bg-accent/30 transition-all cursor-pointer group">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            {pr.merged ? (
                                                <GitMerge className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <GitPullRequest className={`h-4 w-4 mt-0.5 flex-shrink-0 ${pr.state === 'open' ? 'text-green-500' : 'text-red-500'}`} />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-foreground text-sm font-medium truncate group-hover:underline underline-offset-4">
                                                    #{pr.number} {pr.title}
                                                </p>
                                                <p className="text-muted-foreground text-xs mt-1">
                                                    {pr.merged ? 'Merged' : pr.state} by {pr.author} • {pr.timeAgo}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            ))}

                            {activeTab === 'issues' && data.issues.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">No issues found</div>
                            )}

                            {activeTab === 'issues' && data.issues.map((issue) => (
                                <a key={issue.id} href={issue.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <Card className="border-none shadow-sm bg-card hover:bg-accent/30 transition-all cursor-pointer group">
                                        <CardContent className="p-4 flex items-start gap-3">
                                            <CircleDot className={`h-4 w-4 mt-0.5 flex-shrink-0 ${issue.state === 'open' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-foreground text-sm font-medium truncate group-hover:underline underline-offset-4">
                                                    #{issue.number} {issue.title}
                                                </p>
                                                <p className="text-muted-foreground text-xs mt-1">
                                                    {issue.state} by {issue.author} • {issue.timeAgo}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            ))}
                        </div>
                    </>
                )}

                {/* Empty State - No repo selected */}
                {!selectedRepo && !isLoadingRepos && !isLoadingDetails && repos.length > 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                        <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Select a repository</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Choose one of your repositories above to see its commits, pull requests, and issues.
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
