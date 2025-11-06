import { exec } from "child_process";
import os from "os";

function playLoudAlarm() {
  const platform = os.platform();

  console.log("\n🚨🚨🚨 ALARMA ACTIVADA - 60 SEGUNDOS 🚨🚨🚨\n");
  console.log("🔔🔔🔔 ¡COMPLETÁ EL PAGO AHORA! 🔔🔔🔔\n");

  if (platform === "darwin") {
    const interval = setInterval(() => {
      exec("afplay /System/Library/Sounds/Alarm.aiff &");
      exec("afplay /System/Library/Sounds/Sosumi.aiff &");
      console.log(
        `⏰ ${new Date().toLocaleTimeString()} - ¡PAGO! ¡PAGO! ¡PAGO!`
      );
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      console.log("\n✅ Alarma finalizada");
    }, 60000);
  } else if (platform === "win32") {
    const interval = setInterval(() => {
      exec('powershell -c "[console]::beep(1000,500)"');
      console.log(
        `⏰ ${new Date().toLocaleTimeString()} - ¡PAGO! ¡PAGO! ¡PAGO!`
      );
    }, 2000);

    setTimeout(() => clearInterval(interval), 60000);
  } else {
    const interval = setInterval(() => {
      exec(
        "paplay /usr/share/sounds/freedesktop/stereo/alarm-clock-elapsed.oga &"
      );
      console.log(
        `⏰ ${new Date().toLocaleTimeString()} - ¡PAGO! ¡PAGO! ¡PAGO!`
      );
    }, 3000);

    setTimeout(() => clearInterval(interval), 60000);
  }
}

export { playLoudAlarm };
