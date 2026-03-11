"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowLeft01Icon,
    Add01Icon
} from "@hugeicons/core-free-icons";
import StudyCircleSidebar from "@/components/dashboard/StudyCircleSidebar";

export default function StudyCirclesLayout({ children }) {
    const params = useParams();
    const pathname = usePathname();
    const activeId = params?.id;

    // Check if we are on the join page or edit page to handle layout differently if needed
    const isSpecialPage = pathname.includes("/join") || pathname.includes("/edit") || pathname.includes("/create");

    if (isSpecialPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] md:min-h-[750px] bg-white md:bg-[#fcf6de] md:px-4 sm:px-8 md:gap-4 max-w-[1400px] mx-auto w-full md:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mt-2 md:mt-4 px-4 md:px-0 shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-700" />
                    </Link>
                    <h1 className="text-3xl font-black tracking-wide font-newyork text-gray-900 hidden sm:block">
                        Study Circles
                    </h1>
                </div>
                <Link
                    href="/dashboard/study-circles/create"
                    className="bg-black text-white hover:bg-gray-800 font-bold text-[13px] px-5 py-2.5 rounded-full transition-colors active:scale-95 shadow-sm flex items-center gap-2"
                >
                    <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                    Create Circle
                </Link>
            </div>

            {/* Side-by-Side Container */}
            <div className="bg-white md:rounded-[2rem] md:shadow-sm md:border border-gray-100 flex flex-1 overflow-hidden relative mt-2 md:mt-0">
                <StudyCircleSidebar activeId={activeId} isMobileVisible={!activeId} />

                {/* Main Content Area (Right Panel) */}
                <div className={`flex-1 flex flex-col bg-[#fbf9f1] h-full overflow-hidden ${activeId ? 'fixed inset-0 z-[60] md:relative md:z-20' : 'hidden md:flex'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
