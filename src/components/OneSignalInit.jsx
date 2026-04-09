"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { initOneSignal, loginOneSignal, logoutOneSignal } from "@/utils/OneSignalNative";
import { clearAllUserCache } from "@/components/providers/QueryProvider";

export default function OneSignalInit() {
    useEffect(() => {
        const supabase = createClient();
        let lastUserId = null;

        const initOneSignalUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await initOneSignal();
            if (session?.user?.id) {
                lastUserId = session.user.id;
                try { await loginOneSignal(session.user.id); } catch (e) { }
            }
        };

        initOneSignalUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user?.id) {
                    // Different user signed in — clear previous user's cache
                    if (lastUserId && lastUserId !== session.user.id) {
                        await clearAllUserCache();
                    }
                    lastUserId = session.user.id;
                    try { await loginOneSignal(session.user.id); } catch (e) { }
                } else if (event === 'SIGNED_OUT') {
                    lastUserId = null;
                    await clearAllUserCache();
                    try { await logoutOneSignal(); } catch (e) { }
                }
            }
        );

        return () => { authListener?.subscription.unsubscribe(); };
    }, []);

    return null;
}
