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
    LockIcon,
    Tick01Icon,
    Bookmark02Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";

export default function JoinCirclePage() {
    const { id: circleId } = useParams();
    const router = useRouter();
    const { showToast } = useUI();
    const supabase = createClient();

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
            router.push(`/dashboard/study-circles/${circleId}`);
        } else {
            showToast("Failed to join circle", "error");
            setIsJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fcf6de] flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcf6de] md:p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <Link
                    href="/dashboard/study-circles"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-8 group transition-colors px-4 md:px-0"
                >
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center group-hover:bg-gray-50 transition-colors shadow-sm">
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
                    </div>
                    Back to Circles
                </Link>

                <div className="bg-white md:rounded-[3rem] md:shadow-xl md:border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-[#fff9e6] bg-white shadow-lg overflow-hidden mb-6">
                                <Avatar src={circle.avatar_url} name={circle.name} className="w-full h-full rounded-none" />
                            </div>
                            <h1 className="text-4xl font-black font-newyork text-gray-900 mb-2">{circle.name}</h1>
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    {circle.course || "General"}
                                </span>
                                <div className="flex items-center gap-1 text-gray-500 font-bold text-sm">
                                    <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
                                    {circle.member_count} members
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                                    About this Circle
                                </h3>
                                <p className="text-gray-700 font-medium leading-relaxed text-lg">
                                    {circle.description || "No description provided for this circle."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                        <HugeiconsIcon icon={Tick01Icon} className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-gray-900">Collaborative</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Learning Style</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                        <HugeiconsIcon icon={Bookmark02Icon} className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-gray-900">Resource Sharing</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Included Feature</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleJoin}
                                disabled={isJoining}
                                className="w-full h-20 bg-black text-white rounded-[2rem] font-black text-2xl hover:bg-gray-800 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 mt-8"
                            >
                                {isJoining ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <>
                                        <HugeiconsIcon icon={UserGroupIcon} className="w-6 h-6" />
                                        <span>Join Study Circle</span>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">
                                Join to access chat, resources, and more
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
