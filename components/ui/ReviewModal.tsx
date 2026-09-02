import { useState } from 'react';
import {
  Modal as RNModal,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase/client';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  orderId,
  reviewerId,
  revieweeId,
  listingId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .eq('reviewer_id', reviewerId)
        .single();

      if (existingReview) {
        setError('You have already reviewed this order');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('reviews').insert({
        order_id: orderId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        listing_id: listingId,
        rating,
        comment: comment.trim(),
      });

      if (insertError) {
        setError('Failed to submit review');
      } else {
        onSuccess();
        onClose();
        setRating(5);
        setComment('');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>
              Leave a Review
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          {/* Star rating */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Rating
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={{ padding: 2 }}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Comment */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: '#1F2937',
                minHeight: 80,
              }}
            />
          </View>

          {/* Error */}
          {error ? (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={{
                flex: 1,
                backgroundColor: submitting ? '#93C5C8' : '#007782',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  Submit Review
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#374151', fontWeight: '700', fontSize: 15 }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
}
