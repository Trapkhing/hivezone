"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function OneSignalInit() {
    const supabase = createClient();

    useEffect(() => {
        const initOneSignalUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                if (window.OneSignalDeferred) {
                    window.OneSignalDeferred.push(async function (OneSignal) {
                        try {
                            await OneSignal.login(session.user.id);
                            // Prompt the user to subscribe if they haven't already
                            await OneSignal.Slidedown.promptPush();
                        } catch (e) {
                            console.error("OneSignal login error:", e);
                        }
                    });
                }
            }
        };

        initOneSignalUser();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (window.OneSignalDeferred) {
                    if (event === 'SIGNED_IN' && session?.user?.id) {
                        window.OneSignalDeferred.push(async function (OneSignal) {
                            await OneSignal.login(session.user.id);
                        });
                    } else if (event === 'SIGNED_OUT') {
                        window.OneSignalDeferred.push(async function (OneSignal) {
                            await OneSignal.logout();
                        });
                    }
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase]);

    return null;
}
