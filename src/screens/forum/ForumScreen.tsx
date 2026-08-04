import React, { useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme';
import Screen from '../../components/common/Screen';
import { API_URL } from '../../utils/constants';

// We get the frontend URL from the API_URL by replacing backend port with frontend URL
// Or we can just hardcode the production URL since it's the main web app
const WEB_URL = 'https://aidevix.uz/forum';

const ForumScreen = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  return (
    <Screen padded={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {loading && (
          <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});

export default ForumScreen;
