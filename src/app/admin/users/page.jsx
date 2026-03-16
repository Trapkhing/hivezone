"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    SentIcon,
    Tick02Icon,
    Cancel01Icon
} from "@hugeicons/core-free-icons";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function UsersTableContent() {
    const searchParams = useSearchParams();
    const routerParams = searchParams.get('q') || "";
    const statusFilter = searchParams.get('status') || "all";
    const yearFilter = searchParams.get('year') || "all";
    const programmeFilter = searchParams.get('programme') || "all";
    const genderFilter = searchParams.get('gender') || "all";

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;
    const supabase = createClient();

    // Reset to page 1 when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [routerParams, statusFilter, yearFilter, programmeFilter, genderFilter]);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, routerParams, statusFilter, yearFilter, programmeFilter, genderFilter]);

    // Handle refetch from layout
    useEffect(() => {
        const handleRefetch = () => fetchUsers();
        window.addEventListener('refetch-users', handleRefetch);
        return () => window.removeEventListener('refetch-users', handleRefetch);
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('users')
                .select('*', { count: 'exact' });

            // Search Filter
            if (routerParams) {
                query = query.or(`display_name.ilike.%${routerParams}%,username.ilike.%${routerParams}%,student_id.ilike.%${routerParams}%,contact.ilike.%${routerParams}%`);
            }

            // Status Filter
            if (statusFilter === 'verified') {
                query = query.eq('email_verified', true);
            } else if (statusFilter === 'unverified') {
                query = query.eq('email_verified', false);
            }

            // Year Filter
            if (yearFilter !== 'all') {
                query = query.ilike('year_of_study', `%${yearFilter}%`);
            }

            // Programme Filter
            if (programmeFilter !== 'all') {
                query = query.ilike('programme', `%${programmeFilter}%`);
            }

            // Gender Filter
            if (genderFilter !== 'all') {
                query = query.eq('gender', genderFilter);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;
            setUsers(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Users Table Card */}
            <div className="bg-white rounded-none flex-1 flex flex-col overflow-hidden shadow-sm border border-gray-100 min-h-0">
                <div className="overflow-x-auto h-full flex flex-col scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr>
                                <th className="px-8 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                    Users {totalCount > 0 && <span className="ml-1 text-[#ffc107]">({totalCount.toLocaleString()})</span>}
                                </th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Status</th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Student ID</th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Programme</th>
                                <th className="px-6 py-6 text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Year</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 overflow-y-auto">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-8 py-5"><div className="h-10 w-40 bg-gray-100 rounded-full"></div></td>
                                        <td className="px-6 py-5"><div className="h-5 w-5 bg-gray-100 rounded-full"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-20 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-40 bg-gray-100 rounded-lg"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-16 bg-gray-100 rounded-lg"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-medium font-newyork text-xl">
                                        The hive is quiet. No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    name={user.display_name}
                                                    className="w-10 h-10 rounded-full border border-gray-100"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">
                                                        {user.display_name}
                                                    </span>
                                                    {user.contact && (
                                                        <div className="flex items-center gap-2 group/phone mt-0.5">
                                                            <span className="text-[10px] font-bold text-gray-400">{user.contact}</span>
                                                                    <Link
                                                                        href={`/admin/contacts/send?phone=${encodeURIComponent(user.contact)}&name=${encodeURIComponent(user.display_name)}`}
                                                                        className="opacity-0 group-hover/phone:opacity-100 transition-opacity p-0.5 hover:bg-yellow-50 rounded text-yellow-600"
                                                                title="Send SMS"
                                                            >
                                                                <HugeiconsIcon icon={SentIcon} className="w-2.5 h-2.5" />
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.email_verified ? (
                                                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-green-50/50 border border-green-100 text-green-600">
                                                    <HugeiconsIcon icon={Tick02Icon} className="w-5 h-5" variant="standard" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50/50 border border-red-100 text-red-400">
                                                    <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" variant="standard" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-600">
                                                {user.student_id || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-600 truncate max-w-[200px] block">
                                                {user.programme || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-gray-600">
                                                {user.year_of_study || "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-white border-t border-gray-50 flex items-center justify-center gap-4 shrink-0 mt-auto">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${currentPage === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        {Array.from({ length: totalPages }).slice(
                            Math.max(0, Math.min(currentPage - 3, totalPages - 5)),
                            Math.min(totalPages, Math.max(5, currentPage + 2))
                        ).map((_, idx) => {
                            const pageNum = totalPages > 5 
                                ? Math.max(0, Math.min(currentPage - 3, totalPages - 5)) + idx + 1
                                : idx + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${currentPage === totalPages ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-none border border-gray-100">
                <div className="w-10 h-10 border-4 border-[#ffc107]/30 border-t-[#ffc107] rounded-full animate-spin" />
            </div>
        }>
            <UsersTableContent />
        </Suspense>
    );
}
