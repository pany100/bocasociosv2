import { checkAvailability } from "./check-availability.js";
import { checkSeatAvailability } from "./check-seat-availability.js";
import { login } from "./login.js";
import { reserve } from "./reserve.js";

async function main() {
  const loginResult = await login();

  if (loginResult.success) {
    console.log("Login exitoso!");
    console.log("Token:", loginResult.token);
  } else {
    console.log("Login falló:", loginResult.error);
    return;
  }

  console.log("✓ Login exitoso");
  const token = loginResult.token;

  const nids = await checkAvailability(token, 0.5);

  if (nids && nids.length > 0) {
    console.log("NIDs disponibles:", nids);
    const primerNid = nids[0];
    const seatNids = await checkSeatAvailability(primerNid, token);
    if (seatNids && seatNids.length > 0) {
      console.log(`\n🎯 Asientos encontrados en sección ${sectionNid}!`);

      // 4. Intentar reservar el primer asiento disponible
      const primerAsiento = seatNids[0];
      console.log(`\n4️⃣ Intentando reservar asiento ${primerAsiento}...`);

      const reservaResult = await reserve(primerAsiento, token);

      if (reservaResult.success) {
        console.log("\n🎉 ¡RESERVA COMPLETADA CON ÉXITO!");
        return; // Detener después de reservar
      } else {
        console.log("Reserva falló, intentando con siguiente asiento...");
        // Continuar con el siguiente asiento
      }
    }
  } else {
    console.log("No se encontró disponibilidad");
  }
}

main();
