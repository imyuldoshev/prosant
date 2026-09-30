import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../../types';
import { useTheme } from '../../../theme';
import { formatPrice } from '../../../lib/format';
import { CircleDashed, Droplet, Bath, Target, CornerUpRight, Component, Server } from 'lucide-react-native';

interface Props {
  results: Product[];
  onSelect: (product: Product) => void;
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

export const ProductSearchResults: React.FC<Props> = ({ results, onSelect }) => {
  const { colors, typography, radius, spacing } = useTheme();

  if (results.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}>
      {results.map((item, index) => {
        const isOutOfStock = item.joriyQoldiq === 0;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.row,
              index < results.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
            ]}
            onPress={() => !isOutOfStock && onSelect(item)}
            activeOpacity={0.7}
            disabled={isOutOfStock}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
              {getIcon(item.rasm, isOutOfStock ? colors.muted : colors.primary, 24)}
            </View>
            <View style={styles.info}>
              <Text style={[{ color: isOutOfStock ? colors.muted : colors.text, fontFamily: typography.fontFamily.medium }]} numberOfLines={1}>
                {item.nom}
              </Text>
              <Text style={[{ color: isOutOfStock ? colors.muted : colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm }]}>
                {formatPrice(item.sotuvNarxi)}
              </Text>
            </View>
            <View style={styles.stock}>
              {isOutOfStock ? (
                <Text style={{ color: colors.status.amber, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs }}>
                  Tugagan
                </Text>
              ) : (
                <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs }}>
                  Qoldiq: {item.joriyQoldiq} {item.birlik}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  stock: {
    alignItems: 'flex-end',
  }
});
