import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../theme';
import { useProductsStore } from '../../store/ProductsStore';
import { X, Check, Plus, Folder } from 'lucide-react-native';
import { Button } from '../../../components/Button';

interface CategoryPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string | null;
  onSelect: (category: string) => void;
}

export function CategoryPickerSheet({ visible, onClose, selectedCategory, onSelect }: CategoryPickerSheetProps) {
  const { colors, typography, radius, spacing } = useTheme();
  const { state: { categories }, dispatch } = useProductsStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      dispatch({ type: 'ADD_CATEGORY', payload: trimmed });
      onSelect(trimmed);
      setNewCategory('');
      setIsAdding(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.sheet, { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
          <View style={styles.header}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>
              Kategoriya tanlash
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.card }]}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }}>
            {categories.map((cat, idx) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity 
                  key={idx}
                  style={[styles.catRow, { borderBottomColor: colors.border }]}
                  onPress={() => onSelect(cat)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Folder size={20} color={colors.muted} style={{ marginRight: 12 }} />
                    <Text style={{ 
                      color: isSelected ? colors.primary : colors.text, 
                      fontFamily: isSelected ? typography.fontFamily.bold : typography.fontFamily.medium,
                      fontSize: 16
                    }}>{cat}</Text>
                  </View>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}

            {!isAdding ? (
              <TouchableOpacity 
                style={[styles.addBtn, { borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.md }]}
                onPress={() => setIsAdding(true)}
              >
                <Plus size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium }}>Yangi kategoriya qo'shish</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.addForm, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.md }]}>
                <TextInput 
                  style={[styles.input, { color: colors.text, fontFamily: typography.fontFamily.medium }]}
                  placeholder="Kategoriya nomi"
                  placeholderTextColor={colors.muted}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <Button title="Bekor qilish" variant="secondary" style={{ flex: 1 }} onPress={() => { setIsAdding(false); setNewCategory(''); }} />
                  <Button title="Saqlash" style={{ flex: 1 }} onPress={handleAdd} disabled={!newCategory.trim()} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addForm: {
    padding: 12,
    borderWidth: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomColor: 'rgba(0,0,0,0.1)',
    fontSize: 16,
    paddingHorizontal: 8,
  }
});
