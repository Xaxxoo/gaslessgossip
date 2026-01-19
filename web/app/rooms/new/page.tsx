"use client";

import { ArrowLeft } from "lucide-react";
import { ArrowRight } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/ui/Header";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { ApiResponse } from "@/types/api";
import { IRoomCategory } from "@/types/room";

export default function CreateRoomPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<30 | 60 | 120 | 240 | number>(60);
  const [type, setType] = useState<"public" | "paid" | "invite_only">("public");
  const [fee, setFee] = useState<number>(0);
  const [roomCategoryId, setRoomCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<IRoomCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  const [isDisposable, setIsDisposable] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get<ApiResponse<IRoomCategory[]>>("/room-categories");
        if (res.data.error) {
          toast.error(res.data.message || "Failed to load categories");
        } else {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching categories");
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCreateRoom = async () => {
    if (!name.trim()) return toast.error("Room name is required");
    if (!roomCategoryId) return toast.error("Select a room category");
    if (type === "paid" && fee <= 0) return toast.error("Enter a valid fee");

    try {
      setLoading(true);
      const payload = {
        name,
        photo,
        description,
        duration,
        type,
        fee,
        roomCategoryId,
        is_disposable: isDisposable,
        anonymous_mode: anonymousMode,
      };

      const res = await api.post<ApiResponse>("/rooms", payload);

      if (res.data.error) toast.error(res.data.message || "Failed to create room");
      else {
        toast.success(res.data.message || "Room created successfully");
        router.push("/rooms");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-14">
      <Header />
      <div className="bg-[#121418] text-white">
        <section className="max-w-3xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-normal">Create New Room</h1>
          </div>

          <div className="space-y-12">
            {/* Room Name */}
            <div>
              <label className="block text-light-teal font-fredoka mb-3">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "MaskedParrot88"'
                className="w-full bg-transparent border border-[#1A2221] rounded-2xl px-6 py-3.5 text-dark-grey placeholder:text-dark-grey focus:outline-none focus:border-2 focus:border-[#1A2221] transition-colors"
              />
            </div>

            {/* Room Photo */}
            <div>
              <label className="block text-light-teal font-fredoka mb-3">Photo URL</label>
              <input
                type="text"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="Optional image URL"
                className="w-full bg-transparent border border-[#1A2221] rounded-2xl px-6 py-3.5 text-dark-grey placeholder:text-dark-grey focus:outline-none focus:border-2 focus:border-[#1A2221] transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-light-teal font-fredoka mb-3">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full bg-transparent border border-[#1A2221] rounded-2xl px-6 py-3.5 text-dark-grey placeholder:text-dark-grey focus:outline-none focus:border-2 focus:border-[#1A2221] transition-colors resize-none"
                rows={3}
              />
            </div>

            {/* Room Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setIsDisposable(!isDisposable)}
                className={`${isDisposable ? "bg-dark-teal" : "bg-[#1A1D22]"} flex items-center justify-between px-6 py-4 rounded-2xl transition-colors group`}
              >
                <div className="text-left">
                  <span className="text-dark-white block">Disposable Room</span>
                  <span className="text-[10px] text-gray-500">Auto-deletes after duration</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 border-teal-600 flex items-center justify-center transition-all ${isDisposable ? "border-teal-300 border-2" : "border-gray-600 group-hover:border-gray-500"}`}>
                  {isDisposable && <div className="w-5 h-5 rounded-full bg-[#14F1D9]" />}
                </div>
              </button>

              <button
                onClick={() => setAnonymousMode(!anonymousMode)}
                className={`${anonymousMode ? "bg-dark-teal" : "bg-[#1A1D22]"} flex items-center justify-between px-6 py-4 rounded-2xl transition-colors group`}
              >
                <div className="text-left">
                  <span className="text-dark-white block">Anonymous Mode</span>
                  <span className="text-[10px] text-gray-500">Hide sender identities</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 border-teal-600 flex items-center justify-center transition-all ${anonymousMode ? "border-teal-300 border-2" : "border-gray-600 group-hover:border-gray-500"}`}>
                  {anonymousMode && <div className="w-5 h-5 rounded-full bg-[#14F1D9]" />}
                </div>
              </button>
            </div>

            {/* Room Category */}
            <div>
              <label className="block text-light-teal font-fredoka mb-3">Room Category</label>
              {fetchingCategories ? (
                <p className="text-gray-400">Loading categories...</p>
              ) : (
                <select
                  value={roomCategoryId ?? ""}
                  onChange={(e) => setRoomCategoryId(Number(e.target.value))}
                  className="w-full bg-[#121418] border border-[#1A2221] rounded-2xl px-6 py-3.5 text-dark-white focus:outline-none focus:border-2 focus:border-[#1A2221] transition-colors"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-light-teal font-fredoka mb-3">Open For</label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "30 min", value: 30 },
                  { label: "1 hour", value: 60 },
                  { label: "2 hours", value: 120 },
                  { label: "4 hours", value: 240 },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDuration(option.value)}
                    className={`py-3.5 rounded-xl border border-[#1A2221] transition-colors ${duration === option.value ? "bg-dark-teal text-grey-100" : "bg-transparent text-gray-400 hover:border-gray-600"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Access Type */}
            <div>
              <label className="block text-light-teal font-fredoka mb-3">Access</label>
              <div className="space-y-2">
                {[
                  { label: "Open", value: "public" },
                  { label: "Token-gated", value: "paid" },
                  { label: "Invite-only", value: "invite_only" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setType(option.value as any)}
                    className={`${option.value === type ? "bg-dark-teal" : "bg-[#1A1D22]"} w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-colors group`}
                  >
                    <span className="text-dark-white capitalize">{option.label}</span>
                    <div className={`w-6 h-6 rounded-full border-2 border-teal-600 flex items-center justify-center transition-all ${type === option.value ? "border-teal-300 border-2" : "border-gray-600 group-hover:border-gray-500"}`}>
                      {type === option.value && <div className="w-5 h-5 rounded-full bg-[#14F1D9]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fee input */}
            {type === "paid" && (
              <div>
                <label className="block text-light-teal font-fredoka mb-3">Room Fee</label>
                <input
                  type="number"
                  min={0}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  placeholder="Enter room fee"
                  className="w-full bg-transparent border border-[#1A2221] rounded-2xl px-6 py-3.5 text-dark-grey placeholder:text-dark-grey focus:outline-none focus:border-2 focus:border-[#1A2221] transition-colors"
                />
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="flex justify-end mt-16 pb-44">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="flex items-center font-fredoka gap-3 px-12 py-4 glass-effect__dark text-[#14F1D9] rounded-full hover:bg-[#14F1D9]/10 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Creating..." : "Create Room"}</span>
              <ArrowRight className="text-dark-white w-7 h-7" />
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
