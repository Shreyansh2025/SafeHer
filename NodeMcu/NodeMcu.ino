#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "wifi";
const char* password = "host1313";

const char* serverUrl =
  "http://10.182.190.125:3000/api/iot/sos";

const char* deviceKey =
  "SafeHer_IOT_2026";

#define SOS_PIN 13   // D7

bool ready = false;

void setup() {
  Serial.begin(115200);

  pinMode(SOS_PIN, INPUT);

  WiFi.begin(ssid, password);

  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.println(WiFi.localIP());
}

void loop() {

  int signal = digitalRead(SOS_PIN);

  // Don't trigger until normal HIGH state is detected
  if (!ready) {
    if (signal == HIGH) {
      ready = true;
      Serial.println("SYSTEM READY");
    }
    delay(50);
    return;
  }

  // LOW = actual SOS
  if (signal == LOW) {

    Serial.println("🚨 SOS RECEIVED!");

    WiFiClient client;
    HTTPClient http;

    http.begin(client, serverUrl);

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-key", deviceKey);

    String body =
      "{\"userId\":1,"
      "\"latitude\":22.7196,"
      "\"longitude\":75.8577,"
      "\"address\":\"IoT device location\"}";

    int responseCode = http.POST(body);

    Serial.print("HTTP Response: ");
    Serial.println(responseCode);

    Serial.println(http.getString());

    http.end();

    // Wait for Arduino to return HIGH
    while (digitalRead(SOS_PIN) == LOW) {
      delay(50);
    }

    Serial.println("SOS END");

    delay(1000);
  }
}