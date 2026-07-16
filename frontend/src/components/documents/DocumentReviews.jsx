import React, { useState, useEffect } from "react";
import { Star, Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDocumentReviews, submitDocumentReview } from "@/api/documentApi";
import axiosClient from "@/api/axiosClient";

export default function DocumentReviews({ documentId, uploadedById }) {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // State cho form
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const res = await getDocumentReviews(documentId);
            setReviews(res.data.data || []);
        } catch (error) {
            console.error("Error when loading reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            fetchReviews();
        }
    }, [documentId]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const cachedId = localStorage.getItem("userId");
                if (cachedId) {
                    setCurrentUserId(cachedId);
                    return;
                }
                const res = await axiosClient.get("/api/profile");
                if (res.data?.id) {
                    setCurrentUserId(res.data.id);
                    localStorage.setItem("userId", res.data.id);
                }
            } catch (err) {
                console.error("Failed to fetch profile in DocumentReviews:", err);
            }
        };
        fetchUserProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select stars to rate!");
            return;
        }

        try {
            setIsSubmitting(true);
            await submitDocumentReview(documentId, { rating, comment });
            toast.success("Thank you for your feedback!");

            setRating(0);
            setComment("");
            fetchReviews();
        } catch (error) {
            toast.error("Failed to submit review, please try again!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
        : "0.0";

    return (
        <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#f26522]" />
                Document Reviews
            </h3>

            {/* RATING SUMMARY BLOCK */}
            {totalReviews > 0 && (
                <div className="flex items-center gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-8">
                    <div className="text-center bg-[#f26522]/5 px-5 py-4 rounded-xl min-w-[100px]">
                        <div className="text-4xl font-extrabold text-[#f26522]">{averageRating}</div>
                        <div className="text-[10px] font-bold text-[#f26522]/85 uppercase tracking-wider mt-1">Rating</div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-5 h-5 ${
                                        star <= Math.round(Number(averageRating))
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slate-200"
                                    }`}
                                />
                            ))}
                            <span className="text-sm font-semibold text-slate-700 ml-2">
                                Average Rating
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Based on <span className="font-bold text-slate-700">{totalReviews}</span> global {totalReviews === 1 ? "review" : "reviews"}
                        </p>
                    </div>
                </div>
            )}

            {/* FORM GỬI ĐÁNH GIÁ */}
            {currentUserId && uploadedById && currentUserId === uploadedById ? (
                <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl mb-8 text-center text-orange-800 text-sm font-medium flex items-center justify-center gap-2">
                    <span>💡 You cannot review your own document.</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">How many stars do you rate this document?</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slate-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                <div className="mb-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 500))}
                        maxLength={500}
                        placeholder="Share your thoughts about this document (optional)..."
                        className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f26522]/50 resize-none h-24 break-all overflow-y-auto"
                    />
                </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 bg-[#f26522] hover:bg-[#d95316] text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        Submit Review
                    </button>
                </form>
            )}

            {/* Reviews List */}
            <div>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#f26522]" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No reviews yet. Be the first to review this document!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div key={rev.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-bold text-slate-800">{rev.userName || "Anonymous User"}</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(rev.createdAt).toLocaleDateString("en-US")}
                                    </span>
                                </div>
                                <div className="flex gap-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                                {rev.comment && <p className="text-slate-600 text-sm">{rev.comment}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}