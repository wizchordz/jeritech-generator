import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormField, SectionHeader, SelectField } from '@/components/FormField';
import { AamvaFields, COMPLIANCE_TYPES, EYE_COLORS, HAIR_COLORS, RACE_ETHNICITY } from '@/constants/aamva';
import { API_BASE_URL } from '@/constants/config';
import { useBarcodeContext } from '@/context/BarcodeContext';
import { useColors } from '@/hooks/useColors';

const SEX_OPTIONS = [
  { label: 'Male', value: '1' },
  { label: 'Female', value: '2' },
  { label: 'X / Not Specified', value: '9' },
];

export default function FormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fields, setField, resetFields } = useBarcodeContext();

  // Refs for focus chaining
  const firstNameRef = useRef<TextInput>(null);
  const middleNameRef = useRef<TextInput>(null);
  const dobRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const docNumRef = useRef<TextInput>(null);
  const classRef = useRef<TextInput>(null);
  const restrictRef = useRef<TextInput>(null);
  const endorseRef = useRef<TextInput>(null);
  const issueDateRef = useRef<TextInput>(null);
  const expiryDateRef = useRef<TextInput>(null);
  const iinRef = useRef<TextInput>(null);
  const dcfRef = useRef<TextInput>(null);
  const invCtrlRef = useRef<TextInput>(null);
  const cardRevDateRef = useRef<TextInput>(null);
  const jurisdictionRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const zipRef = useRef<TextInput>(null);

  const handleGenerate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/(tabs)/barcode');
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetFields();
  };

  const [isScanning, setIsScanning] = useState(false);

  const handleScanLicense = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Scan Licence', 'Choose an image source', [
      {
        text: 'Take Photo',
        onPress: () => launchOcr('camera'),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => launchOcr('library'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const launchOcr = async (source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Camera access is required to take a photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Photo library access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        });
      }

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'Could not read image data.');
        return;
      }

      setIsScanning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await fetch(`${API_BASE_URL}/api/ocr/scan-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: asset.base64,
          mimeType: asset.mimeType ?? 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let msg = `Server error ${response.status}`;
        try { msg = (JSON.parse(text) as { error?: string }).error ?? msg; } catch { /* HTML body */ }
        throw new Error(msg);
      }

      const text = await response.text();
      let data: { success: boolean; fields: Partial<AamvaFields> };
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        throw new Error('Unexpected response from server. Check the API is running.');
      }
      const extracted = data.fields ?? {};

      // Fill every non-empty extracted field
      (Object.keys(extracted) as (keyof AamvaFields)[]).forEach((key) => {
        const val = extracted[key];
        if (val !== undefined && val !== '') {
          // @ts-ignore — dynamic setField
          setField(key, val);
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Licence scanned ✓', 'Fields have been filled in. Review and adjust anything that looks off.');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Scan failed', (err as Error).message ?? 'Unknown error. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const webTopPadding = Platform.OS === 'web' ? 67 : 0;
  const webBottomPadding = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: 16 + webTopPadding,
            paddingBottom: insets.bottom + 120 + webBottomPadding,
          },
        ]}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>JERITECH Generator</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              PDF417 Driver License / ID Barcode
            </Text>
          </View>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.resetBtn}>
            <Ionicons name="refresh-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── AAMVA VERSION ────────────────────────── */}
        <View style={[styles.versionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>AAMVA VERSION</Text>
          <View style={styles.versionChips}>
            {(['09', '10', '11'] as const).map((v) => {
              const active = fields.aamvaVersion === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => { setField('aamvaVersion', v); Haptics.selectionAsync(); }}
                  style={[
                    styles.versionChip,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.versionChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                    v{v}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── SCAN LICENCE ─────────────────────────── */}
        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={handleScanLicense}
          activeOpacity={0.8}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.scanBtnText, { color: colors.primary }]}>Scanning…</Text>
            </>
          ) : (
            <>
              <Ionicons name="scan-outline" size={22} color={colors.primary} />
              <View style={styles.scanBtnBody}>
                <Text style={[styles.scanBtnText, { color: colors.primary }]}>Scan Licence Front</Text>
                <Text style={[styles.scanBtnSub, { color: colors.mutedForeground }]}>
                  AI reads your licence image and fills in all fields automatically
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </>
          )}
        </TouchableOpacity>

        {/* ── PERSONAL ─────────────────────────────── */}
        <SectionHeader title="Personal" subtitle="Driver's license holder information" />

        <FormField
          label="Last Name"
          placeholder="SMITH"
          value={fields.lastName}
          onChangeText={(v) => setField('lastName', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={firstNameRef}
        />
        <FormField
          label="First Name"
          placeholder="JOHN"
          value={fields.firstName}
          onChangeText={(v) => setField('firstName', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={middleNameRef}
          // @ts-ignore
          ref={firstNameRef}
        />
        <FormField
          label="Middle Name"
          placeholder="WILLIAM"
          value={fields.middleName}
          onChangeText={(v) => setField('middleName', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={dobRef}
          // @ts-ignore
          ref={middleNameRef}
        />
        <FormField
          label="Date of Birth"
          placeholder="01151990  (MMDDYYYY)"
          hint="Format: MMDDYYYY — e.g. 01151990 for Jan 15, 1990"
          value={fields.dob}
          onChangeText={(v) => setField('dob', v.replace(/\D/g, '').slice(0, 8))}
          keyboardType="number-pad"
          returnKeyType="next"
          nextRef={heightRef}
          // @ts-ignore
          ref={dobRef}
        />

        <SelectField
          label="Sex"
          value={fields.sex}
          options={SEX_OPTIONS}
          onSelect={(v) => setField('sex', v)}
        />

        <SelectField
          label="Eye Color"
          value={fields.eyeColor}
          options={EYE_COLORS}
          onSelect={(v) => setField('eyeColor', v)}
        />

        <SelectField
          label="Hair Color"
          value={fields.hairColor}
          options={HAIR_COLORS}
          onSelect={(v) => setField('hairColor', v)}
        />

        {/* ── Height with unit toggle ──────────────── */}
        <View style={styles.heightRow}>
          <View style={styles.heightField}>
            <FormField
              label="Height"
              placeholder={fields.heightUnit === 'ftin' ? "510  (5 ft 10 in)" : "178  (centimetres)"}
              hint={
                fields.heightUnit === 'ftin'
                  ? "FTIN — first digit(s) feet, last two inches: 510 = 5'10\""
                  : "Enter height in centimetres, e.g. 178"
              }
              value={fields.height}
              onChangeText={(v) => setField('height', v.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad"
              returnKeyType="next"
              nextRef={weightRef}
              // @ts-ignore
              ref={heightRef}
            />
          </View>
          <View style={styles.heightToggle}>
            <TouchableOpacity
              style={[styles.unitBtn, fields.heightUnit === 'ftin' && { backgroundColor: colors.primary }]}
              onPress={() => { Haptics.selectionAsync(); setField('heightUnit', 'ftin'); setField('height', ''); }}
            >
              <Text style={[styles.unitBtnText, { color: fields.heightUnit === 'ftin' ? '#fff' : colors.mutedForeground }]}>
                ft/in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitBtn, fields.heightUnit === 'cm' && { backgroundColor: colors.primary }]}
              onPress={() => { Haptics.selectionAsync(); setField('heightUnit', 'cm'); setField('height', ''); }}
            >
              <Text style={[styles.unitBtnText, { color: fields.heightUnit === 'cm' ? '#fff' : colors.mutedForeground }]}>
                cm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <FormField
          label="Weight (lbs)"
          placeholder="175"
          value={fields.weight}
          onChangeText={(v) => setField('weight', v.replace(/\D/g, '').slice(0, 3))}
          keyboardType="number-pad"
          returnKeyType="next"
          nextRef={stateRef}
          // @ts-ignore
          ref={weightRef}
        />

        {/* ── LICENSE ──────────────────────────────── */}
        <SectionHeader title="License" subtitle="Issuing jurisdiction and license details" />

        <FormField
          label="State"
          placeholder="CA"
          hint="2-letter state abbreviation — auto-fills Issuer ID"
          value={fields.state}
          onChangeText={(v) => setField('state', v.toUpperCase().slice(0, 2))}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={docNumRef}
          // @ts-ignore
          ref={stateRef}
        />
        <FormField
          label="Document Number"
          placeholder="D1234567"
          value={fields.documentNumber}
          onChangeText={(v) => setField('documentNumber', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={classRef}
          // @ts-ignore
          ref={docNumRef}
        />
        <FormField
          label="Vehicle Class"
          placeholder="C"
          hint="e.g. A, B, C, D, M"
          value={fields.vehicleClass}
          onChangeText={(v) => setField('vehicleClass', v.toUpperCase().slice(0, 2))}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={restrictRef}
          // @ts-ignore
          ref={classRef}
        />
        <FormField
          label="Restrictions"
          placeholder="NONE"
          hint="e.g. NONE, B (corrective lenses), C (mechanical aid)"
          value={fields.restrictions}
          onChangeText={(v) => setField('restrictions', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={endorseRef}
          // @ts-ignore
          ref={restrictRef}
        />
        <FormField
          label="Endorsements"
          placeholder="NONE"
          hint="e.g. NONE, H (hazmat), N (tank vehicle)"
          value={fields.endorsements}
          onChangeText={(v) => setField('endorsements', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={issueDateRef}
          // @ts-ignore
          ref={endorseRef}
        />
        <FormField
          label="Issue Date"
          placeholder="01012020  (MMDDYYYY)"
          hint="Format: MMDDYYYY"
          value={fields.issueDate}
          onChangeText={(v) => setField('issueDate', v.replace(/\D/g, '').slice(0, 8))}
          keyboardType="number-pad"
          returnKeyType="next"
          nextRef={expiryDateRef}
          // @ts-ignore
          ref={issueDateRef}
        />
        <FormField
          label="Expiry Date"
          placeholder="01012028  (MMDDYYYY)"
          hint="Format: MMDDYYYY"
          value={fields.expiryDate}
          onChangeText={(v) => setField('expiryDate', v.replace(/\D/g, '').slice(0, 8))}
          keyboardType="number-pad"
          returnKeyType="next"
          nextRef={iinRef}
          // @ts-ignore
          ref={expiryDateRef}
        />
        <FormField
          label="Issuer ID Number (IIN)"
          placeholder="636033"
          hint="6-digit AAMVA Issuer ID — auto-filled when you enter State"
          value={fields.iin}
          onChangeText={(v) => setField('iin', v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          returnKeyType="next"
          nextRef={dcfRef}
          // @ts-ignore
          ref={iinRef}
        />
        <FormField
          label="Document Discriminator (DCF)"
          placeholder="18224100142025987869"
          hint="Unique doc ID from the DMV system — must match what's encoded on the physical card. TX example: 18224100142025987869 (20 digits). Wrong value = Regula text-field failure."
          value={fields.documentDiscriminator}
          onChangeText={(v) => setField('documentDiscriminator', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={invCtrlRef}
          // @ts-ignore
          ref={dcfRef}
        />
        <FormField
          label="Inventory Control Number (DCK)"
          placeholder="10006128248"
          hint="Printed inventory / audit number on the card — leave blank if not shown"
          value={fields.inventoryControlNumber}
          onChangeText={(v) => setField('inventoryControlNumber', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={cardRevDateRef}
          // @ts-ignore
          ref={invCtrlRef}
        />
        <SelectField
          label="Race / Ethnicity (DCL)"
          value={fields.raceEthnicity}
          options={[{ label: '— Not specified —', value: '' }, ...RACE_ETHNICITY]}
          onSelect={(v: string) => setField('raceEthnicity', v)}
        />
        <SelectField
          label="Compliance Type (DDA)"
          value={fields.complianceType}
          options={COMPLIANCE_TYPES}
          onSelect={(v: string) => setField('complianceType', v)}
        />
        <FormField
          label="Card Revision Date (DDB)"
          placeholder="02232020  (MMDDYYYY)"
          hint="Date the card design was last revised — from the DMV system"
          value={fields.cardRevisionDate}
          onChangeText={(v) => setField('cardRevisionDate', v.replace(/\D/g, '').slice(0, 8))}
          keyboardType="number-pad"
          returnKeyType="next"
          nextRef={jurisdictionRef}
          // @ts-ignore
          ref={cardRevDateRef}
        />

        {/* ── JURISDICTION ─────────────────────────── */}
        <SectionHeader
          title="Jurisdiction Subfile (ZT)"
          subtitle="State-specific data appended as a second subfile. Leave blank to omit."
        />
        <FormField
          label="Jurisdiction Data"
          placeholder="ZTAN"
          hint={'TX example: ZTAN · VA example: ZVAN · Leave blank to generate a single-subfile barcode'}
          value={fields.jurisdictionData}
          onChangeText={(v) => setField('jurisdictionData', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={addressRef}
          // @ts-ignore
          ref={jurisdictionRef}
        />

        {/* ── ADDRESS ──────────────────────────────── */}
        <SectionHeader title="Address" subtitle="Residential address on the license" />

        <FormField
          label="Street Address"
          placeholder="123 MAIN ST"
          value={fields.address}
          onChangeText={(v) => setField('address', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={cityRef}
          // @ts-ignore
          ref={addressRef}
        />
        <FormField
          label="City"
          placeholder="LOS ANGELES"
          value={fields.city}
          onChangeText={(v) => setField('city', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={zipRef}
          // @ts-ignore
          ref={cityRef}
        />
        <FormField
          label="ZIP Code"
          placeholder="900241234"
          hint={"9 digits — ZIP+4 format, no hyphen (e.g. 900241234)"}
          value={fields.zip}
          onChangeText={(v) => setField('zip', v.replace(/\D/g, '').slice(0, 9))}
          keyboardType="number-pad"
          returnKeyType="done"
          // @ts-ignore
          ref={zipRef}
        />
      </KeyboardAwareScrollViewCompat>

      {/* Generate Button — floating at bottom */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12 + webBottomPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: colors.primary }]}
          onPress={handleGenerate}
          activeOpacity={0.85}
        >
          <Ionicons name="barcode-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
            Generate Barcode
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  resetBtn: {
    padding: 8,
  },
  versionRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  versionChips: {
    flexDirection: 'row',
    gap: 6,
  },
  versionChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  versionChipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  scanBtn: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanBtnBody: {
    flex: 1,
    gap: 2,
  },
  scanBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  scanBtnSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 15,
  },
  generateBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingRight: 16,
  },
  heightField: {
    flex: 1,
  },
  heightToggle: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 28,
  },
  unitBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    minWidth: 44,
  },
  unitBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
