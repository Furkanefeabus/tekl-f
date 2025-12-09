import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    // Uygulama başlarken auth durumunu yükle
    loadAuth();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-product"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-customer"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-quotation"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="quotation-details"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="product-details"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="customer-details"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="catalog"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
