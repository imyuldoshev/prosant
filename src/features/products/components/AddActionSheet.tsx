import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../../theme';
import { PackagePlus, ArrowDownCircle, X } from 'lucide-react-native';

interface AddActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onNewProduct: () => void;
  onArrival: () => void;
}

export function AddActionSheet({ visible, onClose, onNewProduct, onArrival }: AddActionSheetProps) {
  const { colors, typography, radius, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <View style={[styles.sheet, { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.card }]}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border }]}
            onPress={onNewProduct}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <PackagePlus size={24} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>Yangi mahsulot</Text>
              <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fontFamily.regular }]}>Bazada yo'q yangi tovar</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border, marginTop: spacing.md }]}
            onPress={onArrival}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${colors.status.green}20` }]}>
              <ArrowDownCircle size={24} color={colors.status.green} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>Kirim qilish</Text>
              <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fontFamily.regular }]}>Mavjud mahsulotga tovar keldi</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
});
