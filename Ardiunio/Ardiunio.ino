
#define BUTTON 2
#define BUZZER 8
#define SIGNAL 3

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(SIGNAL, OUTPUT);

  digitalWrite(SIGNAL, HIGH);
}

void emergencySiren() {
  // Alternating high-low emergency siren
  for (int i = 0; i < 10; i++) {
    tone(BUZZER, 1800);
    delay(250);

    tone(BUZZER, 1000);
    delay(250);
  }

  noTone(BUZZER);
}

void loop() {
  if (digitalRead(BUTTON) == LOW) {
    digitalWrite(SIGNAL, LOW);

    emergencySiren();

    digitalWrite(SIGNAL, HIGH);

    while (digitalRead(BUTTON) == LOW) {
      delay(20);
    }
  }
}
