/**
 * Helper functions for the ticket bot
 */

/**
 * Checks if a button containing a paragraph with the specified text exists
 * @param {Object} page - Puppeteer page object
 * @param {string} buttonText - The text to search for
 * @returns {Promise<boolean>} - True if button exists, false otherwise
 */
async function checkButtonWithTextExists(page, buttonText) {
  return await page.evaluate((text) => {
    // Find all paragraph elements with the exact text
    const paragraphs = Array.from(document.querySelectorAll("p")).filter(
      (p) => p.textContent.trim() === text
    );

    // If we found a matching paragraph, get its parent button
    if (paragraphs.length > 0) {
      // Find the closest parent button
      let element = paragraphs[0];
      while (element && element.tagName !== "BUTTON") {
        element = element.parentElement;
      }
      return !!element; // Return true if we found a parent button
    }
    return false;
  }, buttonText);
}

/**
 * Clicks a button containing a paragraph with the specified text
 * @param {Object} page - Puppeteer page object
 * @param {string} buttonText - The text to search for
 * @returns {Promise<boolean>} - True if button was clicked, false otherwise
 */
async function clickButtonWithText(page, buttonText, timeout = 1000) {
  try {
    // Espera hasta que el botón con el texto deseado esté presente y habilitado
    const buttonHandle = await page.waitForFunction(
      (text) => {
        const paragraphs = Array.from(document.querySelectorAll("p")).filter(
          (p) => p.textContent.trim() === text
        );

        if (paragraphs.length > 0) {
          let element = paragraphs[0];
          while (element && element.tagName !== "BUTTON") {
            element = element.parentElement;
          }
          if (element && !element.hasAttribute("disabled")) {
            return element;
          }
        }
        console.log("returning null");
        return null;
      },
      { timeout },
      buttonText
    );

    const button = await buttonHandle.asElement();
    console.log(button);
    if (!button) {
      throw new Error(`Button with text "${buttonText}" not found or disabled`);
    }

    await button.click();
    console.log(`✅ Clicked button with text: ${buttonText}`);
    return true;
  } catch (err) {
    throw new Error(
      `❌ Failed to click button with text "${buttonText}": ${err.message}`
    );
  }
}

/**
 * Hace clic en un botón que contiene un <p> con cierto texto.
 * Lanza excepción si el botón no existe o está deshabilitado.
 * @param {puppeteer.Page} page
 * @param {string} text - Texto exacto dentro del <p> (ej. "Buscar asiento disponible")
 * @param {number} timeout - Tiempo máximo para esperar el botón (default: 500ms)
 */
async function clickButtonByParagraphTextStrict(page, text, timeout = 200) {
  try {
    // Construí el XPath dinámicamente con el texto
    const xpath = `xpath///p[normalize-space(.)="${text}"]/ancestor::button`;

    // Espera a que aparezca el botón
    const button = await page.waitForSelector(xpath, { timeout });
    if (text === "Agregar platea") {
      console.log(button);
    }

    if (!button) {
      throw new Error(`❌ Button with text "${text}" not found`);
    }
    const isDisabled = await page.evaluate(
      (btn) => btn.hasAttribute("disabled"),
      button
    );
    if (isDisabled) {
      throw new Error(`❌ Button with text "${text}" is disabled`);
    }

    try {
      await page.evaluate((btn) => btn.click(), button);
    } catch (err) {
      if (err.message.includes("Execution context was destroyed")) {
        throw new Error("❌ Click falló porque el DOM cambió antes de tiempo");
      }
      throw err;
    }

    console.log(`✅ Clicked button with text: "${text}"`);
  } catch (err) {
    throw new Error(`💥 Failed to click "${text}": ${err.message}`);
  }
}

async function checkNotAvailableModal(page) {
  try {
    // Buscar el mensaje de error usando page.evaluate en lugar de XPath
    const errorFound = await page.evaluate(
      () => {
        const paragraphs = document.querySelectorAll("p");
        const errorText =
          "Lo sentimos. Te sugerimos intentarlo nuevamente en otro asiento o sector que esté disponible.";

        for (const p of paragraphs) {
          if (p.textContent.trim() === errorText) {
            return true;
          }
        }
        return false;
      },
      { timeout: 3500 }
    );

    if (errorFound) {
      console.log("🚫 El mensaje de error apareció, refrescando...");
      throw new Error("❌ Ticket not available");
    } else {
      console.log("✅ No apareció el mensaje, seguimos");
    }
  } catch (error) {
    // Si la excepción fue lanzada por nosotros, propagarla
    if (error.message === "❌ Ticket not available") {
      throw error;
    }
    // Si fue otro tipo de error (timeout, etc), asumimos que no apareció el mensaje
    console.log("✅ No apareció el mensaje, seguimos");
  }
}

module.exports = {
  checkButtonWithTextExists,
  clickButtonWithText,
  clickButtonByParagraphTextStrict,
  checkNotAvailableModal,
};
