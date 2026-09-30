import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../../types';
import { useTheme } from '../../../theme';
import { formatPrice } from '../../../lib/format';
import { Minus, Plus, Trash2, CircleDashed, Droplet, Bath, Target, CornerUpRight, Component, Server } from 'lucide-react-native';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const getIcon = (name: string, color: string, size: number) => {
  const p = { color, size };
  switch (name) {
    case 'Droplet': return <Droplet {...p} />;
    case 'Bath': return <Bath {...p} />;
    case 'Target': return <Target {...p} />;
    case 'CornerUpRight': return <CornerUpRight {...p} />;
    case 'Component': return <Component {...p} />;
    case 'Server': return <Server {...p} />;
    default: return <CircleDashed {...p} />;
  }
};

export const CartItemRow: React.FC<Props> = ({ item, onIncrease, onDecrease, onRemove }) => {
  const { colors, typography, radius, spacing } = useTheme();
  
  const total = item.product.sotuvNarxi * item.quantity;
  const isMaxReached = item.quantity >= item.product.joriyQoldiq;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.md }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
          {getIcon(item.product.rasm, colors.primary, 24)}
        </View>
        <View style={styles.info}>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }} numberOfLines={2}>
            {item.product.nom}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm }}>
            {formatPrice(item.product.sotuvNarxi)} / {item.product.birlik}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Trash2 size={20} color={colors.status.red} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
        <View>
          <View style={styles.stepper}>
            <TouchableOpacity 
              style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
              onPress={onDecrease}
            >
              <Minus size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ width: 40, textAlign: 'center', color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>
              {item.quantity}
            </Text>
            <TouchableOpacity 
              style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }, isMaxReached && { opacity: 0.5 }]}
              onPress={onIncrease}
              disabled={isMaxReached}
            >
              <Plus size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          {isMaxReached && (
            <Text style={{ color: colors.status.amber, fontFamily: typography.fontFamily.regular, fontSize: 12, marginTop: 6 }}>
              Omborda faqat {item.product.joriyQoldiq} dona bor
            </Text>
          )}
        </View>
        <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 16 }}>
          {formatPrice(total)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  removeBtn: {
    padding: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  }
});
