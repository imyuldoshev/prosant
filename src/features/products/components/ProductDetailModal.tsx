import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../../theme';
import { Product } from '../../../types';
import { SaleEntry } from '../../sales/mockData';
import { formatPrice, formatDate } from '../../../lib/format';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { router } from 'expo-router';
import { Droplet, Bath, Target, CornerUpRight, Component, Server, CircleDashed, X } from 'lucide-react-native';

interface ProductDetailModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  isAdmin?: boolean; // Mocked role
  soldEntries?: SaleEntry[];
  soldQuantity?: number;
  soldAmount?: number;
  onKirimQilish?: (productId: string) => void;
  onTahrirlash?: (productId: string) => void;
}

const getIconForProduct = (iconName: string, color: string, size: number = 48) => {
  const props = { color, size };
  switch (iconName) {
    case 'Droplet': return <Droplet {...props} />;
    case 'Bath': return <Bath {...props} />;
    case 'Target': return <Target {...props} />;
    case 'CornerUpRight': return <CornerUpRight {...props} />;
    case 'Component': return <Component {...props} />;
    case 'Server': return <Server {...props} />;
    case 'CircleDashed':
    default: return <CircleDashed {...props} />;
  }
};

export function ProductDetailModal({
  visible,
  onClose,
  product,
  isAdmin = true, // Default to admin for now
  soldEntries,
  soldQuantity,
  soldAmount,
  onKirimQilish,
  onTahrirlash,
}: ProductDetailModalProps) {
  const { colors, typography, radius, spacing } = useTheme();

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <View style={[styles.bottomSheet, { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.card }]}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.imageArea, { backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing.lg }]}>
            {getIconForProduct(product.rasm, colors.muted, 64)}
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 22, marginBottom: spacing.xs }]}>
            {product.nom}
          </Text>

          <View style={[styles.badgesRow, { marginBottom: spacing.md }]}>
            <Badge variant="neutral" label={product.category} />
            {product.joriyQoldiq === 0 ? (
              <Badge variant="danger" label="Tugagan" />
            ) : product.joriyQoldiq <= product.minimalQoldiq ? (
              <Badge variant="warning" label="Kam qoldi" />
            ) : null}
          </View>

          <Text style={[styles.price, { color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: 28, marginBottom: spacing.lg }]}>
            {formatPrice(product.sotuvNarxi)}
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border, marginBottom: spacing.lg }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted, fontFamily: typography.fontFamily.regular }]}>Qoldiq</Text>
              <Text style={[styles.infoValue, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>
                {product.joriyQoldiq} {product.birlik}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted, fontFamily: typography.fontFamily.regular }]}>Minimal qoldiq</Text>
              <Text style={[styles.infoValue, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>
                {product.minimalQoldiq} {product.birlik}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted, fontFamily: typography.fontFamily.regular }]}>Qo'shilgan sana</Text>
              <Text style={[styles.infoValue, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>
                {formatDate(product.qoshilganSana)}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted, fontFamily: typography.fontFamily.regular }]}>Oxirgi kirim</Text>
              <Text style={[styles.infoValue, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>
                {formatDate(product.oxirgiKirimSana)}
              </Text>
            </View>
            {isAdmin && (
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.infoLabel, { color: colors.muted, fontFamily: typography.fontFamily.regular, marginRight: 8 }]}>Tannarx</Text>
                  <Badge variant="neutral" label="Faqat admin" style={{ paddingHorizontal: 6, paddingVertical: 2 }} />
                </View>
                <Text style={[styles.infoValue, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}>
                  {formatPrice(product.tannarx)}
                </Text>
              </View>
            )}
          </View>

          {soldEntries && soldEntries.length > 0 && (
            <View style={[styles.salesSection, { marginBottom: spacing.lg }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, marginBottom: spacing.sm }]}>
                Bugungi sotuv
              </Text>
              <View style={[styles.salesSummary, { backgroundColor: colors.primary + '15', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium }}>Jami sotilgan:</Text>
                  <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>{soldQuantity} {product.birlik}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium }}>Jami summa:</Text>
                  <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>{formatPrice(soldAmount || 0)}</Text>
                </View>
              </View>
              
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, marginBottom: spacing.sm }}>Sotuv tarixi</Text>
              {soldEntries.map((entry, index) => {
                const time = new Date(entry.vaqt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                return (
                  <View key={index} style={[styles.saleEntry, { borderBottomColor: colors.border, borderBottomWidth: index < soldEntries.length - 1 ? 1 : 0 }]}>
                    <Text style={{ color: colors.text, fontFamily: typography.fontFamily.regular }}>{time}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold }}>{entry.miqdor} {product.birlik}</Text>
                      <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs }}>{formatPrice(entry.summa)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {isAdmin && (
            <View style={styles.actions}>
              <Button title="Kirim qilish" onPress={() => {
                onClose();
                if (onKirimQilish) onKirimQilish(product.id);
              }} style={{ marginBottom: spacing.sm }} />
              <Button title="Tahrirlash" onPress={() => {
                onClose();
                if (onTahrirlash) onTahrirlash(product.id);
              }} variant="secondary" />
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            <Button 
              title="Sotish" 
              onPress={() => {
                onClose();
                router.navigate({ pathname: '/(tabs)/sales', params: { addProductId: product.id } });
              }} 
              disabled={product.joriyQoldiq === 0} 
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    minHeight: '50%',
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
  content: {
    paddingBottom: 40,
  },
  imageArea: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  price: {
    textAlign: 'center',
  },
  infoCard: {
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
  },
  salesSection: {},
  sectionTitle: {},
  salesSummary: {},
  saleEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actions: {
    marginTop: 16,
  },
});
