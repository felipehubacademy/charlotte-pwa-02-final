import React, { useState, useRef } from 'react';
import {
  View, TouchableOpacity, Modal, Dimensions,
  StyleSheet, Platform,
} from 'react-native';
import { AppText } from '@/components/ui/Text';
import { translate, translatePhrase } from '@/lib/noviceDictionary';

interface Token {
  display: string;      // text to show (with trailing punctuation)
  translation: string | null;
  isPhrase: boolean;    // true if this token groups 2 words
}

interface TooltipState {
  translation: string;
  pageX: number;
  pageY: number;
  wordWidth: number;
}

interface Props {
  text: string;
  style?: any;
}

function parseTokens(text: string): Token[] {
  const raw = text.split(/\s+/).filter(Boolean);
  const tokens: Token[] = [];
  let i = 0;
  while (i < raw.length) {
    const w1 = raw[i];
    const w2 = raw[i + 1];
    // Try 2-word phrase
    if (w2) {
      const phraseTranslation = translatePhrase(w1, w2);
      if (phraseTranslation) {
        tokens.push({ display: w1 + ' ' + w2, translation: phraseTranslation, isPhrase: true });
        i += 2;
        continue;
      }
    }
    // Single word
    const wordTranslation = translate(w1);
    tokens.push({ display: w1, translation: wordTranslation, isPhrase: false });
    i++;
  }
  return tokens;
}

function TooltipBalloon({
  tooltip,
  onDismiss,
}: {
  tooltip: TooltipState;
  onDismiss: () => void;
}) {
  const BALLOON_W = 160;
  const ARROW_SIZE = 7;
  const BALLOON_PADDING = 10;
  const screenW = Dimensions.get('window').width;

  // Center balloon over the word
  let left = tooltip.pageX + tooltip.wordWidth / 2 - BALLOON_W / 2;
  left = Math.max(8, Math.min(left, screenW - BALLOON_W - 8));

  // Arrow position relative to balloon left
  const arrowLeft = tooltip.pageX + tooltip.wordWidth / 2 - left - ARROW_SIZE;

  // Balloon above the word
  const top = tooltip.pageY - 48 - ARROW_SIZE;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onDismiss} activeOpacity={1}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left,
            top,
            width: BALLOON_W,
            backgroundColor: '#16153A',
            borderRadius: 10,
            paddingHorizontal: BALLOON_PADDING,
            paddingVertical: 9,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 8,
          }}
        >
          <AppText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
            {tooltip.translation}
          </AppText>
          {/* Arrow pointing down */}
          <View
            style={{
              position: 'absolute',
              bottom: -ARROW_SIZE,
              left: Math.max(8, Math.min(arrowLeft, BALLOON_W - ARROW_SIZE * 2 - 8)),
              width: 0,
              height: 0,
              borderLeftWidth: ARROW_SIZE,
              borderRightWidth: ARROW_SIZE,
              borderTopWidth: ARROW_SIZE,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: '#16153A',
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function TranslatableWord({
  display,
  translation,
  textStyle,
  onPress,
}: {
  display: string;
  translation: string | null;
  textStyle?: any;
  onPress: (translation: string, pageX: number, pageY: number, width: number) => void;
}) {
  const ref = useRef<View>(null);

  const handlePress = () => {
    if (!translation) return;
    ref.current?.measure((_x, _y, width, _height, pageX, pageY) => {
      onPress(translation, pageX, pageY, width);
    });
  };

  const hasTranslation = !!translation;

  return (
    <TouchableOpacity
      ref={ref as any}
      onPress={handlePress}
      activeOpacity={hasTranslation ? 0.6 : 1}
      disabled={!hasTranslation}
      style={{ marginRight: 3, marginBottom: 2 }}
    >
      <AppText
        style={[
          textStyle,
          hasTranslation && {
            textDecorationLine: 'underline',
            textDecorationStyle: 'dotted' as any,
            textDecorationColor: 'rgba(217,119,6,0.55)',
          },
        ]}
      >
        {display}
      </AppText>
    </TouchableOpacity>
  );
}

export function TranslatableText({ text, style }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const tokens = parseTokens(text);

  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {tokens.map((token, i) => (
          <TranslatableWord
            key={i}
            display={token.display}
            translation={token.translation}
            textStyle={style}
            onPress={(translation, pageX, pageY, wordWidth) =>
              setTooltip({ translation, pageX, pageY, wordWidth })
            }
          />
        ))}
      </View>

      {tooltip && (
        <TooltipBalloon tooltip={tooltip} onDismiss={() => setTooltip(null)} />
      )}
    </>
  );
}
