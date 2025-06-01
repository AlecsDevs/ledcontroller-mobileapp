// Arduino LED Controller Pro with Sound
// Pins 2-6 controller with buzzer and special effects
// Compatible with LED Controller Pro web interface

// Define the LED pins (Arduino digital pins)
const int ledPins[] = {2, 3, 4, 5, 6};
const int numPins = 5;

// Buzzer pin (connect buzzer to pin 8)
const int buzzerPin = 8;

String inputString = "";
boolean stringComplete = false;

// LED states
boolean ledStates[] = {false, false, false, false, false};

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Initialize all LED pins as outputs and set them LOW
  for (int i = 0; i < numPins; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
    ledStates[i] = false;
  }
  
  // Initialize buzzer pin
  pinMode(buzzerPin, OUTPUT);
  
  // Welcome beep sequence
  playStartupBeep();
  
  // Send ready message
  Serial.println("Arduino LED Controller Pro Ready!");
  Serial.println("Commands: ON2-ON6, OFF2-OFF6, ALLON, ALLOFF");
  Serial.println("Special Effects: RAINBOW, BLINK, WAVE, RANDOM");
  Serial.println("Buzzer connected to pin 8");
}

void loop() {
  // Check for serial input
  if (stringComplete) {
    processCommand(inputString);
    
    // Clear the string for next command
    inputString = "";
    stringComplete = false;
  }
  
  // Small delay to prevent overwhelming the processor
  delay(10);
}

// Function to process incoming commands
void processCommand(String command) {
  command.trim(); // Remove any whitespace
  command.toUpperCase(); // Convert to uppercase for consistency
  
  Serial.println("Received: " + command);
  
  // Individual LED control commands
  if (command.startsWith("ON")) {
    int pin = command.substring(2).toInt();
    turnOnPin(pin);
  }
  else if (command.startsWith("OFF")) {
    int pin = command.substring(3).toInt();
    turnOffPin(pin);
  }
  // Master control commands
  else if (command == "ALLON") {
    turnAllOn();
  }
  else if (command == "ALLOFF") {
    turnAllOff();
  }
  // Special effects
  else if (command == "RAINBOW") {
    rainbowEffect();
  }
  else if (command == "BLINK") {
    blinkEffect();
  }
  else if (command == "WAVE") {
    waveEffect();
  }
  else if (command == "RANDOM") {
    randomEffect();
  }
  // Unknown command
  else {
    Serial.println("Unknown command: " + command);
    playErrorBeep();
  }
}

// Turn on specific pin
void turnOnPin(int pin) {
  if (pin >= 2 && pin <= 6) {
    int index = pin - 2;
    digitalWrite(pin, HIGH);
    ledStates[index] = true;
    Serial.println("Pin " + String(pin) + " ON");
    playBeep(800, 100); // Success beep
  } else {
    Serial.println("Invalid pin: " + String(pin));
    playErrorBeep();
  }
}

// Turn off specific pin
void turnOffPin(int pin) {
  if (pin >= 2 && pin <= 6) {
    int index = pin - 2;
    digitalWrite(pin, LOW);
    ledStates[index] = false;
    Serial.println("Pin " + String(pin) + " OFF");
    playBeep(600, 100); // Success beep (lower tone)
  } else {
    Serial.println("Invalid pin: " + String(pin));
    playErrorBeep();
  }
}

// Turn all LEDs on
void turnAllOn() {
  for (int i = 0; i < numPins; i++) {
    digitalWrite(ledPins[i], HIGH);
    ledStates[i] = true;
    delay(50); // Staggered turn-on effect
  }
  Serial.println("All LEDs ON");
  playBeep(1000, 200); // Success melody
}

// Turn all LEDs off
void turnAllOff() {
  for (int i = numPins - 1; i >= 0; i--) {
    digitalWrite(ledPins[i], LOW);
    ledStates[i] = false;
    delay(50); // Staggered turn-off effect
  }
  Serial.println("All LEDs OFF");
  playBeep(500, 200); // Success melody (lower tone)
}

// Rainbow effect - sequential LED activation
void rainbowEffect() {
  Serial.println("Rainbow Effect Started");
  playBeep(900, 150);
  
  // Turn off all LEDs first
  turnAllOff();
  delay(200);
  
  // Cycle through each LED
  for (int cycle = 0; cycle < 2; cycle++) {
    for (int i = 0; i < numPins; i++) {
      digitalWrite(ledPins[i], HIGH);
      delay(300);
      digitalWrite(ledPins[i], LOW);
      delay(100);
    }
  }
  
  Serial.println("Rainbow Effect Complete");
}

// Blink effect - all LEDs blink together
void blinkEffect() {
  Serial.println("Blink Effect Started");
  playBeep(750, 100);
  
  for (int i = 0; i < 5; i++) {
    // Turn all on
    for (int j = 0; j < numPins; j++) {
      digitalWrite(ledPins[j], HIGH);
    }
    delay(200);
    
    // Turn all off
    for (int j = 0; j < numPins; j++) {
      digitalWrite(ledPins[j], LOW);
    }
    delay(200);
  }
  
  // Restore original states
  restoreStates();
  Serial.println("Blink Effect Complete");
}

// Wave effect - back and forth wave pattern
void waveEffect() {
  Serial.println("Wave Effect Started");
  playBeep(650, 100);
  
  // Turn off all LEDs first
  turnAllOff();
  
  // Wave forward and backward
  for (int wave = 0; wave < 3; wave++) {
    // Forward wave
    for (int i = 0; i < numPins; i++) {
      if (i > 0) digitalWrite(ledPins[i-1], LOW);
      digitalWrite(ledPins[i], HIGH);
      delay(150);
    }
    
    // Backward wave
    for (int i = numPins - 2; i >= 0; i--) {
      digitalWrite(ledPins[i+1], LOW);
      digitalWrite(ledPins[i], HIGH);
      delay(150);
    }
  }
  
  // Turn off the last LED
  digitalWrite(ledPins[0], LOW);
  
  Serial.println("Wave Effect Complete");
}

// Random effect - random LED patterns
void randomEffect() {
  Serial.println("Random Effect Started");
  playBeep(850, 100);
  
  // Random pattern for 3 seconds
  unsigned long startTime = millis();
  while (millis() - startTime < 3000) {
    int randomPin = random(0, numPins);
    boolean randomState = random(0, 2);
    
    digitalWrite(ledPins[randomPin], randomState ? HIGH : LOW);
    delay(100);
  }
  
  // Restore original states
  restoreStates();
  Serial.println("Random Effect Complete");
}

// Restore LED states after effects
void restoreStates() {
  for (int i = 0; i < numPins; i++) {
    digitalWrite(ledPins[i], ledStates[i] ? HIGH : LOW);
  }
}

// Buzzer functions
void playBeep(int frequency, int duration) {
  tone(buzzerPin, frequency, duration);
  delay(duration + 10);
}

void playStartupBeep() {
  // Startup melody
  playBeep(523, 200); // C
  playBeep(659, 200); // E
  playBeep(784, 200); // G
  playBeep(1047, 300); // High C
}

void playErrorBeep() {
  // Error sound - low frequency beeps
  for (int i = 0; i < 3; i++) {
    playBeep(200, 150);
    delay(50);
  }
}

// Serial event function - called when data is available
void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

// Additional utility functions
void statusReport() {
  Serial.println("=== LED Status Report ===");
  for (int i = 0; i < numPins; i++) {
    Serial.println("Pin " + String(ledPins[i]) + ": " + 
                  (ledStates[i] ? "ON" : "OFF"));
  }
  Serial.println("========================");
}

// Test sequence for troubleshooting
void testSequence() {
  Serial.println("Running test sequence...");
  
  // Test each LED individually
  for (int i = 0; i < numPins; i++) {
    Serial.println("Testing Pin " + String(ledPins[i]));
    digitalWrite(ledPins[i], HIGH);
    playBeep(440 + (i * 100), 300);
    delay(500);
    digitalWrite(ledPins[i], LOW);
    delay(200);
  }
  
  Serial.println("Test sequence complete!");
}
