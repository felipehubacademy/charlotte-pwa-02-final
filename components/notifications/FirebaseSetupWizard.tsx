'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { isFirebaseConfigured, getFCMToken, setupForegroundListener } from '@/lib/firebase-config-optimized';
import { CheckCircle, XCircle, AlertCircle, Settings, Smartphone, Cloud } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  errorMessage?: string;
}

export default function FirebaseSetupWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [fcmToken, setFCMToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'config',
      title: '🔧 Firebase Configuration',
      description: 'Check environment variables and Firebase setup',
      status: 'pending'
    },
    {
      id: 'permissions',
      title: '🔔 Notification Permissions',
      description: 'Request and verify notification permissions',
      status: 'pending'
    },
    {
      id: 'token',
      title: '🎟️ FCM Token Generation',
      description: 'Generate and validate Firebase Cloud Messaging token',
      status: 'pending'
    },
    {
      id: 'database',
      title: '💾 Database Integration',
      description: 'Save FCM token to Supabase database',
      status: 'pending'
    },
    {
      id: 'test',
      title: '🧪 Send Test Notification',
      description: 'Send and receive a real FCM notification',
      status: 'pending'
    }
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const logMessage = `${new Date().toLocaleTimeString()}: ${emoji} ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const updateStepStatus = (stepId: string, status: SetupStep['status'], errorMessage?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, errorMessage }
        : step
    ));
  };

  // Step 1: Check Firebase Configuration
  const checkFirebaseConfig = async () => {
    updateStepStatus('config', 'in_progress');
    addLog('Checking Firebase configuration...');

    try {
      const isConfigured = isFirebaseConfigured();
      
      if (isConfigured) {
        addLog('Firebase configuration is valid', 'success');
        updateStepStatus('config', 'completed');
        return true;
      } else {
        addLog('Firebase configuration is missing or invalid', 'error');
        updateStepStatus('config', 'error', 'Missing environment variables');
        return false;
      }
    } catch (error) {
      addLog(`Configuration check failed: ${error}`, 'error');
      updateStepStatus('config', 'error', String(error));
      return false;
    }
  };

  // Step 2: Request Notification Permissions
  const requestPermissions = async () => {
    updateStepStatus('permissions', 'in_progress');
    addLog('Requesting notification permissions...');

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        addLog('Notification permissions granted', 'success');
        updateStepStatus('permissions', 'completed');
        return true;
      } else {
        addLog(`Permission denied: ${permission}`, 'error');
        updateStepStatus('permissions', 'error', `Permission: ${permission}`);
        return false;
      }
    } catch (error) {
      addLog(`Permission request failed: ${error}`, 'error');
      updateStepStatus('permissions', 'error', String(error));
      return false;
    }
  };

  // Step 3: Generate FCM Token
  const generateFCMToken = async () => {
    updateStepStatus('token', 'in_progress');
    addLog('Generating FCM token...');

    try {
      const token = await getFCMToken();
      
      if (token) {
        setFCMToken(token);
        addLog(`FCM token generated: ${token.substring(0, 20)}...`, 'success');
        updateStepStatus('token', 'completed');
        return token;
      } else {
        addLog('Failed to generate FCM token', 'error');
        updateStepStatus('token', 'error', 'Token generation failed');
        return null;
      }
    } catch (error) {
      addLog(`Token generation error: ${error}`, 'error');
      updateStepStatus('token', 'error', String(error));
      return null;
    }
  };

  // Step 4: Save to Database
  const saveToDatabase = async (token: string) => {
    if (!user) {
      addLog('User not authenticated', 'error');
      updateStepStatus('database', 'error', 'User not authenticated');
      return false;
    }

    updateStepStatus('database', 'in_progress');
    addLog('Saving FCM token to database...');

    try {
      // For FCM, we need to create dummy keys since it's different from web push
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: token,
          keys: {
            p256dh: 'fcm-placeholder-p256dh',
            auth: 'fcm-placeholder-auth'
          },
          platform: 'fcm',
          user_id: user.entra_id
        })
      });

      if (response.ok) {
        addLog('FCM token saved to database', 'success');
        updateStepStatus('database', 'completed');
        return true;
      } else {
        const error = await response.text();
        addLog(`Database save failed: ${error}`, 'error');
        updateStepStatus('database', 'error', error);
        return false;
      }
    } catch (error) {
      addLog(`Database save error: ${error}`, 'error');
      updateStepStatus('database', 'error', String(error));
      return false;
    }
  };

  // Step 5: Send Test Notification
  const sendTestNotification = async () => {
    if (!user) {
      addLog('User not authenticated', 'error');
      updateStepStatus('test', 'error', 'User not authenticated');
      return false;
    }

    updateStepStatus('test', 'in_progress');
    addLog('Sending test FCM notification...');

    try {
      const response = await fetch('/api/notifications/fcm-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.entra_id,
          type: 'setup_test'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addLog('Test notification sent successfully!', 'success');
        addLog('🔍 Check your device for the notification', 'info');
        updateStepStatus('test', 'completed');
        return true;
      } else {
        addLog(`Test notification failed: ${result.message || result.error}`, 'error');
        updateStepStatus('test', 'error', result.message || result.error);
        return false;
      }
    } catch (error) {
      addLog(`Test notification error: ${error}`, 'error');
      updateStepStatus('test', 'error', String(error));
      return false;
    }
  };

  // Run setup wizard
  const runSetupWizard = async () => {
    addLog('🚀 Starting Firebase setup wizard...');
    
    // Step 1: Configuration
    const configOk = await checkFirebaseConfig();
    if (!configOk) return;

    // Step 2: Permissions
    const permissionsOk = await requestPermissions();
    if (!permissionsOk) return;

    // Step 3: Token
    const token = await generateFCMToken();
    if (!token) return;

    // Step 4: Database
    const databaseOk = await saveToDatabase(token);
    if (!databaseOk) return;

    // Step 5: Test
    await sendTestNotification();

    addLog('🎉 Firebase setup wizard completed!', 'success');
  };

  // Setup foreground listener on mount
  useEffect(() => {
    setupForegroundListener((payload) => {
      addLog(`📨 Foreground message: ${payload.notification?.title}`, 'success');
    });
  }, []);

  const StepIcon = ({ status }: { status: SetupStep['status'] }) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === 'in_progress') return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Cloud className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Firebase Cloud Messaging Setup</h2>
      </div>

      {/* Setup Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
            <StepIcon status={step.status} />
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
              {step.status === 'error' && step.errorMessage && (
                <p className="text-sm text-red-600 mt-1">❌ {step.errorMessage}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={runSetupWizard}
          disabled={steps.some(s => s.status === 'in_progress')}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {steps.some(s => s.status === 'in_progress') ? 'Setup Running...' : '🚀 Start Firebase Setup'}
        </button>

        {fcmToken && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ FCM Token Generated</h4>
            <p className="text-sm text-green-700 font-mono break-all">
              {fcmToken.substring(0, 50)}...
            </p>
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-800 mb-3">📋 Setup Logs</h3>
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 