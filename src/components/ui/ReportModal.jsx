"use client";

import React, { useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import CustomDropdown from "@/components/CustomDropdown";

const REPORT_REASONS = [
    "Spam",
    "Harassment",
    "Inappropriate Content",
    "Scam or Fraud",
    "Misleading Information",
    "Other"
];

const ReportModal = ({ item_id, item_type, onClose, onSuccess, showToast }) => {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return;

        setIsSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('reports')
                .insert([{
                    reporter_id: session.user.id,
                    item_id,
                    item_type,
                    reason,
                    details: details || null,
                    status: 'pending'
                }]);

            if (error) throw error;

            showToast("Report submitted. Thank you for keeping HiveZone safe!");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Error submitting report:", error);
            showToast("Failed to submit report. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-6 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md border-2 border-[#ffc107]/40 rounded-[2rem] px-6 py-10 space-y-6 bg-[#f5f5f5]"
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <h2 className="text-2xl text-black font-bold font-manyto">Report Content</h2>
                    <p className="text-sm text-zinc-500 mt-1">Help us keep HiveZone safe for everyone.</p>
                </div>

                <form onSubmit={handleSubmit} className="text-black space-y-5">
                    {/* Reason Dropdown */}
                    <CustomDropdown
                        label="Reason for reporting"
                        options={REPORT_REASONS}
                        value={reason}
                        onChange={setReason}
                        placeholder="Choose a reason..."
                    />

                    {/* Details */}
                    <div>
                        <label className="block text-black text-sm font-semibold mb-2">
                            Additional details <span className="text-zinc-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Any additional context..."
                            rows={4}
                            className="w-full bg-white border border-zinc-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#ffc107] transition-colors resize-none placeholder:text-zinc-400 text-zinc-900"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason}
                            className="w-full bg-[#ffc107] text-black font-semibold text-base py-3 flex items-center justify-center gap-2 hover:bg-[#ffca2c] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting && (
                                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            )}
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full text-sm font-semibold text-zinc-500 py-2 hover:text-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
