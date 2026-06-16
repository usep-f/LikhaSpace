import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { Order } from '@/lib/mockGigs';
import { submitReviewTransaction } from '@/lib/contract';
import { useNotification } from '@/context/NotificationContext';
import { updateOrderStatus, getGig, updateGig } from '@/lib/db';

interface ReviewModalProps {
  order: Order;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ order, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotification();

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitReviewTransaction(order.clientAddress, order.freelancerAddress, rating, reviewText);
      // Optional: Add to order document
      await updateOrderStatus(order.id, {
        review: {
          rating,
          text: reviewText
        }
      });

      // Update gig with new rating average
      const gigDoc = await getGig(order.gigId);
      if (gigDoc) {
        const oldReviewsCount = gigDoc.reviewsCount || 0;
        const oldRating = gigDoc.rating || 0;
        const newReviewsCount = oldReviewsCount + 1;
        const newRating = Number(((oldRating * oldReviewsCount + rating) / newReviewsCount).toFixed(1));
        
        await updateGig(order.gigId, {
          rating: newRating,
          reviewsCount: newReviewsCount
        });
      }

      showToast('Review submitted successfully!', 'success');
      onReviewSubmitted();
    } catch (e: unknown) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      showToast(errorMsg || 'Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-violet-dark border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-white">Leave a Review</h2>
            <p className="text-xs text-gray-400 mt-1">Rate your experience with the freelancer</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors self-start cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neoncyan rounded-full"
                >
                  <Star
                    className={`w-8 h-8 transition-colors duration-200 ${
                      (hoveredRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-500 hover:text-yellow-400/50'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Written Testimonial</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Describe your experience working with this freelancer..."
              className="w-full bg-obsidian border border-white/10 rounded-lg p-3 text-sm text-white resize-none h-32 focus:outline-none focus:border-neoncyan transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className={`w-full py-3 rounded-lg font-heading font-bold text-sm uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
              isSubmitting || rating === 0
                ? 'bg-neoncyan/50 text-obsidian/50 cursor-not-allowed'
                : 'bg-neoncyan text-obsidian hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
