# Watchtower

Watchtower is a browser fingerprinting library used to identify bots and AI agents. Watchtower creates a unique session ID for each visit and sends the data to the Parados backend to be analyzed.


## Browser Fingerprinting Capabilities

| Category | Data Points Collected | Description |
|----------|----------------------|-------------|
| Basic Information | User Agent, Language, Platform | Collects basic browser and system information |
| Hardware | Hardware Concurrency, Device Memory | Identifies device hardware characteristics |
| Display | Screen Resolution, Color Depth | Captures screen characteristics |
| Time Settings | Timezone Offset, Timezone | Determines user's approximate time configurations |
| Input Capabilities | Touch Support | Detects if device supports touch input |
| Storage | Cookie Enabled, Local Storage, Session Storage, IndexedDB | Checks browser storage capabilities |
| Canvas Fingerprinting | Canvas Rendering | Creates a hash based on how the browser renders graphics |
| Audio Fingerprinting | Audio Context | Generates a hash based on audio processing characteristics |
| Font Detection | Available Fonts | Lists fonts installed |
| Battery Information | Charging Status, Level, Charging/Discharging Time | Collects battery status information |
| Media Devices | Connected Devices | Lists available audio/video input/output devices |
| WebGL Information | WebGL Vendor | Identifies graphics hardware vendor |
| Browser Plugins | Plugin List | Enumerates plugins |
| Privacy Settings | Do Not Track | Checks if Do Not Track is enabled |
| User Behavior | Mouse/Touch Movement Trails | Identifies bot-like cursor movement patterns |
| Navigation | Current URL, Referrer | Tracks page navigation information |