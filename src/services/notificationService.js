import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseISODate } from '../utils/date';

const SETTINGS_KEY = '@smartfridge/notification-settings';
const DEFAULT_SETTINGS = { enabled: true, daysWarning: 3 };
const NOTIFY_HOUR = 9;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function loadNotificationSettings() {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web' || !Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Alertas de vencimiento',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function atHour(date, hour) {
  const result = new Date(date);
  result.setHours(hour, 0, 0, 0);
  return result;
}

function buildTriggers(product, daysWarning) {
  const expires = parseISODate(product.expires);
  if (!expires) return [];

  const now = new Date();
  const warningDate = atHour(expires, NOTIFY_HOUR);
  warningDate.setDate(warningDate.getDate() - daysWarning);
  const expiryDate = atHour(expires, NOTIFY_HOUR);

  const triggers = [];

  if (warningDate > now) {
    triggers.push({
      suffix: 'warning',
      date: warningDate,
      title: '⏳ Producto por vencer',
      body: `${product.name} vence en ${daysWarning} día${daysWarning > 1 ? 's' : ''}.`,
    });
  }

  if (expiryDate > now) {
    triggers.push({
      suffix: 'expiry',
      date: expiryDate,
      title: '⚠️ Producto vence hoy',
      body: `${product.name} vence hoy. ¡Úsalo antes de que se pierda!`,
    });
  }

  return triggers;
}

export async function syncExpiryNotifications(products, settings) {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings?.enabled) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  for (const product of products) {
    const triggers = buildTriggers(product, settings.daysWarning);
    for (const trigger of triggers) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${product.id}-${trigger.suffix}`,
        content: {
          title: trigger.title,
          body: trigger.body,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger.date,
        },
      });
    }
  }
}
