'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

export default function LoginPage() {
    const router = useRouter()

    const handleAuth = () => {
        router.push('/onboarding')
    }

    const handleDashboard = () => {
        router.push('/dashboard')
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
                        <div className="space-y-4">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="h-12 bg-[#2b2b2b]/80 border-[#3d3d3d] text-white placeholder:text-[#6b6b6b] focus:border-[#5c5c5c] focus:ring-0"
                            />
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                className="h-12 bg-[#2b2b2b]/80 border-[#3d3d3d] text-white placeholder:text-[#6b6b6b] focus:border-[#5c5c5c] focus:ring-0"
                            />
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleAuth}
                                className="w-full h-11 bg-white text-[#191919] hover:bg-[#e0e0e0] font-medium"
                            >
                                Log in
                            </Button>
                            <Button
                                onClick={handleAuth}
                                variant="outline"
                                className="w-full h-11 bg-transparent border-[#3d3d3d] text-white hover:bg-[#2b2b2b] hover:text-white font-medium"
                            >
                                Sign up
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#3d3d3d]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-transparent text-[#6b6b6b]">or</span>
                            </div>
                        </div>

                        {/* Skip to Dashboard Button */}
                        <Button
                            onClick={handleDashboard}
                            variant="outline"
                            className="w-full h-11 bg-gradient-to-r from-teal-600/20 to-orange-600/20 border-[#3d3d3d] text-white hover:from-teal-600/30 hover:to-orange-600/30 hover:text-white font-medium"
                        >
                            Skip to Dashboard →
                        </Button>
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
