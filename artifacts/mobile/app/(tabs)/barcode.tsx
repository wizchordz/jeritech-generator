import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BarcodeRenderer from '@/components/BarcodeRenderer';
import { useBarcodeContext } from '@/context/BarcodeContext';
import { useColors } from '@/hooks/useColors';

export default function BarcodeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { aamvaString, fields } = useBarcodeContext();
  const [showRaw, setShowRaw] = useState(false);

  // Determine if we have enough data for a meaningful barcode
  const hasData = !!(fields.documentNumber || fields.lastName || fields.firstName || fields.dob);

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: aamvaString,
        title: 'AAMVA Barcode String',
      });
    } catch (_) {}
  };

  const toggleRaw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRaw((v) => !v);
  };

  const webTopPadding = Platform.OS === 'web' ? 67 : 0;
  const webBottomPadding = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: 16 + webTopPadding,
            paddingBottom: insets.bottom + 24 + webBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>PDF417 Barcode</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              AAMVA Driver License / ID Standard v8
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Barcode */}
        <BarcodeRenderer aamvaString={aamvaString} isEmpty={!hasData} />

        {/* Field Summary */}
        {hasData && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {fields.firstName || fields.lastName ? (
              <SummaryRow
                label="Name"
                value={[fields.firstName, fields.middleName, fields.lastName].filter(Boolean).join(' ')}
                colors={colors}
              />
            ) : null}
            {fields.dob ? (
              <SummaryRow label="Date of Birth" value={formatDate(fields.dob)} colors={colors} />
            ) : null}
            {fields.documentNumber ? (
              <SummaryRow label="Document #" value={fields.documentNumber} colors={colors} />
            ) : null}
            {fields.state ? (
              <SummaryRow label="State" value={fields.state.toUpperCase()} colors={colors} />
            ) : null}
            {fields.expiryDate ? (
              <SummaryRow label="Expires" value={formatDate(fields.expiryDate)} colors={colors} />
            ) : null}
          </View>
        )}

        {/* Raw String Toggle */}
        <TouchableOpacity
          style={[styles.rawToggle, { borderColor: colors.border }]}
          onPress={toggleRaw}
          activeOpacity={0.7}
        >
          <Text style={[styles.rawToggleText, { color: colors.accent }]}>
            {showRaw ? 'Hide' : 'Show'} Raw AAMVA String
          </Text>
          <Ionicons
            name={showRaw ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.accent}
          />
        </TouchableOpacity>

        {showRaw && (
          <View style={[styles.rawContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rawLabel, { color: colors.mutedForeground }]}>RAW OUTPUT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <Text style={[styles.rawText, { color: colors.foreground }]}>
                {formatRawForDisplay(aamvaString)}
              </Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** Format MMDDYYYY → MM/DD/YYYY for display */
function formatDate(s: string): string {
  if (s.length !== 8 || !/^\d{8}$/.test(s)) return s;
  return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4)}`;
}

/** Replace control characters with visible representations for display */
function formatRawForDisplay(raw: string): string {
  return raw
    .replace(/\x40/g, '@')
    .replace(/\x0a/g, '↵\n')
    .replace(/\x1e/g, '‹RS›')
    .replace(/\x0d/g, '↩\n');
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
    marginLeft: 16,
    textAlign: 'right',
  },
  rawToggle: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  rawToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  rawContainer: {
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  rawLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  rawText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
});
