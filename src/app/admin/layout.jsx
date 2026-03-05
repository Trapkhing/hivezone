"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    DashboardCircleIcon,
    AlertIcon,
    ArrowLeft01Icon,
    Menu01Icon,
    Cancel01Icon,
    UserCircleIcon,
    Logout01Icon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth/signin");
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('display_name, is_admin')
                .eq('id', session.user.id)
                .single();

            if (!profile?.is_admin) {
                router.push("/dashboard");
                return;
            }

            setUser({ ...session.user, display_name: profile.display_name });
            setIsAdmin(true);
            setIsLoading(false);
        };
        checkUser();
    }, [router, supabase]);

    const navItems = [
        { label: "Overview", href: "/admin", icon: DashboardCircleIcon },
        { label: "Reports", href: "/admin/reports", icon: AlertIcon },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="w-10 h-10 border-4 border-[#ffc107]/30 border-t-[#ffc107] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="flex h-screen bg-gray-50 text-zinc-900 font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transition-transform duration-300
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#ffc107] rounded-lg"></div>
                            <span className="text-xl font-black font-newyork tracking-tight">HiveAdmin</span>
                        </Link>
                        <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                            <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-8 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all
                                    ${pathname === item.href
                                        ? "bg-black text-white shadow-lg"
                                        : "hover:bg-gray-100 text-zinc-500 hover:text-black"}
                                `}
                            >
                                <HugeiconsIcon icon={item.icon} className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-gray-100">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-zinc-500 hover:text-black hover:bg-gray-100 transition-all mb-2"
                        >
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
                            <span>Dashboard</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all"
                        >
                            <HugeiconsIcon icon={Logout01Icon} className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <HugeiconsIcon icon={Menu01Icon} className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-black font-newyork">
                            {navItems.find(i => i.href === pathname)?.label || "Admin"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black">{user?.display_name || user?.email?.split('@')[0] || "Admin"}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Administrator</span>
                        </div>
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <HugeiconsIcon icon={UserCircleIcon} className="w-6 h-6 text-zinc-400" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
