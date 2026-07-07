/**
 * Web-specific BarcodeRenderer
 *
 * On web, react-native-webview becomes a sandboxed <iframe> that blocks the
 * postMessage channel we rely on, so bwip-js never fires back.
 *
 * Instead we import bwip-js directly, render into an off-screen <canvas>,
 * convert to a data-URI, and display via RN's <Image>. This works in any
 * browser including the mobile one the user tested in.
 */
import bwipjs from 'bwip-js/browser';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface BarcodeRendererProps {
  aamvaString: string;
  isEmpty?: boolean;
  onPngReady?: (base64Png: string) => void;
}

export default function BarcodeRenderer({
  aamvaString,
  isEmpty,
  onPngReady,
}: BarcodeRendererProps) {
  const colors = useColors();
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onPngReadyRef = useRef(onPngReady);
  onPngReadyRef.current = onPngReady;

  useEffect(() => {
    if (isEmpty || !aamvaString) return;

    setLoading(true);
    setError(null);
    setDataUri(null);
    setImgSize(null);

    // Run after paint so the loading indicator is visible
    const id = requestAnimationFrame(() => {
      try {
        const canvas = document.createElement('canvas');
        bwipjs.toCanvas(canvas, {
          bcid: 'pdf417',
          text: aamvaString,
          scale: 3,
          height: 10,
          includetext: false,
          paddingwidth: 10,
          paddingheight: 6,
        });

        const uri = canvas.toDataURL('image/png');
        const base64 = uri.replace(/^data:image\/png;base64,/, '');

        setDataUri(uri);
        setImgSize({ width: canvas.width, height: canvas.height });
        setLoading(false);
        onPngReadyRef.current?.(base64);
      } catch (e) {
        setError((e as Error).message ?? 'Barcode generation failed');
        setLoading(false);
      }
    });

    return () => cancelAnimationFrame(id);
  }, [aamvaString, isEmpty]);

  if (isEmpty) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>▦</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Barcode Yet</Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
          Fill in the fields on the Generate tab to create your PDF417 barcode.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { borderColor: colors.border }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Generating barcode…
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {dataUri && imgSize && (
        <Image
          source={{ uri: dataUri }}
          style={{
            width: '100%',
            // maintain aspect ratio
            aspectRatio: imgSize.width / imgSize.height,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  errorBox: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#e53935',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
