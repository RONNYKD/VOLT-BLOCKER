/**
 * Migration Test Component
 * A simple component to test and trigger data migration
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { userLoginMigrationService, testUserMigration, discoverLegacyData } from '../services';

interface MigrationTestComponentProps {
  currentUserId?: string;
}

export const MigrationTestComponent: React.FC<MigrationTestComponentProps> = ({ 
  currentUserId 
}) => {
  const [userId, setUserId] = useState(currentUserId || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDiscoverTables = async () => {
    setLoading(true);
    addLog('🔍 Discovering legacy tables...');
    
    try {
      const tables = await discoverLegacyData();
      addLog(`📋 Found ${tables.length} tables: ${tables.join(', ')}`);
      setResults({ type: 'tables', data: tables });
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMigrationStatus = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    setLoading(true);
    addLog(`🔍 Checking migration status for user: ${userId}`);
    
    try {
      const status = await userLoginMigrationService.checkMigrationStatus(userId);
      addLog(`📊 Migration status: ${JSON.stringify(status, null, 2)}`);
      setResults({ type: 'status', data: status });
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMigration = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    setLoading(true);
    addLog(`🧪 Testing migration for user: ${userId}`);
    
    try {
      const result = await testUserMigration(userId);
      addLog(`✅ Migration test completed: ${JSON.stringify(result, null, 2)}`);
      setResults({ type: 'migration', data: result });
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateLogin = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    setLoading(true);
    addLog(`🔐 Simulating login for user: ${userId}`);
    
    try {
      const result = await userLoginMigrationService.handleUserLogin(userId);
      addLog(`🎉 Login result: ${result.message}`);
      addLog(`📊 Details: ${JSON.stringify(result, null, 2)}`);
      setResults({ type: 'login', data: result });
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceMigration = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter a user ID');
      return;
    }

    Alert.alert(
      'Force Migration',
      'This will force migrate data even if it already exists. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: async () => {
            setLoading(true);
            addLog(`🔄 Force migrating data for user: ${userId}`);
            
            try {
              const result = await userLoginMigrationService.forceMigration(userId);
              addLog(`✅ Force migration completed: ${JSON.stringify(result, null, 2)}`);
              setResults({ type: 'force', data: result });
            } catch (error) {
              addLog(`❌ Error: ${error}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const clearLogs = () => {
    setLogs([]);
    setResults(null);
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        🔄 Migration Test Tool
      </Text>

      {/* User ID Input */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          User ID:
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            backgroundColor: 'white',
            fontSize: 16
          }}
          value={userId}
          onChangeText={setUserId}
          placeholder=\"Enter user ID to test migration\"
          autoCapitalize=\"none\"
        />
      </View>

      {/* Action Buttons */}
      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            opacity: loading ? 0.6 : 1
          }}
          onPress={handleDiscoverTables}
          disabled={loading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            🔍 Discover Legacy Tables
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            opacity: loading || !userId.trim() ? 0.6 : 1
          }}
          onPress={handleCheckMigrationStatus}
          disabled={loading || !userId.trim()}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            📊 Check Migration Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#FF9500',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            opacity: loading || !userId.trim() ? 0.6 : 1
          }}
          onPress={handleTestMigration}
          disabled={loading || !userId.trim()}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            🧪 Test Migration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#32D74B',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            opacity: loading || !userId.trim() ? 0.6 : 1
          }}
          onPress={handleSimulateLogin}
          disabled={loading || !userId.trim()}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            🔐 Simulate Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#FF3B30',
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            opacity: loading || !userId.trim() ? 0.6 : 1
          }}
          onPress={handleForceMigration}
          disabled={loading || !userId.trim()}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            🔄 Force Migration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#8E8E93',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16
          }}
          onPress={clearLogs}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
            🗑️ Clear Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Display */}
      {results && (
        <View style={{
          backgroundColor: 'white',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#ddd'
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
            📊 Results ({results.type}):
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'monospace', color: '#333' }}>
            {JSON.stringify(results.data, null, 2)}
          </Text>
        </View>
      )}

      {/* Logs Display */}
      {logs.length > 0 && (
        <View style={{
          backgroundColor: '#1C1C1E',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}>
          <Text style={{ color: '#00FF00', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            📝 Console Logs:
          </Text>
          {logs.map((log, index) => (
            <Text key={index} style={{ 
              color: '#00FF00', 
              fontSize: 12, 
              fontFamily: 'monospace',
              marginBottom: 4
            }}>
              {log}
            </Text>
          ))}
        </View>
      )}

      {loading && (
        <View style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ color: 'white', fontSize: 18 }}>
            ⏳ Processing...
          </Text>
        </View>
      )}
    </ScrollView>
  );
};