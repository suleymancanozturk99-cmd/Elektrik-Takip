import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const insets = useSafeAreaInsets();
  const { login, verifyOTP, tempEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  // Web Alert Handler
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onOk?: () => void;
  }>({ visible: false, title: '', message: '' });

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message, onOk });
    } else {
      // For mobile, we'll just use console.log for demo
      console.log(`${title}: ${message}`);
      onOk?.();
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      showWebAlert('Uyarı', 'Lütfen email adresinizi girin.');
      return;
    }

    try {
      setLoading(true);
      await login(email);
      setStep('otp');
      showWebAlert('Başarılı', `OTP kodu ${email} adresine gönderildi.\n\nDemo için herhangi bir 6 haneli sayı girebilirsiniz.`);
    } catch (error: any) {
      showWebAlert('Hata', error.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otp.trim()) {
      showWebAlert('Uyarı', 'Lütfen OTP kodunu girin.');
      return;
    }

    try {
      setLoading(true);
      const success = await verifyOTP(tempEmail!, otp);
      if (success) {
        showWebAlert('Başarılı', 'Giriş yapıldı!', () => {
          router.replace('/(tabs)');
        });
      }
    } catch (error: any) {
      showWebAlert('Hata', error.message || 'OTP doğrulanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setOtp('');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="electric-bolt" size={64} color="#2196f3" />
          <Text style={styles.title}>ElektrikçiPro</Text>
          <Text style={styles.subtitle}>
            {step === 'email' 
              ? 'Email adresinizle giriş yapın' 
              : 'OTP kodunuzu girin'
            }
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Adresi</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
              >
                <MaterialIcons 
                  name={loading ? "refresh" : "send"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.buttonText}>
                  {loading ? 'Gönderiliyor...' : 'OTP Gönder'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OTP Kodu</Text>
                <Text style={styles.emailInfo}>{tempEmail}</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="123456"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleOTPSubmit}
                disabled={loading}
              >
                <MaterialIcons 
                  name={loading ? "refresh" : "login"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.buttonText}>
                  {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color="#2196f3" />
                <Text style={styles.backButtonText}>Email Değiştir</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.demoInfo}>
          <MaterialIcons name="info" size={20} color="#ff9800" />
          <Text style={styles.demoText}>
            Demo sürümü: Herhangi bir 6 haneli sayı ile giriş yapabilirsiniz
          </Text>
        </View>
      </ScrollView>

      {/* Web Alert Modal */}
      {Platform.OS === 'web' && (
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={() => {
                  alertConfig.onOk?.();
                  setAlertConfig(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.alertButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  emailInfo: {
    fontSize: 14,
    color: '#2196f3',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  backButtonText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '500',
  },
  demoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  demoText: {
    flex: 1,
    fontSize: 14,
    color: '#f57c00',
    lineHeight: 18,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    minWidth: 280,
    maxWidth: 400,
    margin: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});