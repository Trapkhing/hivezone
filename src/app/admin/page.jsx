"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    UserGroupIcon,
    Briefcase02Icon,
    BankIcon,
    AlertIcon,
    ArrowRight01Icon,
    PlusSignIcon
} from "@hugeicons/core-free-icons";

export default function AdminDashboard() {
    const stats = [
        { label: "Total Users", value: "1,284", icon: UserGroupIcon, color: "bg-blue-50 text-blue-600" },
        { label: "Active Internships", value: "24", icon: Briefcase02Icon, color: "bg-purple-50 text-purple-600" },
        { label: "Scholarships", value: "15", icon: BankIcon, color: "bg-green-50 text-green-600" },
        { label: "Unresolved Reports", value: "8", icon: AlertIcon, color: "bg-red-50 text-red-600" },
    ];

    const recentActivities = [
        { date: "2 mins ago", user: "John Doe", activity: "reported a gig for spam", status: "pending" },
        { date: "1 hour ago", user: "Sarah Smith", activity: "applied for Paystack Internship", status: "processed" },
        { date: "3 hours ago", user: "Admin", activity: "added new MTN Scholarship", status: "completed" },
    ];

    return (
        <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <HugeiconsIcon icon={stat.icon} className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-zinc-500 font-bold text-sm tracking-tight">{stat.label}</p>
                            <h3 className="text-3xl font-black font-newyork mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-xl font-black font-newyork">Recent Activity</h3>
                        <button className="text-[#ffc107] font-black text-sm flex items-center gap-1">
                            View all <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {recentActivities.map((activity, idx) => (
                            <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-black">
                                        {activity.user.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">
                                            <span className="text-black">{activity.user}</span>
                                            <span className="text-zinc-500 font-medium"> {activity.activity}</span>
                                        </p>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{activity.date}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${activity.status === 'pending' ? 'bg-red-50 text-red-600' :
                                        activity.status === 'processed' ? 'bg-blue-50 text-blue-600' :
                                            'bg-green-50 text-green-600'
                                    }`}>
                                    {activity.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col gap-6">
                    <h3 className="text-xl font-black font-newyork mb-2">Quick Actions</h3>
                    <div className="space-y-4">
                        <button className="w-full bg-[#ffc107] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                            <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5" />
                            Add Internship
                        </button>
                        <button className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                            <HugeiconsIcon icon={PlusSignIcon} className="w-5 h-5" />
                            Add Scholarship
                        </button>
                        <button className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                            <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                            User Management
                        </button>
                    </div>
                    <div className="mt-auto pt-6 border-t border-zinc-700">
                        <p className="text-zinc-400 text-xs font-medium">System Version: v1.0.4-beta</p>
                        <p className="text-zinc-400 text-xs font-medium">Environment: Production</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
