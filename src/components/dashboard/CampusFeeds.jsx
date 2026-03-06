"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/components/ui/Avatar";
import { useUI } from "@/components/ui/UIProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    CheckmarkBadge01Icon,
    MoreHorizontalCircle01Icon,
    Image01Icon,
    Attachment01Icon,
    Cancel01Icon,
    Delete02Icon,
    Alert01Icon,
    FavouriteIcon,
    Comment01Icon
} from "@hugeicons/core-free-icons";
import AutoPauseVideo from "@/components/ui/AutoPauseVideo";

const CampusFeeds = () => {
    const { showToast, confirmAction, showImage, openReportModal } = useUI();
    const [posts, setPosts] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [postContent, setPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState("image"); // 'image' or 'video'
    const [openMenuId, setOpenMenuId] = useState(null);
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [commentsData, setCommentsData] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);
    const supabase = createClient();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            let userInstitution = null;

            if (session) {
                // Fetch current user profile
                const { data: profileData } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(profileData);
                userInstitution = profileData?.institution;
            }

            if (!userInstitution) {
                setLoading(false);
                return;
            }

            // Fetch latest 3 posts with author details and counts
            const { data: feedsData, error } = await supabase
                .from("feeds")
                .select(`
                    *,
                    author:users!inner (
                        display_name,
                        username,
                        profile_picture,
                        is_verified,
                        institution
                    ),
                    likes:feed_likes(user_id),
                    comments:feed_comments(count)
                `)
                .eq('author.institution', userInstitution)
                .order('created_at', { ascending: false })
                .limit(3);

            if (!error) {
                const processedPosts = feedsData.map(post => ({
                    ...post,
                    likes_count: post.likes?.length || 0,
                    comments_count: post.comments?.[0]?.count || 0,
                    is_liked: post.likes?.some(l => l.user_id === session.user.id)
                }));
                setPosts(processedPosts || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [supabase]);

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 30) {
                showToast("File size must be less than 30MB.", "error");
                e.target.value = "";
                return;
            }

            const isVideo = file.type.startsWith("video/");
            setMediaType(isVideo ? "video" : "image");
            setSelectedMedia(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handlePost = async () => {
        if (!postContent.trim() && !selectedMedia) return;
        setIsPosting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            let url = null;

            // Upload image if selected
            if (selectedMedia) {
                const fileExt = selectedMedia.name.split('.').pop();
                const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
                const filePath = `post-media/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('feeds')
                    .upload(filePath, selectedMedia);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('feeds')
                    .getPublicUrl(filePath);

                url = urlData.publicUrl;
            }

            // Create post in DB
            const { data: newPost, error: postError } = await supabase
                .from('feeds')
                .insert([{
                    user_id: session.user.id,
                    content: postContent,
                    media_url: url
                }])
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture,
                        is_verified
                    )
                `)
                .single();

            if (postError) throw postError;

            // Update local state
            setPosts([newPost, ...posts]);
            setPostContent("");
            setSelectedMedia(null);
            setMediaPreview(null);

        } catch (error) {
            console.error("Error creating post:", error);
            showToast("Failed to create post. Please try again.", "error");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeletePost = async (postId, mediaUrl) => {
        const confirmed = await confirmAction({
            title: "Delete Post?",
            message: "Are you sure you want to remove this post? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            // 1. Delete media from storage if it exists
            if (mediaUrl) {
                try {
                    const bucketName = 'feeds';
                    const urlObj = new URL(mediaUrl);
                    const filenameFromUrl = decodeURIComponent(urlObj.pathname).split('/').pop().split('?')[0];
                    const folderPath = mediaUrl.includes('post-images') ? 'post-images' : 'post-media';

                    const { data: files } = await supabase.storage.from(bucketName).list(folderPath);
                    const matchingFile = files?.find(f => f.name === filenameFromUrl);

                    if (matchingFile) {
                        const filePath = `${folderPath}/${matchingFile.name}`;

                        const { error: storageError } = await supabase.storage
                            .from(bucketName)
                            .remove([filePath]);

                        if (storageError) {
                            console.error("Storage cleanup error:", storageError);
                        }
                    }
                } catch (e) {
                    console.error("Extraction failed:", e);
                }
            }

            // 2. Delete post from DB
            const { error: postError } = await supabase
                .from('feeds')
                .delete()
                .eq('id', postId);

            if (postError) throw postError;

            // 3. Update local state
            setPosts(posts.filter(p => p.id !== postId));
            setOpenMenuId(null);
            showToast("Post deleted successfully!");

        } catch (error) {
            console.error("Error deleting post:", error);
            showToast("Failed to delete post. Please try again.", "error");
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}sec ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleReportPost = async (post) => {
        openReportModal({
            item_id: post.id,
            item_type: 'feed',
            onSuccess: () => setOpenMenuId(null)
        });
    };

    const handleLike = async (post) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const isLiked = post.is_liked;
            const postId = post.id;

            // Optimistic update
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, is_liked: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
                    : p
            ));

            if (isLiked) {
                await supabase.from('feed_likes').delete().eq('feed_id', postId).eq('user_id', session.user.id);
            } else {
                await supabase.from('feed_likes').insert([{ feed_id: postId, user_id: session.user.id }]);

                // Grouped Notification Logic for Likes
                if (post.user_id !== session.user.id) {
                    const { data: existingNotif } = await supabase
                        .from('notifications')
                        .select('id, actor_id')
                        .eq('user_id', post.user_id)
                        .eq('type', 'like')
                        .eq('entity_id', postId)
                        .eq('is_read', false)
                        .single();

                    if (existingNotif) {
                        const othersCount = (post.likes_count || 0);
                        const actorName = profile?.display_name || profile?.first_name || 'User';
                        const message = othersCount > 0
                            ? `${actorName} and ${othersCount} others liked your post`
                            : `liked your post`;

                        await supabase
                            .from('notifications')
                            .update({
                                actor_id: session.user.id,
                                message: message,
                                created_at: new Date().toISOString()
                            })
                            .eq('id', existingNotif.id);
                    } else {
                        const actorName = profile?.display_name || profile?.first_name || 'User';
                        await supabase.from('notifications').insert({
                            user_id: post.user_id,
                            actor_id: session.user.id,
                            type: 'like',
                            entity_type: 'feed',
                            entity_id: postId,
                            message: `liked your post`
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            setPosts(prev => prev.map(p =>
                p.id === post.id
                    ? { ...p, is_liked: post.is_liked, likes_count: post.likes_count }
                    : p
            ));
        }
    };

    const fetchComments = async (postId) => {
        if (commentsData[postId]) return;
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        try {
            const { data, error } = await supabase
                .from('feed_comments')
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture
                    )
                `)
                .eq('feed_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setCommentsData(prev => ({ ...prev, [postId]: data }));
        } catch (error) {
            console.error("Error fetching comments:", error);
            showToast("Failed to load comments.", "error");
        } finally {
            setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleCommentSubmit = async (postId) => {
        const content = commentInputs[postId];
        if (!content?.trim()) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: newComment, error } = await supabase
                .from('feed_comments')
                .insert([{
                    feed_id: postId,
                    user_id: session.user.id,
                    content: content.trim()
                }])
                .select(`
                    *,
                    author:users (
                        display_name,
                        username,
                        profile_picture
                    )
                `)
                .single();

            if (error) throw error;

            setCommentsData(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), newComment]
            }));
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));

            // Update counts in posts
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));

            // Grouped Notification Logic for Comments
            const post = posts.find(p => p.id === postId);
            if (post && post.user_id !== session.user.id) {
                const { data: existingNotif } = await supabase
                    .from('notifications')
                    .select('id, actor_id')
                    .eq('user_id', post.user_id)
                    .eq('type', 'comment')
                    .eq('entity_id', postId)
                    .eq('is_read', false)
                    .single();

                if (existingNotif) {
                    const othersCount = (post.comments_count || 0);
                    const actorName = profile?.display_name || profile?.first_name || 'User';
                    const message = othersCount > 0
                        ? `${actorName} and ${othersCount} others commented on your post`
                        : `commented on your post`;

                    await supabase
                        .from('notifications')
                        .update({
                            actor_id: session.user.id,
                            message: message,
                            created_at: new Date().toISOString()
                        })
                        .eq('id', existingNotif.id);
                } else {
                    const actorName = profile?.display_name || profile?.first_name || 'User';
                    await supabase.from('notifications').insert({
                        user_id: post.user_id,
                        actor_id: session.user.id,
                        type: 'comment',
                        entity_type: 'feed',
                        entity_id: postId,
                        message: `commented on your post`
                    });
                }
            }

        } catch (error) {
            console.error("Error posting comment:", error);
            showToast("Failed to post comment.", "error");
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        confirmAction({
            title: "Delete Comment",
            message: "Are you sure you want to delete this comment?",
            confirmText: "Delete",
            type: "danger",
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('feed_comments')
                        .delete()
                        .eq('id', commentId);

                    if (error) throw error;

                    // Update UI state
                    setCommentsData(prev => ({
                        ...prev,
                        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
                    }));

                    // Update count in posts
                    setPosts(prev => prev.map(p =>
                        p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) } : p
                    ));

                    showToast("Comment deleted successfully.", "success");
                } catch (error) {
                    console.error("Error deleting comment:", error);
                    showToast("Failed to delete comment.", "error");
                }
            }
        });
    };

    const toggleComments = (postId) => {
        if (activeCommentId === postId) {
            setActiveCommentId(null);
        } else {
            setActiveCommentId(postId);
            fetchComments(postId);
        }
    };

    return (
        <div className="flex flex-col gap-4 mt-8 w-full px-0 md:px-0 overflow-x-hidden">
            <div className="flex items-center justify-between px-4 md:px-0">
                <h2 className="text-2xl sm:text-3xl font-black tracking-wide font-newyork text-gray-900 leading-none">Campus Feeds</h2>
                <Link href="/dashboard/feed" className="text-gray-800 font-bold text-sm hover:text-black hover:underline transition-all underline-offset-4 flex items-center gap-1 group shrink-0">
                    View all feeds
                    <span className="group-hover:translate-x-1 duration-300">→</span>
                </Link>
            </div>

            {/* Create Post Input Component */}
            <div className="bg-white rounded-xl sm:rounded-xl p-4 sm:p-5 shadow-sm border-y sm:border border-gray-100 flex flex-col mb-4">
                <div className="flex gap-4">
                    {/* User Avatar */}
                    <Link href="/dashboard/profile" className="w-12 h-12 bg-gray-50 shrink-0 block rounded-full">
                        <Avatar
                            src={profile?.profile_picture}
                            name="Current User"
                            className="w-full h-full rounded-full"
                        />
                    </Link>

                    {/* Input Field Area */}
                    <div className="flex-1">
                        <textarea
                            placeholder="What's happening on campus?"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder:text-gray-400 font-bold text-[18px] pt-3 min-h-[60px]"
                        ></textarea>

                        {/* Image/Video Preview */}
                        {mediaPreview && (
                            <div className="relative mt-2 mb-2 inline-block">
                                {mediaType === "video" ? (
                                    <video src={mediaPreview} controls className="max-h-40 rounded-xl" />
                                ) : (
                                    <img src={mediaPreview} alt="Preview" className="max-h-40 rounded-xl" />
                                )}
                                <button
                                    onClick={() => { setSelectedMedia(null); setMediaPreview(null); }}
                                    className="absolute -top-3 -right-3 bg-black text-white rounded-full p-1.5 shadow-md hover:scale-110 transition-transform"
                                >
                                    <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2 pl-[3.5rem] sm:pl-[4.5rem]">
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleMediaSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black transition-colors border border-gray-100"
                        >
                            <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={isPosting || (!postContent.trim() && !selectedMedia)}
                        className={`bg-[#ffc107] hover:bg-[#ffca2c] text-black font-bold text-[15px] px-6 py-1.5 rounded-full transition-all active:scale-95 shadow-sm flex items-center gap-2 ${isPosting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>

            {/* Feed Stream */}
            <div className="flex flex-col gap-2 pb-4">
                {loading ? (
                    <div className="flex flex-col gap-5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm p-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-3 py-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                                        <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                                        <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <div
                            key={post.id}
                            className={`bg-white rounded-xl sm:rounded-xl shadow-sm border-y sm:border border-gray-100 flex flex-col pt-4 sm:pt-5 pb-0 animate-in fade-in slide-in-from-bottom-4 duration-700`}
                        >
                            <div className="flex gap-3 sm:gap-4 px-3.5 sm:px-5 pb-4">
                                {/* Left: Avatar */}
                                <Link
                                    href={`/dashboard/profile/${post.author?.username || post.user_id}`}
                                    className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 shrink-0 block rounded-full"
                                >
                                    <Avatar
                                        src={post.author?.profile_picture}
                                        name={post.author?.display_name || "Author"}
                                        className="w-full h-full rounded-full"
                                    />
                                </Link>

                                {/* Right: Content */}
                                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                    {/* Post Header */}
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
                                            <span className="font-bold text-gray-900 text-[16px]">
                                                {post.author?.display_name || 'Anonymous'}
                                            </span>
                                            {post.author?.is_verified && (
                                                <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-4 h-4 text-green-500 shrink-0" strokeWidth={2.5} />
                                            )}
                                            <span className="text-gray-500 text-[15px]">@{post.author?.username || 'user'}</span>
                                            <span className="text-[#ffc107] font-bold text-xl leading-none px-1 relative -top-1">.</span>
                                            <span className="text-gray-500 text-[15px] shrink-0 font-medium">{formatDate(post.created_at)}</span>
                                        </div>

                                        {/* 3-Dot Menu */}
                                        <div className="relative shrink-0">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                            >
                                                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5" strokeWidth={2} />
                                            </button>

                                            {openMenuId === post.id && (
                                                <div
                                                    ref={menuRef}
                                                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in zoom-in duration-200"
                                                >
                                                    {profile?.id === post.user_id ? (
                                                        <button
                                                            onClick={() => handleDeletePost(post.id, post.media_url)}
                                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" strokeWidth={2} />
                                                            Delete Post
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReportPost(post)}
                                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                                                        >
                                                            <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4" strokeWidth={2} />
                                                            Report Post
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Post Text */}
                                    {post.content && (
                                        <p className="text-gray-900 text-[16px] leading-[1.4] font-regular break-words pr-2">
                                            {post.content}
                                        </p>
                                    )}

                                    {/* Post Media */}
                                    {post.media_url && (
                                        <div className="w-full rounded-xl overflow-hidden mt-3 cursor-pointer group/img bg-black shadow-sm border border-gray-100/50">
                                            {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                <AutoPauseVideo
                                                    src={post.media_url}
                                                    className="w-full max-h-[250px] sm:max-h-[500px] object-contain"
                                                    onClick={() => showImage(post.media_url)}
                                                />
                                            ) : (
                                                <img
                                                    src={post.media_url}
                                                    alt="Post media"
                                                    onClick={() => showImage(post.media_url)}
                                                    className="w-full max-h-[250px] sm:max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Interaction Bar */}
                                    <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-50">
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={() => handleLike(post)}
                                                className={`flex items-center gap-2 group transition-all duration-300 ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                            >
                                                <div className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors group-hover:bg-red-50`}>
                                                    <HugeiconsIcon
                                                        icon={FavouriteIcon}
                                                        className={`w-5 h-5 transition-transform duration-300 group-active:scale-125 ${post.is_liked ? 'fill-current' : ''}`}
                                                    />
                                                </div>
                                                <span className="text-[14px] font-bold">{post.likes_count || 0}</span>
                                            </button>

                                            <button
                                                onClick={() => toggleComments(post.id)}
                                                className={`flex items-center gap-2 group transition-all ${activeCommentId === post.id ? 'text-[#ffc107]' : 'text-gray-500 hover:text-[#ffc107]'}`}
                                            >
                                                <div className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${activeCommentId === post.id ? 'bg-amber-50' : 'group-hover:bg-amber-50'}`}>
                                                    <HugeiconsIcon icon={Comment01Icon} className="w-5 h-5" />
                                                </div>
                                                <span className="text-[14px] font-bold">{post.comments_count || 0}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    {activeCommentId === post.id && (
                                        <div className="mt-2 border-t border-gray-50 pt-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {/* Comment List */}
                                            <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                                                {loadingComments[post.id] ? (
                                                    <div className="flex justify-center py-4">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ffc107]"></div>
                                                    </div>
                                                ) : commentsData[post.id]?.length > 0 ? (
                                                    commentsData[post.id].map(comment => (
                                                        <div key={comment.id} className="flex gap-3">
                                                            <Avatar
                                                                src={comment.author?.profile_picture}
                                                                name={comment.author?.display_name}
                                                                className="w-8 h-8 rounded-full shrink-0"
                                                            />
                                                            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2">
                                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-xs text-gray-900">{comment.author?.display_name}</span>
                                                                        <span className="text-[10px] text-gray-400 font-medium">{formatDate(comment.created_at)}</span>
                                                                    </div>
                                                                    {profile?.id === comment.user_id && (
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id, post.id)}
                                                                            className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={2.5} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-800 break-words">{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
                                                )}
                                            </div>

                                            {/* Comment Input */}
                                            <div className="flex gap-3 items-center">
                                                <Avatar
                                                    src={profile?.profile_picture}
                                                    name="You"
                                                    className="w-8 h-8 rounded-full shrink-0"
                                                />
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Write a comment..."
                                                        value={commentInputs[post.id] || ""}
                                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                                                        className="w-full bg-gray-100 rounded-full py-2 px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#ffc107]/20 border-transparent focus:border-[#ffc107] transition-all"
                                                    />
                                                    <button
                                                        onClick={() => handleCommentSubmit(post.id)}
                                                        disabled={!commentInputs[post.id]?.trim()}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ffc107] hover:text-[#ffca2c] font-bold text-sm px-2 disabled:opacity-50 transition-colors"
                                                    >
                                                        Post
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 px-6">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                            <HugeiconsIcon icon={Image01Icon} className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-black font-newyork text-gray-900">The hive is quiet</h3>
                        <p className="text-gray-500 font-bold mt-1 text-sm">Be the first to post!</p>
                    </div>
                )}
            </div>

            {/* View All Button */}
            <div className="flex justify-center mt-2">
                <Link href="/dashboard/feed" className="text-gray-800 font-bold text-sm hover:text-black hover:underline transition-all underline-offset-4 flex items-center gap-1 group">
                    View all feeds
                    <span className="group-hover:translate-x-1 duration-300">→</span>
                </Link>
            </div>
        </div>
    );
};

export default CampusFeeds;
