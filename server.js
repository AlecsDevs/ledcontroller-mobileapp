// server.js - Node.js server to bridge USB serial communication
const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Arduino connection
let arduinoPort = null;
let parser = null;
let isConnected = false;
let ledStates = [false, false, false, false, false]; // Pins 2-6

// Find and connect to Arduino
async function connectToArduino() {
  try {
    console.log('Searching for Arduino...');
    
    // List all available ports
    const ports = await SerialPort.list();
    console.log('Available ports:', ports.map(p => ({ path: p.path, manufacturer: p.manufacturer })));
    
    // Try to find Arduino (look for common Arduino manufacturers)
    const arduinoPort = ports.find(port => 
      port.manufacturer && (
        port.manufacturer.includes('Arduino') ||
        port.manufacturer.includes('FTDI') ||
        port.manufacturer.includes('CH340') ||
        port.manufacturer.includes('CP210') ||
        port.manufacturer.includes('wch.cn') ||
        port.manufacturer.includes('QinHeng')
      )
    );
    
    if (!arduinoPort) {
      // If auto-detection fails, try COM5 (based on your output)
      const fallbackPort = ports.find(port => port.path === 'COM5');
      if (fallbackPort) {
        console.log('Auto-detection failed, trying COM5...');
        return await connectToPort('COM5');
      }
      
      console.log('Arduino not found. Please ensure Arduino is connected via USB.');
      console.log('Available ports:', ports.map(p => `${p.path} (${p.manufacturer})`));
      return false;
    }
    
    console.log(`Connecting to Arduino on ${arduinoPort.path}...`);
    
    return await connectToPort(arduinoPort.path);
    
  } catch (error) {
    console.error('Failed to connect to Arduino:', error);
    return false;
  }
}

// Helper function to connect to a specific port
async function connectToPort(portPath) {
  try {
    console.log(`Attempting connection to ${portPath}...`);
    
    // Create serial port connection
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
    });
    
    // Create parser for reading lines
    const lineParser = new ReadlineParser({ delimiter: '\n' });
    port.pipe(lineParser);
    
    // Handle connection events
    port.on('open', () => {
      console.log('Serial port opened successfully');
      arduinoPort = port;
      parser = lineParser;
      isConnected = true;
      
      // Setup data listener
      parser.on('data', handleArduinoData);
      
      console.log('Arduino connected and ready!');
    });
    
    port.on('error', (err) => {
      console.error('Serial port error:', err);
      isConnected = false;
    });
    
    port.on('close', () => {
      console.log('Serial port closed');
      isConnected = false;
      arduinoPort = null;
      parser = null;
    });
    
    return true;
    
  } catch (error) {
    console.error(`Failed to connect to ${portPath}:`, error);
    return false;
  }
}

// Handle data from Arduino
function handleArduinoData(data) {
  const message = data.toString().trim();
  console.log('Arduino:', message);
  
  // Parse LED state changes
  if (message.includes('Pin') && (message.includes('ON') || message.includes('OFF'))) {
    const pinMatch = message.match(/Pin (\d+) (ON|OFF)/);
    if (pinMatch) {
      const pin = parseInt(pinMatch[1]);
      const state = pinMatch[2] === 'ON';
      const index = pin - 2;
      
      if (index >= 0 && index < 5) {
        ledStates[index] = state;
        console.log(`Updated LED state: Pin ${pin} = ${state}`);
      }
    }
  }
  
  // Handle ALL ON/OFF commands
  if (message.includes('All LEDs ON')) {
    ledStates = [true, true, true, true, true];
    console.log('All LEDs turned ON');
  }
  
  if (message.includes('All LEDs OFF')) {
    ledStates = [false, false, false, false, false];
    console.log('All LEDs turned OFF');
  }
}

// Send command to Arduino
function sendArduinoCommand(command) {
  return new Promise((resolve, reject) => {
    if (!isConnected || !arduinoPort) {
      reject(new Error('Arduino not connected'));
      return;
    }
    
    console.log(`Sending command: ${command}`);
    
    arduinoPort.write(command + '\n', (err) => {
      if (err) {
        console.error('Write error:', err);
        reject(err);
      } else {
        console.log(`Command sent: ${command}`);
        resolve();
      }
    });
  });
}

// API Routes

// Get status
app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    ledStates: ledStates,
    timestamp: new Date().toISOString()
  });
});

// Send command
app.post('/command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    if (!isConnected) {
      return res.status(503).json({ error: 'Arduino not connected' });
    }
    
    await sendArduinoCommand(command);
    
    // Wait a bit for Arduino to process and respond
    setTimeout(() => {
      res.json({
        success: true,
        command: command,
        ledStates: ledStates,
        timestamp: new Date().toISOString()
      });
    }, 100);
    
  } catch (error) {
    console.error('Command error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get LED states
app.get('/leds', (req, res) => {
  res.json({
    ledStates: ledStates,
    pins: [2, 3, 4, 5, 6],
    timestamp: new Date().toISOString()
  });
});

// Individual LED control
app.post('/led/:pin', async (req, res) => {
  try {
    const pin = parseInt(req.params.pin);
    const { state } = req.body; // true for ON, false for OFF
    
    if (pin < 2 || pin > 6) {
      return res.status(400).json({ error: 'Pin must be between 2 and 6' });
    }
    
    const command = state ? `ON${pin}` : `OFF${pin}`;
    await sendArduinoCommand(command);
    
    setTimeout(() => {
      res.json({
        success: true,
        pin: pin,
        state: state,
        ledStates: ledStates
      });
    }, 100);
    
  } catch (error) {
    console.error('LED control error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reconnect to Arduino
app.post('/reconnect', async (req, res) => {
  try {
    if (arduinoPort) {
      arduinoPort.close();
    }
    
    const connected = await connectToArduino();
    
    res.json({
      success: connected,
      message: connected ? 'Arduino reconnected' : 'Failed to reconnect to Arduino'
    });
    
  } catch (error) {
    console.error('Reconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Arduino LED Controller Server running on port ${PORT}`);
  console.log(`Mobile app should connect to: http://localhost:${PORT}`);
  
  // Try to connect to Arduino on startup
  await connectToArduino();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  if (arduinoPort) {
    arduinoPort.close();
  }
  process.exit(0);
});

// Export for testing
module.exports = app;