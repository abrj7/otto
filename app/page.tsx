'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft } from 'lucide-react'

// Pre-calculated wave paths to avoid hydration mismatch
const tealWavePaths = [
    "M0 0 Q25 500 0 1000",
    "M50 0 Q75 542 50 1000",
    "M100 0 Q125 591 100 1000",
    "M150 0 Q175 507 150 1000",
    "M200 0 Q225 421 200 1000",
    "M250 0 Q275 380 250 1000",
    "M300 0 Q325 410 300 1000",
    "M350 0 Q375 493 350 1000",
    "M400 0 Q425 579 400 1000",
    "M450 0 Q475 620 450 1000",
    "M500 0 Q525 591 500 1000",
    "M550 0 Q575 508 550 1000",
    "M600 0 Q625 420 600 1000",
    "M650 0 Q675 379 650 1000",
    "M700 0 Q725 409 700 1000",
    "M750 0 Q775 492 750 1000",
    "M800 0 Q825 578 800 1000",
    "M850 0 Q875 620 850 1000",
    "M900 0 Q925 591 900 1000",
    "M950 0 Q975 508 950 1000",
]

const orangeWavePaths = [
    "M800 0 Q815 800 800 1000",
    "M830 0 Q845 530 830 1000",
    "M860 0 Q875 669 860 1000",
    "M890 0 Q905 703 890 1000",
    "M920 0 Q935 617 920 1000",
    "M950 0 Q965 479 950 1000",
    "M980 0 Q995 348 980 1000",
    "M1010 0 Q1025 278 1010 1000",
    "M1040 0 Q1055 299 1040 1000",
    "M1070 0 Q1085 404 1070 1000",
    "M1100 0 Q1115 549 1100 1000",
    "M1130 0 Q1145 680 1130 1000",
    "M1160 0 Q1175 748 1160 1000",
    "M1190 0 Q1205 727 1190 1000",
    "M1220 0 Q1235 618 1220 1000",
    "M1250 0 Q1265 462 1250 1000",
    "M1280 0 Q1295 315 1280 1000",
    "M1310 0 Q1325 232 1310 1000",
    "M1340 0 Q1355 248 1340 1000",
    "M1370 0 Q1385 360 1370 1000",
]

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
        <div className="space-y-6 backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10 text-center">
            {/* Email Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                    <Mail className="w-10 h-10 text-white" />
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white">Check Your Email!</h2>

            {/* Subtitle */}
            <p className="text-[#9b9b9b]">
                We&apos;ve sent a confirmation link to:
            </p>

            {/* Email Display */}
            <div className="bg-[#2b2b2b] border border-[#3d3d3d] rounded-lg py-3 px-6">
                <span className="text-white font-medium">{email}</span>
            </div>

            {/* Next Steps */}
            <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-4 text-left">
                <h3 className="text-white font-semibold mb-3">Next steps:</h3>
                <ol className="text-[#9b9b9b] space-y-2">
                    <li>1. Open the email from Otto</li>
                    <li>2. Click the confirmation link</li>
                    <li>3. Come back and log in!</li>
                </ol>
            </div>

            {/* Spam Notice */}
            <p className="text-[#6b6b6b] text-sm">
                Didn&apos;t receive it? Check your spam folder.
            </p>

            {/* Back Button */}
            <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-11 bg-[#2b2b2b] border-[#3d3d3d] text-white hover:bg-[#3d3d3d] font-medium"
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
            <div className="min-h-screen relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-[#0a0a0a]">
                    <div className="absolute left-0 top-0 w-1/2 h-full opacity-60">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 via-teal-800/20 to-transparent"></div>
                    </div>
                    <div className="absolute right-0 top-0 w-1/2 h-full opacity-70">
                        <div className="absolute inset-0 bg-gradient-to-l from-orange-600/30 via-orange-700/20 to-transparent"></div>
                    </div>
                    <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 min-h-screen flex items-center justify-center">
                    <div className="w-full max-w-md p-8">
                        <CheckEmailScreen email={confirmedEmail} onBack={resetToLogin} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-[#0a0a0a]">
                {/* Left teal gradient waves */}
                <div className="absolute left-0 top-0 w-1/2 h-full opacity-60">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-900/40 via-teal-800/20 to-transparent"></div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#115e59" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#0d4f4f" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        {tealWavePaths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                stroke="url(#tealGrad)"
                                strokeWidth="2"
                                fill="none"
                                className="animate-wave"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Right orange gradient waves */}
                <div className="absolute right-0 top-0 w-1/2 h-full opacity-70">
                    <div className="absolute inset-0 bg-gradient-to-l from-orange-600/30 via-orange-700/20 to-transparent"></div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#c2410c" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                        {orangeWavePaths.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                stroke="url(#orangeGrad)"
                                strokeWidth="1.5"
                                fill="none"
                                className="animate-wave-slow"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            />
                        ))}
                    </svg>
                </div>

                {/* Glassy overlay */}
                <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-8">
                    {/* Logo */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-2">Otto</h1>
                        <p className="text-[#9b9b9b] text-lg">Your AI workflow assistant</p>
                    </div>

                    {/* Login Form */}
                    <div className="space-y-6 backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Name field - only show for signup */}
                            {mode === 'signup' && (
                                <Input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 bg-[#2b2b2b]/80 border-[#3d3d3d] text-white placeholder:text-[#6b6b6b] focus:border-[#5c5c5c] focus:ring-0"
                                />
                            )}
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-[#2b2b2b]/80 border-[#3d3d3d] text-white placeholder:text-[#6b6b6b] focus:border-[#5c5c5c] focus:ring-0"
                            />
                            <div>
                                <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                    className="h-12 bg-[#2b2b2b]/80 border-[#3d3d3d] text-white placeholder:text-[#6b6b6b] focus:border-[#5c5c5c] focus:ring-0"
                                />
                                {/* Password requirements - show for signup */}
                                {mode === 'signup' && password && passwordErrors.length > 0 && (
                                    <div className="mt-2 text-xs text-[#8a8a8a]">
                                        <span className="text-red-400">Missing: </span>
                                        {passwordErrors.join(', ')}
                                    </div>
                                )}
                                {mode === 'signup' && password && passwordErrors.length === 0 && (
                                    <div className="mt-2 text-xs text-green-400">
                                        ✓ Password meets all requirements
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleAuth}
                                disabled={loading || (mode === 'signup' && passwordErrors.length > 0 && password.length > 0)}
                                className="w-full h-11 bg-white text-[#191919] hover:bg-[#e0e0e0] font-medium disabled:opacity-50"
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
                                className="w-full h-11 bg-transparent border-[#3d3d3d] text-white hover:bg-[#2b2b2b] hover:text-white font-medium"
                            >
                                {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[#6b6b6b] text-sm mt-8">
                        By continuing, you agree to Otto&apos;s Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    )
}
