import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

const Index = () => {
  const router = useRouter();
  const { token, isLoading, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1a73e8" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default Index;