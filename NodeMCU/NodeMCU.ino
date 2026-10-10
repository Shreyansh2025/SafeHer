#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = "wifi";
const char* password = "host1313";

const char* serverUrl =
  "https://safeher-ji7r.onrender.com/api/iot/sos";

const char* statusUrl =
  "https://safeher-ji7r.onrender.com/api/iot/status?userId=1";

const char* deviceKey = "SafeHer_IOT_2026";

#define SOS_PIN 13       // D7: SOS input from Arduino
#define STATUS_OUT 12    // D6: status output to Arduino

bool ready = false;
unsigned long lastStatusCheck = 0;

void setup() {
  Serial.begin(115200);

  pinMode(SOS_PIN, INPUT);
  pinMode(STATUS_OUT, OUTPUT);
  digitalWrite(STATUS_OUT, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.println(WiFi.localIP());
  checkStatus();
}

void checkStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();  // Testing only
  HTTPClient https;

  if (!https.begin(client, statusUrl)) return;

  https.addHeader("x-device-key", deviceKey);

  int code = https.GET();
  if (code == 200) {
    String response = https.getString();
    Serial.println(response);

    // Backend JSON includes "active":true or "active":false.
    if (response.indexOf("\"active\":true") >= 0) {
      digitalWrite(STATUS_OUT, HIGH);
    } else if (response.indexOf("\"active\":false") >= 0) {
      digitalWrite(STATUS_OUT, LOW);
    }
  } else {
    Serial.printf("Status HTTP: %d\n", code);
  }

  https.end();
}

void sendSOS() {
  WiFiClientSecure client;
  client.setInsecure();  // Testing only
  HTTPClient https;

  if (!https.begin(client, serverUrl)) {
    Serial.println("HTTPS connection failed");
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-device-key", deviceKey);

  String body =
    "{\"userId\":1,"
    "\"latitude\":22.7196,"
    "\"longitude\":75.8577,"
    "\"address\":\"IoT device location\"}";

  int code = https.POST(body);

  Serial.printf("SOS HTTP Response: %d\n", code);
  Serial.println(https.getString());

  https.end();

  // Refresh status after triggering.
  checkStatus();
}

void loop() {
  int signal = digitalRead(SOS_PIN);

  if (!ready) {
    if (signal == HIGH) {
      ready = true;
      Serial.println("SYSTEM READY");
    }
    delay(50);
    return;
  }

  if (signal == LOW) {
    Serial.println("SOS RECEIVED!");
    
    sendSOS();

    while (digitalRead(SOS_PIN) == LOW) {
      delay(50);
    }

    Serial.println("SOS END");
  }

  if (millis() - lastStatusCheck >= 5000) {
    lastStatusCheck = millis();
    checkStatus();
  }

  delay(20);
}

