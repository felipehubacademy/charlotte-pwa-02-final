/**
 * components/vocabulary/VocabFAB.tsx
 * Floating "+" button for quick word capture.
 * Import this into any screen that should show the FAB.
 *
 * Usage:
 *   import { VocabFAB } from '@/components/vocabulary/VocabFAB';
 *   // Inside screen render, after main content:
 *   <VocabFAB />
 */

import React, { useState } from 'react';
import { TouchableOpacity, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'phosphor-react-native';
import { AddWordModal } from './AddWordModal';
import * as Haptics from 'expo-haptics';

interface VocabFABProps {
  bottom?: number;   // extra offset from bottom (e.g. to sit above a nav bar)
  right?: number;
  initialTerm?: string;
}

export function VocabFAB({ bottom = 0, right = 20, initialTerm }: VocabFABProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        onPress={open}
        activeOpacity={0.82}
        style={{
          position: 'absolute',
          right,
          bottom: insets.bottom + bottom + 16,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#3D8800',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          ...Platform.select({
            ios:     { shadowColor: '#3D8800', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 8 },
          }),
        }}
      >
        <Plus size={22} color="#FFFFFF" weight="bold" />
      </TouchableOpacity>

      <AddWordModal
        visible={visible}
        onClose={() => setVisible(false)}
        initialTerm={initialTerm}
        source="manual"
      />
    </>
  );
}
