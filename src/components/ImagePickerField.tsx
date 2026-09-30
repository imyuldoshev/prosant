import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';

interface ImagePickerFieldProps {
  value?: string | null;
  onChange: (uri: string | null) => void;
  label?: string;
}

export function ImagePickerField({ value, onChange, label }: ImagePickerFieldProps) {
  const { colors, typography, radius, spacing } = useTheme();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert("Kamera uchun ruxsat kerak!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, marginBottom: 8, fontSize: 14 }}>{label}</Text>}
      
      {value ? (
        <View style={{ alignItems: 'center' }}>
          <Image source={{ uri: value }} style={{ width: 120, height: 120, borderRadius: radius.lg }} />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
            <TouchableOpacity onPress={pickImage} style={[styles.actionBtn, { borderColor: colors.primary }]}>
              <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>O'zgartirish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChange(null)} style={[styles.actionBtn, { borderColor: colors.status.red }]}>
              <Trash2 size={16} color={colors.status.red} style={{ marginRight: 4 }} />
              <Text style={{ color: colors.status.red, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>O'chirish</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity 
            style={[styles.placeholder, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background }]} 
            onPress={pickImage}
          >
            <ImageIcon size={24} color={colors.muted} />
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 12, marginTop: 4 }}>Galereya</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.placeholder, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background }]} 
            onPress={takePhoto}
          >
            <Camera size={24} color={colors.muted} />
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 12, marginTop: 4 }}>Kamera</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    height: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
  }
});
