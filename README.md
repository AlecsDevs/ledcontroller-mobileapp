# 🔌 LED Controller Mobile App

A simple React Native mobile application that connects to an **Arduino Uno R3** through an **Express.js** backend. The app allows users to control an LED remotely — a foundational IoT project to learn hardware and mobile integration.

![LED Controller Demo](https://github.com/AlecsDevs/ledcontroller-mobileapp/blob/65405a7d9188f9d4384fb5df5e1ce6a398c43872/Led-controller.jpg)

## 🚀 Features

- Control an LED connected to an Arduino Uno R3
- React Native mobile interface built with Expo
- Express.js backend server to handle requests
- Serial communication with Arduino Uno R3

## 🛠 Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Node.js + Express.js
- **Hardware:** Arduino Uno R3 (USB Serial)

## ⚙️ How It Works

1. The React Native app sends commands (`ON`, `OFF`) to the Express backend.
2. The Express server communicates with the Arduino Uno R3 via USB serial.
3. The Arduino turns the LED on or off based on the received command.

## 📱 Mobile App Setup

```bash
git clone https://github.com/AlecsDevs/ledcontroller-mobileapp.git
cd ledcontroller-mobileapp
npm install
npm start
