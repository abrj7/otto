'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, Menu, Sparkles, Shield, Github, Eye, EyeOff } from 'lucide-react'

// Password validation function
function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
        errors.push('At least 8 characters')
    }
    if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character (!@#$%^&*)')
    }

    return { valid: errors.length === 0, errors }
}

// Check Your Email Screen Component
function CheckEmailScreen({ email, onBack }: { email: string; onBack: () => void }) {
    return (
        <div className="space-y-6 bg-card p-8 rounded-2xl shadow-xl text-center animate-fade-in-up">
            {/* Email Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                    <Mail className="w-10 h-10 text-white" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-[family-name:var(--font-serif)] font-medium text-foreground">Check Your Email!</h2>

            {/* Subtitle */}
            <p className="text-muted-foreground">
                We&apos;ve sent a confirmation link to:
            </p>

            {/* Email Display */}
            <div className="bg-accent rounded-lg py-3 px-6">
                <span className="text-foreground font-medium">{email}</span>
            </div>

            {/* Next Steps */}
            <div className="bg-accent/50 rounded-lg p-4 text-left">
                <h3 className="text-foreground font-semibold mb-3">Next steps:</h3>
                <ol className="text-muted-foreground space-y-2">
                    <li>1. Open the email from otto</li>
                    <li>2. Click the confirmation link</li>
                    <li>3. Come back and log in!</li>
                </ol>
            </div>

            {/* Spam Notice */}
            <p className="text-muted-foreground text-sm">
                Didn&apos;t receive it? Check your spam folder.
            </p>

            {/* Back Button */}
            <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-11 font-medium rounded-full hover:scale-[1.02] transition-transform"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
            </Button>
        </div>
    )
}

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [passwordErrors, setPasswordErrors] = useState<string[]>([])
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
    const [confirmedEmail, setConfirmedEmail] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Please enter email and password')
            return
        }

        if (mode === 'signup') {
            if (!name.trim()) {
                setError('Please enter your name')
                return
            }

            // Validate password for signup
            const validation = validatePassword(password)
            if (!validation.valid) {
                setPasswordErrors(validation.errors)
                setError('Password does not meet requirements')
                return
            }
        }

        setLoading(true)
        setError(null)
        setPasswordErrors([])

        try {
            if (mode === 'signup') {
                // Sign up with user metadata (name)
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name.trim(),
                        },
                        emailRedirectTo: `${window.location.origin}/onboarding`,
                    }
                })

                if (error) throw error

                // Check if email confirmation is required
                if (data.user && !data.session) {
                    // Email confirmation required - show the confirmation screen
                    setConfirmedEmail(email)
                    setShowEmailConfirmation(true)
                } else if (data.session) {
                    // No email confirmation required - go directly to onboarding
                    router.push('/onboarding')
                }
            } else {
                // Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) {
                    // Handle specific error messages
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error('Invalid email or password. Please try again.')
                    }
                    if (error.message.includes('Email not confirmed')) {
                        throw new Error('Please confirm your email before logging in. Check your inbox.')
                    }
                    throw error
                }

                router.push('/onboarding')
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    // Live password validation for signup
    const handlePasswordChange = (value: string) => {
        setPassword(value)
        if (mode === 'signup' && value) {
            const validation = validatePassword(value)
            setPasswordErrors(validation.errors)
        } else {
            setPasswordErrors([])
        }
    }

    const resetToLogin = () => {
        setShowEmailConfirmation(false)
        setMode('login')
        setPassword('')
        setName('')
        setError(null)
    }

    // Show email confirmation screen after successful signup
    if (showEmailConfirmation) {
        return (
            <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
                <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <CheckEmailScreen email={confirmedEmail} onBack={resetToLogin} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-background text-foreground transition-colors duration-200">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
                <span className="text-xl font-[family-name:var(--font-brand)] font-medium tracking-tight">otto</span>
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <Menu className="w-5 h-5" />
                </button>
            </header>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-32">
                {/* Headline */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] font-medium tracking-tight text-foreground leading-tight">
                        Rewrite your
                    </h1>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] italic font-medium tracking-tight text-foreground leading-tight">
                        workflow.
                    </h1>
                    <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-md mx-auto">
                        Your AI workflow assistant, reimagined for clarity.
                    </p>
                </div>

                {/* Login Form Card */}
                <div className="w-full max-w-sm animate-fade-in-up animation-delay-200">
                    <div className="space-y-5 bg-card p-7 rounded-xl shadow-2xl shadow-black/10 border border-border/50">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Name field - only show for signup */}
                            {mode === 'signup' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Full Name</label>
                                    <Input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11 bg-background/50 border-0 text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring rounded-md"
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5 animate-fade-in-up animation-delay-100">
                                <label className="text-sm font-medium text-foreground">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 bg-background/50 border-0 text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring rounded-md"
                                />
                            </div>
                            <div className="space-y-1.5 animate-fade-in-up animation-delay-200">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                        className="h-11 bg-background/50 border-0 text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-ring rounded-md pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {/* Password requirements - show for signup */}
                                {mode === 'signup' && password && passwordErrors.length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        <span className="text-destructive">Missing: </span>
                                        {passwordErrors.join(', ')}
                                    </div>
                                )}
                                {mode === 'signup' && password && passwordErrors.length === 0 && (
                                    <div className="mt-2 text-xs text-green-500">
                                        ✓ Password meets all requirements
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-1 animate-fade-in-up animation-delay-300">
                            <Button
                                onClick={handleAuth}
                                disabled={loading || (mode === 'signup' && passwordErrors.length > 0 && password.length > 0)}
                                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login')
                                    setPasswordErrors([])
                                    setError(null)
                                }}
                                variant="outline"
                                disabled={loading}
                                className="w-full h-11 border-border text-foreground hover:bg-accent font-medium rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
                            </Button>
                        </div>

                        <div className="relative animate-fade-in-up animation-delay-400">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-4 bg-card text-muted-foreground">or</span>
                            </div>
                        </div>

                        {/* Continue as Guest Button */}
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full text-center text-muted-foreground hover:text-foreground text-sm font-medium transition-colors group animate-fade-in-up animation-delay-500"
                        >
                            Continue as Guest <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-0 left-0 right-0 z-20 py-6 animate-fade-in animation-delay-400">
                <div className="flex items-center justify-center gap-8 md:gap-12">
                    <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        <Sparkles className="w-5 h-5" />
                        <div className="text-xs uppercase tracking-wider">
                            <div className="font-semibold">AI Powered</div>
                            <div className="opacity-70">Gemini</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        <Shield className="w-5 h-5" />
                        <div className="text-xs uppercase tracking-wider">
                            <div className="font-semibold">Privacy First</div>
                            <div className="opacity-70">Secure</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        <Github className="w-5 h-5" />
                        <div className="text-xs uppercase tracking-wider">
                            <div className="font-semibold">Open Source</div>
                            <div className="opacity-70">MIT</div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Footer Terms */}
            <p className="absolute bottom-20 left-0 right-0 text-center text-muted-foreground/50 text-xs px-4 z-20">
                By continuing, you agree to otto&apos;s <span className="underline cursor-pointer hover:text-muted-foreground transition-colors">Terms of Service</span> and <span className="underline cursor-pointer hover:text-muted-foreground transition-colors">Privacy Policy</span>
            </p>
        </div>
    )
}
