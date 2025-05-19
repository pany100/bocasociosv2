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
          if (
            element &&
            !element.hasAttribute("disabled") &&
            element.offsetParent !== null // Verifica que esté visible
          ) {
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
module.exports = {
  checkButtonWithTextExists,
  clickButtonWithText,
};
