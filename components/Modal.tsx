import { Modal as RNModal, View, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function Modal({ visible, onClose, title, children, scrollable = true }: ModalProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          {title && (
            <View style={styles.titleRow}>
              <View style={styles.handle} />
              <View />
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {scrollable ? (
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={styles.body}>{children}</View>
        )}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
  },
  body: {
    padding: 20,
  },
});
