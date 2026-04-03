"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Search01Icon,
    UserGroupIcon,
    LeftToRightListDashIcon,
    Add01Icon,
    Link01Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";
import { useStudyCircles } from "./StudyCirclesContext";

const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(date));
};

export default function StudyCircleSidebar({ activeId, isMobileVisible = true }) {
    const { showToast } = useUI();
    const supabase = createClient();
    const router = useRouter();
    const { 
        myCircles, 
        discoverCircles, 
        loading, 
        profile, 
        fetchMyCircles, 
        fetchDiscoverCircles,
        handleJoinCircle: contextJoinCircle 
    } = useStudyCircles();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("my"); // "my" or "discover"

    const [isJoiningCode, setIsJoiningCode] = useState(false);
    const [joinViaCode, setJoinViaCode] = useState("");

    useEffect(() => {
        if (profile?.id) {
            fetchMyCircles(profile.id);
            fetchDiscoverCircles(profile.id);
        }
    }, [activeId, profile?.id, fetchMyCircles, fetchDiscoverCircles]);

    const handleJoinViaCode = async (e) => {
        e.preventDefault();
        if (!joinViaCode.trim() || !profile) return;

        setIsJoiningCode(true);
        const { data, error } = await supabase
            .from("study_circles")
            .select("id, name")
            .eq("invite_code", joinViaCode.trim().toUpperCase())
            .single();

        if (error || !data) {
            showToast("Invalid invite code", "error");
        } else {
            const { data: membership } = await supabase
                .from("study_circle_members")
                .select("*")
                .eq("circle_id", data.id)
                .eq("user_id", profile.id)
                .single();

            if (membership) {
                showToast(`You are already a member of ${data.name}`, "info");
            } else {
                const { error: joinError } = await supabase
                    .from("study_circle_members")
                    .insert({
                        circle_id: data.id,
                        user_id: profile.id
                    });

                if (!joinError) {
                    showToast(`Joined ${data.name}!`, "success");
                    setJoinViaCode("");
                    if (profile?.id) {
                        fetchMyCircles(profile.id);
                        fetchDiscoverCircles(profile.id);
                    }
                    setActiveTab("my");
                    router.push(`/dashboard/study-circles/${data.id}`);
                } else {
                    showToast("Failed to join circle", "error");
                }
            }
        }
        setIsJoiningCode(false);
    };


    const displayedList = activeTab === "my"
        ? myCircles.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.course?.toLowerCase().includes(searchQuery.toLowerCase()))
        : discoverCircles.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.course?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className={`w-full md:w-[380px] lg:w-[420px] flex-col border-r border-gray-100 bg-white z-10 
            ${isMobileVisible ? 'flex' : 'hidden md:flex'} h-full shrink-0`}>

            {/* Header & Search */}
            <div className="p-6 pb-2 border-b border-gray-100 shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between md:hidden">
                    <h2 className="text-2xl font-black font-newyork text-gray-900 mb-1">Study Circles</h2>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search circles or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none placeholder:text-gray-400 font-medium focus:border-[#ffc107] focus:bg-white transition-colors"
                    />
                    <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-full w-full">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        My Circles
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'discover' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Discover
                    </button>
                </div>
                {/* Discover - Join via Code */}
                {activeTab === 'discover' && (
                    <form onSubmit={handleJoinViaCode} className="p-4 bg-blue-50/50 border-b border-gray-100 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">Have an invite code?</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter 8-digit code"
                                value={joinViaCode}
                                onChange={(e) => setJoinViaCode(e.target.value.toUpperCase())}
                                maxLength={8}
                                className="flex-1 h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-black tracking-widest outline-none focus:border-blue-400 transition-colors uppercase"
                            />
                            <button
                                type="submit"
                                disabled={isJoiningCode || !joinViaCode.trim()}
                                className="px-4 h-10 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {isJoiningCode ? "Joining..." : "Join"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
                {loading ? (
                    <div className="flex flex-col gap-1 p-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                                    <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                        <HugeiconsIcon icon={LeftToRightListDashIcon} className="w-12 h-12 mb-4" />
                        <p className="font-bold">No circles found</p>
                    </div>
                ) : displayedList.map((circle) => (
                    <div
                        key={circle.id}
                        onClick={() => {
                            if (activeTab === 'my') {
                                router.push(`/dashboard/study-circles/${circle.id}`);
                            } else {
                                router.push(`/dashboard/study-circles/${circle.id}/join`);
                            }
                        }}
                        className={`flex items-center gap-4 p-4 lg:px-6 cursor-pointer transition-colors border-l-4 
                            ${activeId === circle.id
                                ? 'bg-gray-50 border-[#ffc107]'
                                : 'bg-white border-transparent hover:bg-gray-50/50 border-b border-b-gray-50'
                            }`}
                    >
                        {/* Avatar */}
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-200">
                            <Avatar src={circle.avatar_url} name={circle.name} className="w-full h-full rounded-none" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="font-bold text-gray-900 text-[15px] truncate pr-2">
                                    {circle.name}
                                </h3>
                                {activeTab === "my" && (
                                    <span className={`text-[11px] font-semibold shrink-0 ${activeId === circle.id ? 'text-[#ffc107]' : 'text-gray-400'}`}>
                                        {circle.timestamp}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-[4px]">{circle.course}</span>
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                    <HugeiconsIcon icon={UserGroupIcon} className="w-3 h-3" />
                                    {circle.member_count || 0}
                                </div>
                            </div>
                            <p className={`text-[13px] truncate ${circle.unread > 0 ? 'text-black font-semibold' : 'text-gray-500 font-medium'}`}>
                                {activeTab === "my" ? (circle.last_message || "No messages yet") : circle.description}
                            </p>
                        </div>

                        {/* Unread Indicator */}
                        {circle.unread > 0 && activeTab === "my" && (
                            <div className="w-5 h-5 bg-[#ff3b30] text-white text-[10px] font-bold flex items-center justify-center rounded-full shrink-0">
                                {circle.unread}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
