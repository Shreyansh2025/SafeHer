
#define BUTTON 2
#define BUZZER 8
#define SIGNAL 3
#define RED_LED 5  // Use D5 for red LED instead; see note below
#define GREEN_LED 6
#define STATUS_PIN 3

bool sosActive = false;
bool backendConfirmedActive = false;

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(SIGNAL, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(STATUS_PIN, INPUT);

  digitalWrite(SIGNAL, HIGH);
  digitalWrite(RED_LED, LOW);
  digitalWrite(GREEN_LED, HIGH);
}

void emergencySiren() {
  for (int i = 0; i < 10; i++) {
    tone(BUZZER, 1800);
    delay(250);
    tone(BUZZER, 1000);
    delay(250);
  }
  noTone(BUZZER);
}

void loop() {
  if (!sosActive && digitalRead(BUTTON) == LOW) {
    sosActive = true;
    backendConfirmedActive = false;

    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);

    digitalWrite(SIGNAL, LOW);
    emergencySiren();
    digitalWrite(SIGNAL, HIGH);

    while (digitalRead(BUTTON) == LOW) {
      delay(20);
    }
  }

  if (sosActive) {
    // Wait until NodeMCU confirms the backend SOS is active.
    if (digitalRead(STATUS_PIN) == HIGH) {
      backendConfirmedActive = true;
    }

    // After active was confirmed, LOW means backend reports resolved.
    if (backendConfirmedActive &&
        digitalRead(STATUS_PIN) == LOW) {
      sosActive = false;
      backendConfirmedActive = false;

      digitalWrite(RED_LED, LOW);
      digitalWrite(GREEN_LED, HIGH);
    }
  }

  delay(20);
}
