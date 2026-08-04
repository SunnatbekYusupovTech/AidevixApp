import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Notifications: any;
if (Constants.appOwnership === 'expo') {
  Notifications = {
    setNotificationHandler: () => {},
    AndroidImportance: { DEFAULT: 3, MAX: 4 },
    setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'mock-token' }),
    cancelScheduledNotificationAsync: async () => {},
    scheduleNotificationAsync: async () => 'mock-id',
    cancelAllScheduledNotificationsAsync: async () => {},
    SchedulableTriggerInputTypes: { DATE: 'date' },
  };
} else {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  if (Platform.OS !== 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      console.log('Error getting token', e);
    }
  }

  return token;
};

export const scheduleLocalNotification = async (title: string, body: string, trigger: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { data: 'goes here' },
    },
    trigger,
  });
};
