import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme';

interface Segment {
  id: string;
  label: string;
  count?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeSegment: string;
  onChange: (id: string) => void;
}

export function SegmentedControl({ segments, activeSegment, onChange }: SegmentedControlProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={{ marginHorizontal: -spacing.md }}
      contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm }}
    >
      {segments.map((segment) => {
        const isActive = activeSegment === segment.id;
        return (
          <TouchableOpacity
            key={segment.id}
            onPress={() => onChange(segment.id)}
            style={[
              styles.chip,
              { 
                backgroundColor: isActive ? colors.primary : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
                borderRadius: 20
              }
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? '#FFFFFF' : colors.text,
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.fontSize.sm,
                },
              ]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
            {segment.count !== undefined && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isActive ? '#FFFFFF' : colors.text,
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: 10,
                    },
                  ]}
                >
                  {segment.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  label: {
    textAlign: 'center',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    textAlign: 'center',
  },
});
