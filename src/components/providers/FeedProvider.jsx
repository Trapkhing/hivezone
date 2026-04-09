"use client";

import React, { createContext, useContext, useState } from 'react';
import { getProfileFromDisk, saveProfileToDisk } from './QueryProvider';

const FeedContext = createContext();

export const useFeed = () => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error('useFeed must be used within a FeedProvider');
    }
    return context;
};

export const FeedProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [scrollPosition, setScrollPosition] = useState(0);
    
    const [pageProfile, setPageProfileState] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);

    // Securely hydrate profile from disk on mount (client-side only)
    React.useEffect(() => {
        setHasMounted(true);
        const stored = getProfileFromDisk();
        if (stored) {
            // Only use disk cache if it belongs to the current session
            import('@/utils/supabase/client').then(({ createClient }) => {
                const supabase = createClient();
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user?.id && stored.id === session.user.id) {
                        setPageProfileState(stored);
                    } else if (session?.user?.id && stored.id !== session.user.id) {
                        // Different user — clear stale disk cache
                        localStorage.removeItem('HIVEZONE_USER_IDENTITY');
                    }
                });
            });
        }
    }, []);

    const setPageProfile = (profile) => {
        setPageProfileState(profile);
        saveProfileToDisk(profile);
    };

    const resetFeed = () => {
        setPosts([]);
        setPage(0);
        setHasMore(true);
        setScrollPosition(0);
    };

    // Return empty provider values until the client has mounted to avoid hydration mismatch
    const contextValue = {
        posts, setPosts,
        page, setPage,
        hasMore, setHasMore,
        activeTab, setActiveTab,
        scrollPosition, setScrollPosition,
        pageProfile: hasMounted ? pageProfile : null,
        setPageProfile,
        resetFeed
    };

    return (
        <FeedContext.Provider value={contextValue}>
            {children}
        </FeedContext.Provider>
    );
};
