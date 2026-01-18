'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, ChevronDown } from 'lucide-react'

interface UserData {
    email: string
    name: string
}

export function UserMenu() {
    const router = useRouter()
    const supabase = createClient()
    const [user, setUser] = useState<UserData | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser({
                    email: user.email || '',
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                })
            }
        }
        getUser()
    }, [supabase])

    const handleLogout = async () => {
        setLoading(true)
        try {
            await supabase.auth.signOut()
            router.push('/')
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="w-8 h-8 rounded-full bg-[#3d3d3d] animate-pulse" />
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2b2b2b] transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-foreground text-sm font-medium max-w-[120px] truncate">
                    {user.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#8a8a8a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl z-50 overflow-hidden">
                        {/* User Info */}
                        <div className="p-3 border-b border-[#3d3d3d]">
                            <p className="text-white text-sm font-medium truncate">{user.name}</p>
                            <p className="text-[#8a8a8a] text-xs truncate">{user.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-1">
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-[#2b2b2b] rounded-md text-sm transition-colors disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{loading ? 'Logging out...' : 'Log out'}</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
