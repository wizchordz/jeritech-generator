import React, { useRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormField, SectionHeader, SelectField } from '@/components/FormField';
import { EYE_COLORS, HAIR_COLORS } from '@/constants/aamva';
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
          placeholder="DDDF1234567890123"
          hint="Unique document ID assigned by the DMV — distinct from the license number"
          value={fields.documentDiscriminator}
          onChangeText={(v) => setField('documentDiscriminator', v.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="next"
          nextRef={addressRef}
          // @ts-ignore
          ref={dcfRef}
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
