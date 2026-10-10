
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = "wifi";
const char* password = "host1313";

const char* serverUrl =
  "https://safeher-ji7r.onrender.com/api/iot/sos";

const char* deviceKey = "SafeHer_IOT_2026";

#define SOS_PIN 13  // D7

bool ready = false;

void setup() {
  Serial.begin(115200);
  pinMode(SOS_PIN, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.println(WiFi.localIP());
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

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure();  // Testing only
      HTTPClient https;

      if (https.begin(client, serverUrl)) {
        https.addHeader("Content-Type", "application/json");
        https.addHeader("x-device-key", deviceKey);

        String body =
          "{\"userId\":1,"
          "\"latitude\":22.7196,"
          "\"longitude\":75.8577,"
          "\"address\":\"IoT device location\"}";

        int responseCode = https.POST(body);

        Serial.print("HTTP Response: ");
        Serial.println(responseCode);
        Serial.println(https.getString());

        https.end();
      } else {
        Serial.println("HTTPS connection failed");
      }
    } else {
      Serial.println("WiFi disconnected");
    }

    while (digitalRead(SOS_PIN) == LOW) {
      delay(50);
    }

    Serial.println("SOS END");
    delay(1000);
  }
}
