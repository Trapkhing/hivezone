"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    AlertIcon,
    Delete02Icon,
    CheckListIcon,
    Search01Icon,
    MoreHorizontalIcon,
    ViewIcon,
    Megaphone03Icon,
    Loading03Icon
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { useUI } from "@/components/ui/UIProvider";

export default function ReportsManagement() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();
    const { showToast, confirmAction } = useUI();

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    reporter:users!reporter_id (
                        display_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error("Error fetching reports:", error);
            showToast("Failed to load reports.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', reportId);

            if (error) throw error;

            setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
            showToast(`Report marked as ${newStatus}.`);
        } catch (error) {
            console.error("Error updating report status:", error);
            showToast("Failed to update status.", "error");
        }
    };

    const handleDismissReport = async (reportId) => {
        const confirmed = await confirmAction({
            title: "Dismiss Report?",
            message: "This will mark the report as dismissed without taking further action.",
            confirmText: "Dismiss",
            type: "warning"
        });

        if (confirmed) {
            handleStatusUpdate(reportId, 'dismissed');
        }
    };

    const handleDeleteContent = async (report) => {
        const confirmed = await confirmAction({
            title: `Delete Reported ${report.item_type === 'gig' ? 'Gig' : 'Post'}?`,
            message: `This will permanently remove the reported ${report.item_type} and mark the report as resolved.`,
            confirmText: "Delete Content",
            type: "danger"
        });

        if (!confirmed) return;

        try {
            const table = report.item_type === 'gig' ? 'gigs' : 'feeds';

            // 1. Delete the content
            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('id', report.item_id);

            if (deleteError) throw deleteError;

            // 2. Resolve the report
            await handleStatusUpdate(report.id, 'resolved');

            showToast("Content deleted and report resolved.");
        } catch (error) {
            console.error("Error deleting content:", error);
            showToast("Failed to delete content.", "error");
        }
    };

    const filteredReports = reports.filter(r =>
        r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reporter?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.item_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header info */}
            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-red-500 shrink-0">
                    <HugeiconsIcon icon={AlertIcon} className="w-8 h-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black font-newyork text-red-950">Safety Reports</h3>
                    <p className="text-red-800/70 font-medium">Review and take action on reported content to maintain campus safety.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search reports..."
                        className="w-full bg-white border border-red-100 rounded-xl py-3 px-10 text-sm font-bold shadow-sm outline-none focus:border-red-300 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 gap-3">
                        <HugeiconsIcon icon={Loading03Icon} className="w-10 h-10 animate-spin" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">Loading reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                            <HugeiconsIcon icon={CheckListIcon} className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-sm">No reports found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="px-8 py-5 text-zinc-500 font-black text-xs uppercase tracking-widest">Reported Content</th>
                                    <th className="px-8 py-5 text-zinc-500 font-black text-xs uppercase tracking-widest">Reason</th>
                                    <th className="px-8 py-5 text-zinc-500 font-black text-xs uppercase tracking-widest">Reporter</th>
                                    <th className="px-8 py-5 text-zinc-500 font-black text-xs uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-zinc-500 font-black text-xs uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.item_type === 'gig' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    <HugeiconsIcon icon={report.item_type === 'gig' ? Megaphone03Icon : ViewIcon} className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm break-all max-w-[200px] truncate" title={report.item_id}>
                                                        {report.item_type === 'gig' ? 'Gig Listing' : 'Feed Post'}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">#{report.item_id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-red-600 bg-red-50/50 px-2 py-1 rounded-lg inline-block w-fit">
                                                    {report.reason}
                                                </span>
                                                {report.details && (
                                                    <p className="text-[11px] text-zinc-500 font-medium italic truncate max-w-[200px]" title={report.details}>
                                                        "{report.details}"
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div>
                                                <p className="font-bold text-sm text-zinc-800">{report.reporter?.display_name || 'Unknown User'}</p>
                                                <p className="text-[10px] font-bold text-zinc-400">{new Date(report.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'bg-zinc-100 text-zinc-600' :
                                                report.status === 'resolved' ? 'bg-green-50 text-green-600' :
                                                    report.status === 'dismissed' ? 'bg-gray-100 text-zinc-400' :
                                                        'bg-blue-50 text-blue-600'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                {report.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                                                        className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                                        title="Mark as Reviewed"
                                                    >
                                                        <HugeiconsIcon icon={ViewIcon} className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDismissReport(report.id)}
                                                    className="p-2 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                                                    title="Dismiss Report"
                                                >
                                                    <HugeiconsIcon icon={CheckListIcon} className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContent(report)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Delete Content & Resolve"
                                                >
                                                    <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
