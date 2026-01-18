'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
    const router = useRouter()

    const handleAuth = () => {
        router.push('/onboarding')
    }

    const handleDashboard = () => {
        router.push('/dashboard')
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-background text-foreground transition-colors duration-200">
            {/* Minimalist Background (Solid) */}
            <div className="absolute inset-0 z-0"></div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2">Otto</h1>
                        <p className="text-muted-foreground text-lg">Your AI workflow assistant</p>
                    </div>

                    {/* Login Form */}
                    <div className="space-y-6 bg-card border border-border p-8 rounded-xl shadow-sm">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground px-1">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground px-1">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={handleAuth}
                                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                            >
                                Log in
                            </Button>
                            <Button
                                onClick={handleAuth}
                                variant="outline"
                                className="w-full h-11 border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium"
                            >
                                Create an account
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-card text-muted-foreground">or</span>
                            </div>
                        </div>

                        {/* Skip to Dashboard Button */}
                        <Button
                            onClick={handleDashboard}
                            variant="ghost"
                            className="w-full h-11 text-muted-foreground hover:text-foreground font-medium"
                        >
                            Continue as Guest →
                        </Button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-muted-foreground text-xs mt-8 px-4 leading-relaxed">
                        By continuing, you agree to Otto&apos;s <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
