// App.js - Main React Native Expo App
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SERVER_URL = 'http://192.168.100.29:3001'; // Your computer's IP address

// Pin color configuration
const PIN_COLORS = {
  2: { name: 'Red', color: '#FF4444', lightColor: '#FF6B6B' },
  3: { name: 'Green', color: '#44FF44', lightColor: '#4ECDC4' },
  4: { name: 'Yellow', color: '#FFFF44', lightColor: '#FFD700' },
  5: { name: 'White', color: '#FFFFFF', lightColor: '#F8F8F8' },
  6: { name: 'Blue', color: '#4444FF', lightColor: '#45B7D1' },
};

// Theme configurations
const THEMES = {
  dark: {
    background: '#0f0f23',
    headerBg: '#1a1a2e',
    cardBg: '#2a2a2a',
    text: '#FFFFFF',
    textSecondary: '#888888',
    border: '#444444',
    accent: '#4ECDC4',
    surface: '#16213e',
  },
  light: {
    background: '#F5F5F5',
    headerBg: '#FFFFFF',
    cardBg: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0',
    accent: '#2196F3',
    surface: '#E8E8E8',
  }
};

export default function App() {
  const [ledStates, setLedStates] = useState([false, false, false, false, false]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = THEMES[isDarkMode ? 'dark' : 'light'];

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/status`);
      if (response.ok) {
        setIsConnected(true);
        const data = await response.json();
        if (data.ledStates) {
          setLedStates(data.ledStates);
        }
      }
    } catch (error) {
      setIsConnected(false);
      console.log('Connection check failed:', error);
    }
  };

  const sendCommand = async (command) => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to Arduino server');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ledStates) {
          setLedStates(data.ledStates);
        }
      } else {
        Alert.alert('Error', 'Failed to send command');
      }
    } catch (error) {
      Alert.alert('Error', 'Communication failed');
      console.error('Command failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLED = (pin) => {
    const index = pin - 2;
    const command = ledStates[index] ? `OFF${pin}` : `ON${pin}`;
    sendCommand(command);
  };

  const sendSpecialEffect = (effect) => {
    sendCommand(effect);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const LEDButton = ({ pin, isOn, onPress }) => {
    const pinConfig = PIN_COLORS[pin];
    const buttonColor = isOn ? pinConfig.color : theme.cardBg;
    const borderColor = isOn ? pinConfig.lightColor : theme.border;
    const textColor = isOn ? (pin === 5 ? '#333' : '#FFF') : theme.text;

    return (
      <TouchableOpacity
        style={[
          styles.ledButton,
          {
            backgroundColor: buttonColor,
            borderColor: borderColor,
          }
        ]}
        onPress={onPress}
        disabled={isLoading}
      >
        <Ionicons 
          name={isOn ? "bulb" : "bulb-outline"} 
          size={30} 
          color={isOn ? (pin === 5 ? '#333' : '#FFF') : theme.textSecondary} 
        />
        <Text style={[styles.ledButtonText, { color: textColor }]}>
          {pinConfig.name}
        </Text>
        <Text style={[styles.ledStatusText, { color: textColor }]}>
          {isOn ? "ON" : "OFF"}
        </Text>
      </TouchableOpacity>
    );
  };

  const EffectButton = ({ title, command, icon, color }) => (
    <TouchableOpacity
      style={[styles.effectButton, { backgroundColor: color }]}
      onPress={() => sendSpecialEffect(command)}
      disabled={isLoading}
    >
      <Ionicons name={icon} size={24} color="white" />
      <Text style={styles.effectButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.headerBg,
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.surface,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    brandTitle: {
      color: theme.accent,
      fontSize: 24,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
      opacity: 0.8,
    },
    statusText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    reconnectButton: {
      backgroundColor: theme.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
    },
    loadingText: {
      color: theme.textSecondary,
      marginTop: 10,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.headerBg} 
      />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="hardware-chip" size={32} color={theme.accent} />
          <View style={styles.headerTextContainer}>
            <Text style={dynamicStyles.brandTitle}>AlecsDevs</Text>
            <Text style={dynamicStyles.headerTitle}>Arduino LED Controller</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
            <Text style={dynamicStyles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: theme.surface }]}
            onPress={toggleTheme}
          >
            <Ionicons 
              name={isDarkMode ? "sunny" : "moon"} 
              size={20} 
              color={theme.accent} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Connection</Text>
          <TouchableOpacity 
            style={dynamicStyles.reconnectButton} 
            onPress={checkConnection}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.reconnectButtonText}>Check Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Individual LED Control */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Individual LED Control</Text>
          <View style={styles.ledGrid}>
            {[2, 3, 4, 5, 6].map((pin, index) => (
              <LEDButton
                key={pin}
                pin={pin}
                isOn={ledStates[index]}
                onPress={() => toggleLED(pin)}
              />
            ))}
          </View>
        </View>

        {/* Master Controls */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Master Controls</Text>
          <View style={styles.masterControls}>
            <TouchableOpacity
              style={[styles.masterButton, styles.allOnButton]}
              onPress={() => sendCommand('ALLON')}
              disabled={isLoading}
            >
              <Ionicons name="sunny" size={24} color="white" />
              <Text style={styles.masterButtonText}>ALL ON</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.masterButton, styles.allOffButton]}
              onPress={() => sendCommand('ALLOFF')}
              disabled={isLoading}
            >
              <Ionicons name="moon" size={24} color="white" />
              <Text style={styles.masterButtonText}>ALL OFF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Effects */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Special Effects</Text>
          <View style={styles.effectsGrid}>
            <EffectButton
              title="Rainbow"
              command="RAINBOW"
              icon="color-palette"
              color="#FF6B6B"
            />
            <EffectButton
              title="Blink"
              command="BLINK"
              icon="flash"
              color="#4ECDC4"
            />
            <EffectButton
              title="Wave"
              command="WAVE"
              icon="pulse"
              color="#45B7D1"
            />
            <EffectButton
              title="Random"
              command="RANDOM"
              icon="shuffle"
              color="#96CEB4"
            />
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={dynamicStyles.loadingText}>Sending command...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4ECDC4',
  },
  disconnected: {
    backgroundColor: '#FF6B6B',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  reconnectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ledGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ledButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  ledButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  ledStatusText: {
    fontSize: 8,
    fontWeight: '600',
  },
  masterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  masterButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  allOnButton: {
    backgroundColor: '#4ECDC4',
  },
  allOffButton: {
    backgroundColor: '#FF6B6B',
  },
  masterButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  effectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
});