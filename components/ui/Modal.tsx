import { Modal as RNModal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 380,
  md: 480,
  lg: 640,
  xl: 800,
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
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
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        <View
          style={{
            width: '100%',
            maxWidth: sizeMap[size],
            maxHeight: '90%',
            backgroundColor: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          {title && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={{
                  padding: 6,
                  borderRadius: 8,
                }}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={{ padding: 16 }}
            contentContainerStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}
