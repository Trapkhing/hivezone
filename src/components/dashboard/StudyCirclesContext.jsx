"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

const StudyCirclesContext = createContext();

export const useStudyCircles = () => {
    const context = useContext(StudyCirclesContext);
    if (!context) {
        throw new Error("useStudyCircles must be used within a StudyCirclesProvider");
    }
    return context;
};

const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(date));
};

export const StudyCirclesProvider = ({ children }) => {
    const [supabase] = useState(() => createClient());
    const { showToast } = useUI();
    const [profile, setProfile] = useState(null);
    const [myCircles, setMyCircles] = useState([]);
    const [discoverCircles, setDiscoverCircles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyCircles = useCallback(async (userId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from("study_circle_members")
            .select(`
                circle_id,
                last_read_at,
                study_circles (*)
            `)
            .eq("user_id", userId);

        if (error) {
            setLoading(false);
            return;
        }

        if (data) {
            const formatted = await Promise.all(data.map(async (item) => {
                const { count } = await supabase
                    .from("study_circle_members")
                    .select("*", { count: 'exact', head: true })
                    .eq("circle_id", item.circle_id);

                const circleInfo = Array.isArray(item.study_circles) ? item.study_circles[0] : item.study_circles;
                if (!circleInfo) return null;

                // Compute unread: has a message arrived after last_read_at?
                const hasUnread = circleInfo.last_message_at && (
                    !item.last_read_at || new Date(circleInfo.last_message_at) > new Date(item.last_read_at)
                );

                return {
                    ...circleInfo,
                    member_count: count || 0,
                    unread: hasUnread ? 1 : 0,
                    last_message: circleInfo.last_message || "No messages yet",
                    timestamp: circleInfo.last_message_at
                        ? formatDate(circleInfo.last_message_at)
                        : formatDate(circleInfo.created_at || new Date())
                };
            }));

            const validCircles = formatted.filter(Boolean);
            const sorted = validCircles.sort((a, b) => {
                const dateA = new Date(a.last_message_at || a.created_at);
                const dateB = new Date(b.last_message_at || b.created_at);
                return dateB - dateA;
            });

            setMyCircles(sorted);
        }
        setLoading(false);
    }, [supabase]);

    const fetchDiscoverCircles = useCallback(async (userId) => {
        const { data: joinedIds } = await supabase
            .from("study_circle_members")
            .select("circle_id")
            .eq("user_id", userId);

        const joinedIdList = joinedIds?.map(j => j.circle_id) || [];

        let query = supabase.from("study_circles").select("*")
            .eq("is_private", false);

        if (joinedIdList.length > 0) {
            query = query.not("id", "in", `(${joinedIdList.join(",")})`);
        }

        const { data, error } = await query;
        if (error) return;

        if (data) {
            const formatted = await Promise.all(data.map(async (circle) => {
                const { count } = await supabase
                    .from("study_circle_members")
                    .select("*", { count: 'exact', head: true })
                    .eq("circle_id", circle.id);
                return { ...circle, member_count: count || 0 };
            }));
            setDiscoverCircles(formatted);
        }
    }, [supabase]);

    const loadUserData = useCallback(async (userId) => {
        try {
            const { data: profileData } = await supabase
                .from("users")
                .select("id")
                .eq("id", userId)
                .single();

            setProfile(profileData);
            fetchMyCircles(userId);
            fetchDiscoverCircles(userId);
        } catch (err) { }
    }, [supabase, fetchMyCircles, fetchDiscoverCircles]);

    useEffect(() => {
        let currentUserId = null;

        const fetchInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                currentUserId = session.user.id;
                loadUserData(session.user.id);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                currentUserId = session.user.id;
                loadUserData(session.user.id);
            }
        });

        fetchInitialData();

        // Realtime: update sidebar last_message when new message arrives in any circle
        const channel = supabase
            .channel('study-circles-inbox')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'study_circle_messages' },
                (payload) => {
                    const { circle_id, content, attachment_url } = payload.new;
                    setMyCircles(prev => {
                        const updated = prev.map(c => {
                            if (c.id !== circle_id) return c;
                            return {
                                ...c,
                                last_message: content || (attachment_url ? 'Sent an attachment' : ''),
                                last_message_at: payload.new.created_at,
                                timestamp: formatDate(payload.new.created_at)
                            };
                        });
                        // Re-sort by latest message
                        return [...updated].sort((a, b) =>
                            new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at)
                        );
                    });
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [supabase, loadUserData]);

    const markCircleAsRead = useCallback((circleId) => {
        setMyCircles(prev => prev.map(c => c.id === circleId ? { ...c, unread: 0 } : c));
    }, []);

    const handleJoinCircle = async (circleId) => {
        if (!profile) return;
        const { error } = await supabase
            .from("study_circle_members")
            .insert({ circle_id: circleId, user_id: profile.id });

        if (error) {
            showToast("Failed to join circle", "error");
        } else {
            showToast("Joined circle successfully!", "success");
            fetchMyCircles(profile.id);
            fetchDiscoverCircles(profile.id);
        }
    };

    const handleLeaveCircle = async (circleId) => {
        if (!profile) return;
        const { error } = await supabase
            .from("study_circle_members")
            .delete()
            .eq("circle_id", circleId)
            .eq("user_id", profile.id);

        if (error) {
            showToast("Failed to leave circle", "error");
        } else {
            showToast("Left circle successfully", "success");
            // Optimistic update
            setMyCircles(prev => prev.filter(c => c.id !== circleId));
            fetchMyCircles(profile.id);
            fetchDiscoverCircles(profile.id);
        }
    };

    return (
        <StudyCirclesContext.Provider value={{
            profile,
            myCircles,
            discoverCircles,
            loading,
            fetchMyCircles,
            fetchDiscoverCircles,
            handleJoinCircle,
            handleLeaveCircle,
            markCircleAsRead,
            setMyCircles
        }}>
            {children}
        </StudyCirclesContext.Provider>
    );
};
