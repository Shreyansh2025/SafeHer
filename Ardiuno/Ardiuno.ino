
#define BUTTON 2
#define BUZZER 8
#define SIGNAL 3

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(SIGNAL, OUTPUT);

  // Normal state
  digitalWrite(SIGNAL, HIGH);
}

void beep(int duration) {
  tone(BUZZER, 1000);
  delay(duration);
  noTone(BUZZER);
  delay(200);
}

void sosBeep() {
  beep(200);
  beep(200);
  beep(200);
  delay(300);

  beep(600);
  beep(600);
  beep(600);
  delay(300);

  beep(200);
  beep(200);
  beep(200);
}

void loop() {
  if (digitalRead(BUTTON) == LOW) {
    digitalWrite(SIGNAL, LOW);
    sosBeep();
    digitalWrite(SIGNAL, HIGH);

    // Prevent repeated triggers while button is held
    while (digitalRead(BUTTON) == LOW) {
      delay(20);
    }
  }
}
