"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    CheckmarkBadge01Icon,
    ChampionIcon 
} from "@hugeicons/core-free-icons";

/**
 * UserBadge Component
 * Displays verified or admin badges for users.
 * 
 * @param {Object} props
 * @param {boolean} props.isAdmin - Whether the user is an admin
 * @param {boolean} props.isVerified - Whether the user is verified
 * @param {string} props.size - Size of the badge ('sm', 'md', 'lg')
 * @param {string} props.className - Additional classes
 */
export default function UserBadge({ isAdmin, isVerified, size = "md", className = "" }) {
    const sizeMap = {
        sm: "w-3.5 h-3.5",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    const iconSize = sizeMap[size] || sizeMap.md;

    if (!isAdmin && !isVerified) return null;

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {isAdmin && (
                <div className="relative group transition-transform active:scale-95 cursor-help" title="HiveZone Administrator">
                    <HugeiconsIcon 
                        icon={CheckmarkBadge01Icon} 
                        className={`${iconSize} text-amber-500`} 
                        strokeWidth={2.5} 
                    />                        
                </div>
            )}
            {isVerified && !isAdmin && (
                <HugeiconsIcon 
                    icon={CheckmarkBadge01Icon} 
                    className={`${iconSize} text-green-500 shrink-0`} 
                    strokeWidth={2.5} 
                />
            )}
        </div>
    );
}
