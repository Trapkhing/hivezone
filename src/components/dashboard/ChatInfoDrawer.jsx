"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Cancel01Icon,
    InformationCircleIcon,
    Image01Icon,
    UserIcon,
    Link01Icon,
    Alert01Icon
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export default function ChatInfoDrawer({ isOpen, onClose, conversation, profile }) {
    const supabase = createClient();
    const { openReportModal, showImage } = useUI();
    const [activeTab, setActiveTab] = useState("info"); // info, media
    const [media, setMedia] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        if (isOpen && conversation?.id && activeTab === "media") {
            fetchMedia();
        }
    }, [isOpen, conversation?.id, activeTab]);

    const fetchMedia = async () => {
        setLoadingMedia(true);
        const { data, error } = await supabase
            .from("messages")
            .select("attachment_url")
            .eq("conversation_id", conversation.id)
            .not("attachment_url", "is", null);

        if (!error && data) {
            // Flatten and filter for images
            const allUrls = data.flatMap(m => m.attachment_url.split(','));
            const mediaUrls = allUrls.filter(url => url.match(/\.(jpeg|jpg|gif|png|webp|mp4|webm|ogg|mov|m4v|3gp|mkv)(\?.*)?$/i) || url.startsWith('blob:') || url.match(/\.(jpeg|jpg|gif|png|webp)$/i));
            setMedia(mediaUrls);
        }
        setLoadingMedia(false);
    };

    if (!isOpen || !conversation) return null;

    const otherUser = conversation.otherUser;

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
                    <h2 className="text-xl font-black text-gray-900 font-newyork">Chat Info</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* User Hero */}
                    <div className="p-8 flex flex-col items-center text-center bg-gray-50/50">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden mb-4">
                            <Avatar src={otherUser.profile_picture} name={otherUser.computedName} className="w-full h-full rounded-full" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-1">{otherUser.computedName}</h3>
                        <p className="text-sm font-bold text-gray-500 mb-4">@{otherUser.username}</p>

                        <Link 
                            href={`/dashboard/profile/${otherUser.username}`}
                            className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-black text-gray-900 shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <HugeiconsIcon icon={UserIcon} className="w-4 h-4" />
                            View Profile
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-6">
                        <button
                            onClick={() => setActiveTab("info")}
                            className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'info' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
                        >
                            Information
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
                        {activeTab === "info" && (
                            <div className="space-y-6">
                                {/* About Section */}
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <HugeiconsIcon icon={InformationCircleIcon} className="w-3.5 h-3.5" />
                                        About
                                    </h4>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                        {otherUser.bio || "No bio available."}
                                    </p>
                                </div>

                                {/* Gig Reference (if available) */}
                                {conversation.gig && (
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gig Topic</h4>
                                        <p className="text-sm font-bold text-gray-900">{conversation.gig.title}</p>
                                        <Link 
                                            href={`/dashboard/gigs/detail?id=${conversation.gig.id}`}
                                            className="mt-2 text-xs font-black text-[#ffc107] flex items-center gap-1 hover:underline"
                                        >
                                            View original gig <HugeiconsIcon icon={Link01Icon} className="w-3 h-3" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "media" && (
                            <div className="space-y-4">
                                {loadingMedia ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                    </div>
                                ) : media.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {media.map((url, i) => {
                                            const isVideo = url.match(/\.(mp4|webm|ogg|mov|m4v|3gp|mkv)(\?.*)?$/i);
                                            return (
                                                <div 
                                                    key={i} 
                                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity bg-gray-50 flex items-center justify-center"
                                                    onClick={() => showImage(url)}
                                                >
                                                    {isVideo ? (
                                                        <div className="flex items-center justify-center w-full h-full">
                                                            <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-gray-300" />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img src={url} alt={`Media ${i}`} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-30">
                                        <HugeiconsIcon icon={Image01Icon} className="w-12 h-12 mb-2" />
                                        <p className="font-bold text-sm">No media shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-3">
                    <button
                        onClick={() => openReportModal({ item_id: otherUser.id, item_type: "user" })}
                        className="w-full h-12 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4" />
                        Report User
                    </button>
                </div>
            </div>
        </div>
    );
}
