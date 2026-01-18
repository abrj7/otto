'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft } from 'lucide-react'

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
        <div className="space-y-6 bg-card border border-border p-8 rounded-xl shadow-sm text-center">
            {/* Email Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                    <Mail className="w-10 h-10 text-white" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground">Check Your Email!</h2>

            {/* Subtitle */}
            <p className="text-muted-foreground">
                We&apos;ve sent a confirmation link to:
            </p>

            {/* Email Display */}
            <div className="bg-accent border border-border rounded-lg py-3 px-6">
                <span className="text-foreground font-medium">{email}</span>
            </div>

            {/* Next Steps */}
            <div className="bg-accent/50 border border-border rounded-lg p-4 text-left">
                <h3 className="text-foreground font-semibold mb-3">Next steps:</h3>
                <ol className="text-muted-foreground space-y-2">
                    <li>1. Open the email from Otto</li>
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
                className="w-full h-11 font-medium"
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
            {/* Minimalist Background */}
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
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Name field - only show for signup */}
                            {mode === 'signup' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground px-1">Full Name</label>
                                    <Input
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground px-1">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground px-1">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                    className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                                />
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

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={handleAuth}
                                disabled={loading || (mode === 'signup' && passwordErrors.length > 0 && password.length > 0)}
                                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
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
                                className="w-full h-11 border-border text-foreground hover:bg-accent hover:text-accent-foreground font-medium"
                            >
                                {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
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

                        {/* Continue as Guest Button */}
                        <Button
                            onClick={() => router.push('/dashboard')}
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
