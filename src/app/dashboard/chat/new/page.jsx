"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    SentIcon,
    BubbleChatIcon
} from "@hugeicons/core-free-icons";
import ChatSidebar from "@/components/dashboard/ChatSidebar";
import Avatar from "@/components/ui/Avatar";
import { getDisplayName } from "@/utils/stringUtils";
import { getOrCreateConversation } from "@/utils/chat";

function NewChatContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const otherUserId = searchParams.get("user");
    const gigId = searchParams.get("gig") || null;

    const [otherUser, setOtherUser] = useState(null);
    const [gig, setGig] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const inputRef = useRef(null);
    const supabase = createClient();

    useEffect(() => {
        const setup = async () => {
            if (!otherUserId) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setCurrentUser(session.user);

            // Fetch the other user's profile
            const { data: userData } = await supabase
                .from("users")
                .select("id, display_name, first_name, profile_picture, username")
                .eq("id", otherUserId)
                .single();

            if (userData) setOtherUser(userData);

            // If a gig is referenced, fetch its details
            if (gigId) {
                const { data: gigData } = await supabase
                    .from("gigs")
                    .select("id, title, price, category")
                    .eq("id", gigId)
                    .single();
                if (gigData) setGig(gigData);
            }

            setLoading(false);

            // Focus the input after loading
            setTimeout(() => inputRef.current?.focus(), 100);
        };

        setup();
    }, [otherUserId, gigId, supabase]);

    const handleSendFirstMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || sending) return;

        const content = newMessage.trim();
        setSending(true);

        try {
            // 1. NOW create the conversation
            const conversationId = await getOrCreateConversation(otherUserId, gigId);

            // 2. Insert the first message
            const { error: msgError } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUser.id,
                    content: content
                });

            if (msgError) {
                console.error("Error sending message:", msgError);
                setSending(false);
                return;
            }

            // 3. Update conversation metadata
            await supabase
                .from("conversations")
                .update({
                    last_message: content,
                    updated_at: new Date().toISOString(),
                    hidden_by: [] // Clear hidden status so it resurfaces for everyone
                })
                .eq("id", conversationId);

            // 4. Create a "Gig Booked" notification for the gig author
            if (gigId && otherUser) {
                await supabase.from('notifications').insert({
                    user_id: otherUserId,
                    actor_id: currentUser.id,
                    type: 'gig_purchase',
                    entity_type: 'gig',
                    entity_id: gigId,
                    message: `Booked your gig: ${gig?.title || 'Gig'}`
                });
            }

            // 5. Seamlessly swap to the real chat page
            router.replace(`/dashboard/chat/${conversationId}`);
        } catch (err) {
            console.error("Error creating conversation:", err);
            setSending(false);
        }
    };

    if (!otherUserId) {
        return (
            <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] items-center justify-center bg-white md:bg-[#fcf6de]">
                <p className="text-gray-500 font-medium">Invalid chat link.</p>
            </div>
        );
    }

    const displayName = otherUser ? getDisplayName(otherUser) : "Loading...";

    return (
        <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] bg-white md:bg-[#fcf6de] md:p-4 lg:p-8 md:pt-0 max-w-[1200px] mx-auto w-full overflow-hidden">
            <div className="flex w-full h-full bg-white md:rounded-[2.5rem] md:border md:border-gray-200 md:shadow-sm overflow-hidden">

                {/* Desktop Sidebar */}
                <div className="hidden md:flex">
                    <ChatSidebar />
                </div>

                <div className="flex-1 flex flex-col h-full overflow-hidden shrink-0 min-w-0">
                    {/* Chat Header */}
                    <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <button onClick={() => router.push('/dashboard/chat')} className="md:hidden p-2 hover:bg-gray-50 rounded-full transition-colors mr-1">
                                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} className="text-gray-900" />
                            </button>
                            {!loading && (
                                <>
                                    <div className="shrink-0">
                                        <Avatar
                                            src={otherUser?.profile_picture}
                                            name={displayName}
                                            className="size-10 rounded-full border-2 border-[#ffc107]/20 shadow-sm"
                                        />
                                    </div>
                                    <div className="min-w-0 flex flex-col justify-center">
                                        <h2 className="text-[15px] font-black text-gray-900 leading-tight truncate">{displayName}</h2>
                                        {otherUser?.username && (
                                            <span className="text-[12px] font-medium text-gray-500 truncate">@{otherUser.username}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Empty Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 pb-32 md:pb-6 flex flex-col items-center justify-center bg-gray-50/20">
                        <div className="flex flex-col items-center text-center max-w-xs">
                            <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                <HugeiconsIcon icon={BubbleChatIcon} size={28} className="text-[#ffc107]" />
                            </div>
                            <h3 className="text-lg font-black font-newyork text-gray-900 mb-1">
                                Start a conversation
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">
                                Send your first message to {displayName}
                            </p>

                            {/* Gig reference if applicable */}
                            {gig && (
                                <div className="mt-4 w-full bg-white border-2 border-[#ffc107]/30 rounded-[1.5rem] p-4 flex gap-3 items-center shadow-sm">
                                    <div className="shrink-0">
                                        <Avatar
                                            src={otherUser?.profile_picture}
                                            name={displayName}
                                            className="w-10 h-10 rounded-full border border-gray-100"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Gig Reference</p>
                                        <p className="text-[14px] font-black text-gray-900 truncate">{gig.title}</p>
                                        <p className="text-[13px] font-bold text-[#ffc107]">
                                            <span className="text-gray-400 text-[11px] font-medium mr-0.5">¢</span>
                                            {gig.price}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSendFirstMessage}
                        className="fixed md:relative bottom-[64px] md:bottom-auto left-0 right-0 md:left-auto md:right-auto p-4 md:p-6 md:pt-0 shrink-0 bg-white/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t border-gray-100 md:border-none z-10"
                    >
                        <div className="relative flex items-center bg-gray-50 rounded-[2rem] border border-gray-100 p-1.5 focus-within:border-[#ffc107]/50 focus-within:ring-4 focus-within:ring-[#ffc107]/5 transition-all shadow-sm">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message..."
                                disabled={sending}
                                className="flex-1 bg-transparent border-none outline-none px-5 py-3 text-[14px] font-medium placeholder:text-gray-400 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="size-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0"
                            >
                                {sending ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <HugeiconsIcon icon={SentIcon} size={20} />
                                )}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default function NewChatPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#fcf6de]">
                <div className="w-10 h-10 border-4 border-[#ffc107] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <NewChatContent />
        </Suspense>
    );
}
