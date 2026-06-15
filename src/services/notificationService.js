import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleExpiryNotifications(products) {
  await cancelAllNotifications();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const product of products) {
    if (!product.expires) continue;

    const [year, month, day] = product.expires.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    expiry.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((expiry - today) / 86400000);

    if (daysLeft < 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Producto vencido',
          body: `${product.name} ya venció. Considera retirarlo del inventario.`,
        },
        trigger: null, 
      });
    }

    // Vence hoy
    else if (daysLeft === 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🟠 Vence hoy',
          body: `${product.name} vence hoy. ¡Úsalo pronto!`,
        },
        trigger: null,
      });
    }

    // Vence en 1 o 2 días
    else if (daysLeft <= 2) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Próximo a vencer',
          body: `${product.name} vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}.`,
        },
        trigger: null,
      });
    }
  }
}