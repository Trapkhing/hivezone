"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDisplayName } from "@/utils/stringUtils";

const ChatContext = createContext({
    unreadCount: 0,
    conversations: [],
    loadingConversations: true,
    setActiveConversation: () => { },
    hideConversation: async () => { },
    refreshUnreadCount: () => { },
    refreshConversations: () => { }
});

export const useChatConfig = () => useContext(ChatContext);

export default function ChatProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const activeConversationRef = useRef(null);
    const supabase = createClient();

    const setActiveConversation = useCallback((id) => {
        activeConversationRef.current = id;
        if (id) {
            // Immediately zero out the unread badge for this conversation
            setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, unreadCount: 0 } : c
            ));
        }
    }, []);

    const fetchConversations = async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participants:conversation_participants(
                    user:users(id, display_name, first_name, profile_picture, username)
                ),
                gig:gigs(title),
                unread_messages:messages (id)
            `)
            .eq('unread_messages.is_read', false)
            .neq('unread_messages.sender_id', session.user.id)
            .not('hidden_by', 'cs', `{${session.user.id}}`)
            .order('updated_at', { ascending: false });

        if (!error) {
            const formatted = data.map(conv => {
                const otherParticipant = conv.participants.find(p => p.user.id !== session.user.id);
                const otherUserRaw = otherParticipant?.user;
                const unreadCount = conv.unread_messages ? conv.unread_messages.length : 0;
                return {
                    ...conv,
                    otherUser: otherUserRaw ? { ...otherUserRaw, computedName: getDisplayName(otherUserRaw) } : { computedName: "Somebody", display_name: "Somebody" },
                    unreadCount
                };
            });
            setConversations(formatted);
        }
        setLoadingConversations(false);
    };

    const hideConversation = async (conversationId) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Optimistically remove from sidebar
        setConversations(prev => prev.filter(c => c.id !== conversationId));

        // Fetch current conversation to append to hidden_by array
        const { data: conv } = await supabase
            .from('conversations')
            .select('hidden_by')
            .eq('id', conversationId)
            .single();

        if (conv) {
            const currentHiddenBy = conv.hidden_by || [];
            if (!currentHiddenBy.includes(session.user.id)) {
                await supabase
                    .from('conversations')
                    .update({ hidden_by: [...currentHiddenBy, session.user.id] })
                    .eq('id', conversationId);
            }
        }
    };

    const fetchUnreadCount = useCallback(async (sessionParam = null) => {
        const session = sessionParam || (await supabase.auth.getSession()).data.session;
        if (!session) return;

        // Fetch all conversations for the user
        const { data: convs, error: convError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', session.user.id);

        if (convError || !convs.length) return;

        const convIds = convs.map(c => c.conversation_id);

        // Count messages that are in those conversations, unread, and NOT sent by the current user
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .eq('is_read', false)
            .neq('sender_id', session.user.id);

        if (!error && count !== null) {
            setUnreadCount(count);
        }
    }, [supabase]);

    useEffect(() => {
        let currentSession = null;

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            currentSession = session;
            if (session) {
                await Promise.all([
                    fetchUnreadCount(session),
                    fetchConversations(session)
                ]);
            } else {
                setLoadingConversations(false);
            }
        };

        init();

        // Subscribe to messages changes globally
        const channel = supabase
            .channel('global-chat')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new;
                    const isActiveChat = newMsg.conversation_id === activeConversationRef.current;

                    // Only fetch global unread count if message is NOT for the active chat
                    // (the chat window's mark_messages_as_read handles DB for active chats)
                    if (!isActiveChat) {
                        fetchUnreadCount();
                    }

                    // Instantly update conversations list (sort & last_message)
                    setConversations(prev => {
                        const convIndex = prev.findIndex(c => c.id === newMsg.conversation_id);

                        if (convIndex > -1) {
                            const updatedConvs = [...prev];
                            const conv = updatedConvs[convIndex];

                            const isIncoming = newMsg.sender_id !== currentSession?.user?.id;

                            const updatedConv = {
                                ...conv,
                                last_message: newMsg.content,
                                updated_at: newMsg.created_at,
                                unreadCount: isActiveChat ? 0 : (isIncoming ? conv.unreadCount + 1 : conv.unreadCount)
                            };

                            updatedConvs.splice(convIndex, 1);
                            updatedConvs.unshift(updatedConv);
                            return updatedConvs;
                        } else {
                            fetchConversations(currentSession);
                            return prev;
                        }
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => {
                    // When is_read flips (mark_messages_as_read RPC), refresh unread badges
                    fetchUnreadCount();
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'messages' },
                () => {
                    // Update exact counts and fetch the new last_message from server
                    fetchUnreadCount();
                    fetchConversations(currentSession);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'conversations' },
                () => {
                    fetchConversations(currentSession);
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    // Silently auto-retry on background connection instability
                    setTimeout(() => {
                        channel.subscribe();
                    }, 2000);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <ChatContext.Provider value={{
            unreadCount,
            conversations,
            loadingConversations,
            setActiveConversation,
            hideConversation,
            refreshUnreadCount: fetchUnreadCount,
            refreshConversations: fetchConversations
        }}>
            {children}
        </ChatContext.Provider>
    );
}
