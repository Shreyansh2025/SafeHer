
#define BUTTON 2
#define BUZZER 8
#define SIGNAL 3
#define RED_LED 4
#define GREEN_LED 5

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(SIGNAL, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);

  // Normal / resolved state
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
  if (digitalRead(BUTTON) == LOW) {
    // SOS active
    digitalWrite(SIGNAL, LOW);
    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);

    emergencySiren();

    // Return signal to normal after siren
    digitalWrite(SIGNAL, HIGH);

    while (digitalRead(BUTTON) == LOW) {
      delay(20);
    }

    // Green indicates normal state
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
  }
}
