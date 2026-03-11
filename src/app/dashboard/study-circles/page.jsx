"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export default function StudyCirclesPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                <HugeiconsIcon icon={InformationCircleIcon} className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Select a Study Circle</h2>
            <p className="text-gray-500 max-w-sm font-medium">
                Choose a circle from the list or join a new one from the discover tab to start chatting with your peers.
            </p>
        </div>
    );
}
