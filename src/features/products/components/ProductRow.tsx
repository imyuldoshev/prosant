import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { Product } from '../../../types';
import { formatPrice } from '../../../lib/format';
import { Badge } from '../../../components/Badge';
import { router } from 'expo-router';
import { Droplet, Bath, Target, CornerUpRight, Component, Server, CircleDashed } from 'lucide-react-native';

interface ProductRowProps {
  product: Product;
  isSoldSegment?: boolean;
  soldQuantity?: number;
  soldAmount?: number;
  onPress: () => void;
}

const getIconForProduct = (iconName: string, color: string, size: number = 24) => {
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

export function ProductRow({ product, isSoldSegment, soldQuantity, soldAmount, onPress }: ProductRowProps) {
  const { colors, typography, radius, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.md,
          marginBottom: spacing.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: colors.background, borderRadius: radius.md }]}>
        {getIconForProduct(product.rasm, colors.muted)}
      </View>

      <View style={styles.middle}>
        <Text
          style={[styles.name, { color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm }]}
          numberOfLines={2}
        >
          {product.nom}
        </Text>
        <Text style={[styles.category, { color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs }]}>
          {product.category}
        </Text>
        <View style={styles.badges}>
          {product.joriyQoldiq === 0 ? (
            <Badge variant="danger" label="Tugagan" />
          ) : product.joriyQoldiq <= product.minimalQoldiq ? (
            <Badge variant="warning" label="Kam qoldi" />
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {isSoldSegment ? (
          <>
            <Text style={[styles.price, { color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md }]}>
              {formatPrice(soldAmount || 0)}
            </Text>
            <Text style={[styles.stock, { color: colors.status.red, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm }]}>
              -{soldQuantity} {product.birlik}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.price, { color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md }]}>
              {formatPrice(product.sotuvNarxi)}
            </Text>
            <Text style={[styles.stock, { color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, marginBottom: 8 }]}>
              {product.joriyQoldiq} {product.birlik}
            </Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: product.joriyQoldiq === 0 ? colors.border : colors.primary, 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: radius.sm, 
                alignItems: 'center' 
              }}
              onPress={() => {
                router.navigate({ pathname: '/(tabs)/sales', params: { addProductId: product.id } });
              }}
              disabled={product.joriyQoldiq === 0}
            >
              <Text style={{ color: '#FFF', fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs }}>Sotish</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    marginBottom: 4,
  },
  category: {
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  price: {
    marginBottom: 4,
  },
  stock: {},
});
