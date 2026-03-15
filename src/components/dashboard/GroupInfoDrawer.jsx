"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    UserGroupIcon,
    InformationCircleIcon,
    Image01Icon,
    File01Icon,
    Link01Icon,
    LogoutCircle02Icon,
    Settings02Icon
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { createClient } from "@/utils/supabase/client";

export default function GroupInfoDrawer({ isOpen, onClose, circle, profile, onLeave }) {
    const supabase = createClient();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("members"); // members, media, docs

    useEffect(() => {
        if (isOpen && circle?.id) {
            fetchMembers();
        }
    }, [isOpen, circle?.id]);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("study_circle_members")
            .select(`
                user_id,
                users (id, display_name, first_name, profile_picture, email)
            `)
            .eq("circle_id", circle.id);

        if (!error) {
            setMembers(data.map(m => m.users));
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex justify-end overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out`}>
                {/* Header */}
                <div className="h-[76px] px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-black text-gray-900 font-newyork">Circle Info</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Circle Hero */}
                    <div className="p-8 flex flex-col items-center text-center bg-gray-50/50">
                        <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-md overflow-hidden mb-4">
                            <Avatar src={circle.avatar_url} name={circle.name} className="w-full h-full rounded-none" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-1">{circle.name}</h3>
                        <p className="text-sm font-bold text-gray-500 mb-4">{circle.member_count} Members</p>

                        {circle.description && (
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm w-full text-left">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <HugeiconsIcon icon={InformationCircleIcon} className="w-3.5 h-3.5" />
                                    Description
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                    {circle.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-6">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'members' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
                        >
                            Members
                        </button>
                        <button
                            onClick={() => setActiveTab("media")}
                            className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'media' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
                        >
                            Media
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "members" && (
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                    </div>
                                ) : (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center gap-4 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors">
                                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200">
                                                <Avatar src={member.profile_picture} name={member.display_name} className="w-full h-full" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-black text-gray-900 truncate">
                                                    {member.display_name || member.first_name}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${member.id === circle?.created_by ? 'text-[#ffc107]' : 'text-gray-400'}`}>
                                                    {member.id === circle?.created_by ? 'Admin' : 'Member'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === "media" && (
                            <div className="flex flex-col items-center justify-center p-12 text-center opacity-30">
                                <HugeiconsIcon icon={Image01Icon} className="w-12 h-12 mb-2" />
                                <p className="font-bold text-sm">No media shared yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-3">
                    {profile?.id === circle?.created_by && (
                        <Link
                            href={`/dashboard/study-circles/${circle.id}/edit`}
                            className="w-full h-12 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <HugeiconsIcon icon={Settings02Icon} className="w-4 h-4" />
                            Edit Circle Settings
                        </Link>
                    )}
                    <button
                        onClick={onLeave}
                        className="w-full h-12 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <HugeiconsIcon icon={LogoutCircle02Icon} className="w-4 h-4" />
                        Leave Study Circle
                    </button>
                </div>
            </div>
        </div>
    );
}
