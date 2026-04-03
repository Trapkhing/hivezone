"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    UserGroupIcon,
    InformationCircleIcon,
    LockIcon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";
import { useStudyCircles } from "@/components/dashboard/StudyCirclesContext";

export default function JoinCirclePage() {
    const { id: circleId } = useParams();
    const router = useRouter();
    const { showToast } = useUI();
    const supabase = createClient();
    const { fetchMyCircles, fetchDiscoverCircles } = useStudyCircles();

    const [loading, setLoading] = useState(true);
    const [circle, setCircle] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }
            setProfile(session.user);

            // Fetch circle details
            const { data: circleData, error } = await supabase
                .from("study_circles")
                .select("*")
                .eq("id", circleId)
                .single();

            if (error || !circleData) {
                showToast("Circle not found", "error");
                router.push("/dashboard/study-circles");
                return;
            }

            // Check if already a member
            const { data: membership } = await supabase
                .from("study_circle_members")
                .select("*")
                .eq("circle_id", circleId)
                .eq("user_id", session.user.id)
                .single();

            if (membership) {
                router.push(`/dashboard/study-circles/${circleId}`);
                return;
            }

            // Fetch member count
            const { count } = await supabase
                .from("study_circle_members")
                .select("*", { count: 'exact', head: true })
                .eq("circle_id", circleId);

            setCircle({ ...circleData, member_count: count || 0 });
            setLoading(false);
        };

        fetchData();
    }, [circleId, router, supabase]);

    const handleJoin = async () => {
        if (!profile || !circle) return;

        setIsJoining(true);
        const { error } = await supabase
            .from("study_circle_members")
            .insert({
                circle_id: circleId,
                user_id: profile.id
            });

        if (!error) {
            showToast(`Joined ${circle.name}!`, "success");
            if (profile?.id) {
                fetchMyCircles(profile.id);
                fetchDiscoverCircles(profile.id);
            }
            router.push(`/dashboard/study-circles/${circleId}`);
        } else {
            showToast("Failed to join circle", "error");
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fcf6de] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcf6de] md:p-6 lg:p-10 pb-48 md:pb-12">
            <div className="max-w-3xl mx-auto">
                {/* Header Navigation */}
                <div className="flex items-center justify-between px-6 pt-2 pb-6 md:px-0">
                    <Link
                        href="/dashboard/study-circles"
                        className="group flex items-center gap-3 active:scale-95 transition-transform"
                    >
                        <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:bg-gray-50 transition-colors">
                            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-900" />
                        </div>
                        <span className="font-bold text-gray-500 group-hover:text-gray-900 transition-colors hidden sm:block">Back to Circles</span>
                    </Link>
                </div>

                <div className="bg-white md:rounded-[3rem] shadow-2xl shadow-black/5 overflow-hidden">
                    {/* Immersive Banner */}
                    <div className="h-40 md:h-56 bg-zinc-900 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
                            <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] bg-white p-2 shadow-2xl border-4 border-white">
                                <Avatar src={circle.avatar_url} name={circle.name} className="w-full h-full rounded-[2rem]" />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pt-20 pb-10 md:px-12 md:pt-24 md:pb-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-4xl md:text-6xl font-black font-newyork text-gray-900 tracking-tight mb-4">
                                    {circle.name}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <div className="px-4 py-1.5 bg-[#fcf6de] border border-[#ffc107] text-[#8a6800] text-sm font-black rounded-full uppercase tracking-wider">
                                        {circle.course || "General"}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 font-bold">
                                        <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                                        <span>{circle.member_count} community members</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
                            <div className="space-y-10">
                                {/* About Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 text-[#ffc107]" />
                                        About our Circle
                                    </h3>
                                    <p className="text-gray-700 font-bold leading-relaxed text-xl font-newyork whitespace-pre-wrap">
                                        {circle.description || "Welcome to our group. We focus on shared learning and collective growth."}
                                    </p>
                                </div>

                            </div>

                            {/* Sidebar-style info */}
                            <div className="space-y-6">
                                <div className="p-6 bg-[#fcf6de]/40 rounded-[2rem] border-2 border-[#ffc107]/20 border-dashed">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${circle.is_private ? 'bg-zinc-900 text-white' : 'bg-green-500 text-white'}`}>
                                            <HugeiconsIcon icon={circle.is_private ? LockIcon : UserGroupIcon} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 capitalize">{circle.is_private ? "Private" : "Public"}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Access Mode</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                        {circle.is_private ? "You will need an invite code to access the contents of this circle once admitted." : "This is an open community where any student can join and start sharing ideas immediately."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 pt-8 border-t border-gray-50">
                            <button
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="w-full h-16 bg-black text-white rounded-full font-black text-xl hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 disabled:scale-100 relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                {isJoining ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <>
                                        <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5 text-[#ffc107]" />
                                        <span>Join Circle</span>
                                    </>
                                )}
                            </button>
                            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-8">
                                One click to join your new hive
                            </p>
                        </div>
                    </div>
                </div>

                {/* Safe Area Spacer for Mobile */}
                <div className="h-32 md:hidden" />
            </div>
        </div>
    );
}
