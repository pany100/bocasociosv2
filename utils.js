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
async function clickButtonWithText(page, buttonText) {
  return await page.evaluateHandle((text) => {
    const paragraphs = Array.from(document.querySelectorAll("p")).filter(
      (p) => p.textContent.trim() === text
    );

    if (paragraphs.length > 0) {
      let element = paragraphs[0];
      while (element && element.tagName !== "BUTTON") {
        element = element.parentElement;
      }

      if (text === "Buscar asiento disponible" && element.attributes.disabled) {
        throw new Error(`Button is disabled: ${text}`);
      }

      if (element && !element.attributes.disabled) {
        element.click();
        return true;
      }
    }
    throw new Error(`Button not found: ${text}`);
  }, buttonText);
}

module.exports = {
  checkButtonWithTextExists,
  clickButtonWithText,
};
