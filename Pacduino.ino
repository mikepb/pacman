#include "Twiddlerino.h"

#define PMW_TARGET  0.0
#define PMW_KP      1.2
#define PMW_KD      0.02

#define P_ACTIVATION  150
#define P_THRESHOLD   300
#define P_REFACTORY   140

void setup()
{
  Serial.begin(115200);
  TwiddlerinoInit();
}

void loop()
{
  // can't use timers because Twiddlerino uses them
  static unsigned long prevtime = 0;
  unsigned long time = millis();

  // debounce to at most every 1ms
  if (time != prevtime) {

    // read motor position
    double pos = ReadEncoder();

    // update motor
    update(pos);

    // send command
    send(pos);

  }

  prevtime = time;
}

void update(double pos) {
  static double prevpos = 0;
  double appos = abs(prevpos);
  double abspos = abs(pos);
  double err = PMW_TARGET - pos;
  double pmw = 0;
  unsigned int impulse = 0;

  // read server data
  while (Serial.available() > 0) {
    switch (Serial.read()) {
      case 'i':
        impulse = 10; // 10ms
        break;
    }
  }

  // calculate response
  pmw = PMW_KP * err - PMW_KD * (pos - prevpos) * 1000;
  pmw = constrain(pmw, -255, 255);

  // barriers
  if (appos < P_ACTIVATION && abspos >= P_ACTIVATION ||
      appos < P_THRESHOLD && abspos >= P_THRESHOLD)
  {
    impulse = 10;
  }

  // impulse
  if (impulse > 0) {
    pmw = pmw < 0 ? 255 : -255;
    --impulse;
  }

  // signal Twiddlerino (reverse signal)
  SetPWMOut(-pmw);

  prevpos = pos;
}

void send(double pos) {
  static unsigned char sequence = 0;
  static double maxpos = 0;
  static char cmd = 0;

  double abspos = abs(pos);

  /*
    Reset:

              .--> <--.
    |      |  |   |   |  |      |
   -t     -a -r   0  +r +a     +t
   */

  if (abspos < P_REFACTORY) {
    if (maxpos != 0) {
      if (abs(maxpos) > P_THRESHOLD) {
        cmd = maxpos > 0 ? 'r' : 'l';
      } else {
        cmd = maxpos > 0 ? 'c' : 'q';
      }
      maxpos = 0;
    }
  }

  /*
    Wait:

            <-----.----->
    |      |  |   |   |  |      |
   -t     -a -r   0  +r +a     +t
   */

  else if (abspos < P_ACTIVATION) {
  }

  /*
    Track max displacement:

    <------.             .------>
    |      |  |   |   |  |      |
   -t     -a -r   0  +r +a     +t
   */

  else if (abs(maxpos) < abspos) {
    maxpos = pos;
  }

  // send every 10ms
  if (sequence++ % 10 == 0 && cmd != 0) {
    Serial.print(cmd);
    Serial.print('\n');
    cmd = 0;
  }
}
