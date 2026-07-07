import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BarcodeRendererProps {
  aamvaString: string;
  isEmpty?: boolean;
}

function buildHtml(aamvaString: string, bgColor: string): string {
  // Safely embed the AAMVA string using JSON.stringify to handle all special chars
  const safeData = JSON.stringify(aamvaString);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
canvas {
  max-width: 100%;
  display: block;
  image-rendering: pixelated;
}
.error {
  color: #e53935;
  font-family: -apple-system, monospace;
  font-size: 13px;
  text-align: center;
  padding: 24px 16px;
  line-height: 1.5;
}
</style>
</head>
<body>
<canvas id="bc"></canvas>
<script src="https://cdn.jsdelivr.net/npm/bwip-js@3.5.0/dist/bwip-js-min.js"></script>
<script>
(function() {
  var text = ${safeData};
  try {
    bwipjs.toCanvas('bc', {
      bcid: 'pdf417',
      text: text,
      scale: 3,
      height: 10,
      includetext: false,
      padding: 10
    });
    var h = document.getElementById('bc').getBoundingClientRect().height;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: Math.ceil(h) + 48 }));
    }
  } catch(e) {
    document.getElementById('bc').style.display = 'none';
    var err = document.createElement('div');
    err.className = 'error';
    err.textContent = 'Barcode error: ' + e.message;
    document.body.appendChild(err);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: 120 }));
    }
  }
})();
</script>
</body>
</html>`;
}

export default function BarcodeRenderer({ aamvaString, isEmpty }: BarcodeRendererProps) {
  const colors = useColors();
  const [webViewHeight, setWebViewHeight] = useState(220);
  const [isLoading, setIsLoading] = useState(true);

  const html = useMemo(() => buildHtml(aamvaString, colors.background), [aamvaString]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && typeof data.value === 'number') {
        setWebViewHeight(Math.max(120, data.value));
      }
    } catch (_) {}
  };

  if (isEmpty) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: '#ffffff' }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Generating barcode…
          </Text>
        </View>
      )}
      <WebView
        source={{ html }}
        style={[styles.webview, { height: webViewHeight }]}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={handleMessage}
        onLoadEnd={() => setIsLoading(false)}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      />
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
  },
  webview: {
    width: '100%',
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
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
