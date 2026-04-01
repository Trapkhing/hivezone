"use client";

import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';

export const CapacitorInit = () => {
    useEffect(() => {
        const initCapacitor = async () => {
            if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
                try {
                    // Set status bar to overlay the Webview
                    await StatusBar.setOverlaysWebView({ overlay: true });
                } catch (e) {
                    console.error('CapacitorInit: Error initializing StatusBar', e);
                }
            }
        };

        initCapacitor();
    }, []);

    return null;
};

export default CapacitorInit;
