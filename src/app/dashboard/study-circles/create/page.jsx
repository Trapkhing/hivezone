"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Add01Icon,
    Image01Icon,
    Attachment01Icon,
    UserGroupIcon,
    LockIcon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

export default function CreateCirclePage() {
    const router = useRouter();
    const { showToast } = useUI();
    const supabase = createClient();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        course: "",
        description: "",
        is_private: false
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            const { data: profileData } = await supabase
                .from("users")
                .select("id")
                .eq("id", session.user.id)
                .single();
            setProfile(profileData);
        };
        checkUser();
    }, [router, supabase]);

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !profile) return;

        setIsLoading(true);

        let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&size=200`;

        if (selectedAvatarFile) {
            try {
                const fileExt = selectedAvatarFile.name.split('.').pop();
                const fileName = `study-circle-avatars/${Math.random().toString(36).substring(2, 9)}-${Date.now()}.${fileExt}`;

                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: fileName,
                        fileType: selectedAvatarFile.type,
                    }),
                });

                if (!response.ok) throw new Error("Failed to get upload URL");
                const { uploadUrl, publicUrl: r2PublicUrl } = await response.json();

                const uploadResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": selectedAvatarFile.type },
                    body: selectedAvatarFile,
                });

                if (!uploadResponse.ok) throw new Error("Failed to upload");
                avatarUrl = r2PublicUrl;
            } catch (error) {
                console.error("Circle avatar upload error:", error);
                showToast("Image upload failed.", "error");
            }
        }

        const inviteCode = formData.is_private ? generateInviteCode() : null;

        const { data, error } = await supabase
            .from("study_circles")
            .insert({
                name: formData.name,
                course: formData.course,
                description: formData.description,
                created_by: profile.id,
                is_private: formData.is_private,
                invite_code: inviteCode,
                avatar_url: avatarUrl
            })
            .select()
            .single();

        if (!error) {
            await supabase.from("study_circle_members").insert({
                circle_id: data.id,
                user_id: profile.id
            });

            showToast("Study Circle created!", "success");
            router.push("/dashboard/study-circles");
        } else {
            showToast("Failed to create circle", "error");
        }
        setIsLoading(false);
    };

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

                <div className="bg-white md:rounded-[3rem] shadow-xl shadow-black/5 border border-gray-50/50 overflow-hidden">
                    {/* Visual Banner Identity */}
                    <div className="h-24 bg-gradient-to-r from-zinc-900 to-zinc-800 w-full" />

                    <div className="px-6 py-8 md:px-12 md:pb-16 relative">
                        {/* Avatar Positioning */}
                        <div className="absolute -top-12 left-6 md:left-12">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] bg-white p-1.5 shadow-lg border-4 border-white overflow-hidden relative">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} className="w-full h-full object-cover rounded-[2rem]" alt="Profile" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 rounded-[2rem] flex items-center justify-center">
                                            <HugeiconsIcon icon={Image01Icon} className="w-10 h-10 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                                        <HugeiconsIcon icon={Add01Icon} className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#ffc107] text-black rounded-2xl flex items-center justify-center border-4 border-white shadow-md">
                                    <HugeiconsIcon icon={Attachment01Icon} className="w-4 h-4" />
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedAvatarFile(file);
                                        setAvatarPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>

                        {/* Heading Area */}
                        <div className="mt-16 md:mt-24 mb-12">
                            <h1 className="text-4xl font-black font-newyork text-gray-900 tracking-tight mb-2 text-center md:text-left">Start a Circle</h1>
                            <p className="text-gray-500 font-medium text-lg leading-tight text-center md:text-left">Build a custom space for shared learning.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Circle Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-16 px-6 bg-gray-50/50 border border-transparent rounded-[1.5rem] font-bold text-gray-900 focus:bg-white focus:border-[#ffc107] focus:ring-4 focus:ring-[#ffc107]/10 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="e.g. Physics Pioneers"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Key Subject</label>
                                    <input
                                        type="text"
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                        className="w-full h-16 px-6 bg-gray-50/50 border border-transparent rounded-[1.5rem] font-bold text-gray-900 focus:bg-white focus:border-[#ffc107] focus:ring-4 focus:ring-[#ffc107]/10 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="e.g. Science"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Privacy & Accessibility</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_private: false })}
                                        className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all relative overflow-hidden group ${!formData.is_private ? 'border-[#ffc107] bg-amber-50/30' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${!formData.is_private ? 'bg-[#ffc107] text-white shadow-lg shadow-amber-200' : 'bg-white text-gray-400 shadow-sm'}`}>
                                            <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className={`text-[15px] font-black tracking-tight ${!formData.is_private ? 'text-amber-900' : 'text-gray-900'}`}>Public Hub</span>
                                            <span className="text-xs text-gray-500 font-bold">Anyone can join and contribute</span>
                                        </div>
                                        {!formData.is_private && <HugeiconsIcon icon={Add01Icon} className="absolute right-6 w-5 h-5 text-amber-500" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_private: true })}
                                        className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all relative overflow-hidden group ${formData.is_private ? 'border-zinc-900 bg-zinc-50' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.is_private ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm'}`}>
                                            <HugeiconsIcon icon={LockIcon} className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className={`text-[15px] font-black tracking-tight ${formData.is_private ? 'text-zinc-900' : 'text-gray-900'}`}>Private Space</span>
                                            <span className="text-xs text-gray-500 font-bold">Registration via invite code only</span>
                                        </div>
                                        {formData.is_private && <HugeiconsIcon icon={Add01Icon} className="absolute right-6 w-5 h-5 text-zinc-900" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">About our Circle</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-6 bg-gray-50/50 border border-transparent rounded-[2rem] font-bold text-gray-900 text-lg focus:bg-white focus:border-[#ffc107] focus:ring-4 focus:ring-[#ffc107]/10 outline-none transition-all resize-none placeholder:text-gray-300 leading-relaxed"
                                    placeholder="Briefly describe the purpose of this group..."
                                />
                            </div>

                            <div className="pt-4 flex flex-col items-center">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-20 bg-black text-white rounded-full font-black text-2xl hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-6 h-6 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin"></div>
                                            <span>Creating Circle...</span>
                                        </>
                                    ) : (
                                        <>
                                            <HugeiconsIcon icon={Add01Icon} className="w-6 h-6 text-[#ffc107]" />
                                            <span>Start this Circle</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-6">You will be the circle administrator</p>
                            </div>

                            <div className="h-20 md:hidden" />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
