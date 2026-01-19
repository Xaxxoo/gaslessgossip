"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedId: number;
  reportedUsername: string;
  roomId?: number;
}

export default function ReportModal({ isOpen, onClose, reportedId, reportedUsername, roomId }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/reports", { reportedId, reason, roomId });
      if (res.data.error) {
        toast.error(res.data.message || "Failed to submit report");
      } else {
        toast.success("Report submitted successfully");
        setReason("");
        onClose();
      }
    } catch (err) {
      toast.error("An error occurred while submitting the report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-zinc-900 p-6 border border-teal-500/30">
          <DialogTitle className="text-xl font-bold text-white font-fredoka mb-4">
            Report {reportedUsername}
          </DialogTitle>
          <p className="text-gray-400 text-sm mb-4">
            Please explain why you are reporting this user. Our team will review it.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-32 bg-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 mb-6 resize-none"
            placeholder="Describe the issue..."
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
