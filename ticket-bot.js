const puppeteer = require("puppeteer");
require("dotenv").config();
const { checkButtonWithTextExists, clickButtonWithText } = require("./utils");

// Configuration - load from environment variables
const config = {
  loginUrl: process.env.LOGIN_URL,
  username: process.env.CUSTOM_USERNAME,
  password: process.env.PASSWORD,
  ticketUrl: process.env.TICKET_URL,
  maxAttempts: process.env.MAX_ATTEMPTS,
  waitIntervalOne: process.env.WAIT_INTERVAL_ONE || 1000,
  waitIntervalTwo: process.env.WAIT_INTERVAL_TWO || 500,
  waitIntervalThree: process.env.WAIT_INTERVAL_THREE || 400,
};

// Validate required configuration
if (!config.username || !config.password) {
  console.error(
    "Error: USERNAME and PASSWORD environment variables must be set"
  );
  process.exit(1);
}

async function run() {
  console.log("Starting the ticket bot...");

  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: false, // Set to true in production
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  try {
    const page = await browser.newPage();

    // Set a reasonable navigation timeout
    page.setDefaultNavigationTimeout(60000);

    // Enable console logs from the browser
    page.on("console", (msg) => console.log("Browser console:", msg.text()));

    // Login process with retry mechanism
    const maxRetries = 3;
    let retries = 0;
    let loginSuccessful = false;

    while (!loginSuccessful && retries < maxRetries) {
      try {
        console.log(
          `Navigating to login page: ${config.loginUrl} (Attempt ${
            retries + 1
          }/${maxRetries})`
        );
        await page.goto(config.loginUrl, { waitUntil: "networkidle2" });

        console.log("Waiting for page to load completely...");
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 4500))
        );

        console.log("Filling login credentials...");
        await page.type('input[type="email"]', config.username);
        await page.type('input[type="password"]', config.password);

        console.log("Submitting login form...");
        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);

        // Check if login was successful
        const url = page.url();
        if (url.includes("login") || url === config.loginUrl) {
          throw new Error("Login failed");
        }

        loginSuccessful = true;
        console.log("Login successful!");
      } catch (error) {
        retries++;
        console.log(
          `Login attempt failed: ${error.message}. Retrying... (${retries}/${maxRetries})`
        );

        if (retries >= maxRetries) {
          throw new Error(`Failed to login after ${maxRetries} attempts`);
        }

        // Wait before retrying
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 3000))
        );
      }
    }

    // Check if login was successful
    const url = page.url();
    if (url.includes("login") || url === config.loginUrl) {
      throw new Error("Login failed. Please check your credentials.");
    }

    console.log("Login successful!");

    console.log("Process completed successfully!");
    // Navigate to the ticket URL
    console.log(`Navigating to ticket page: ${config.ticketUrl}`);
    await page.goto(config.ticketUrl, { waitUntil: "networkidle2" });
    console.log("Arrived at ticket page");

    // Check for ticket availability and attempt to click
    console.log("Checking for ticket availability...");
    let ticketFound = false;
    let attempts = 0;
    const maxAttempts = config.maxAttempts;

    while (!ticketFound && attempts < maxAttempts) {
      try {
        // Wait for potential elements to load
        await page.evaluate(
          (waitInterval) =>
            new Promise((resolve) => setTimeout(resolve, waitInterval)),
          config.waitIntervalOne
        );

        // Check if the ticket element exists
        // const ticketElement = await page.$("g[data-section]");
        const ticketElement = await page.$(
          "g[data-section='I'], g[data-section='J'], g[data-section='F'], g[data-section='G'], g[data-section='H'], g[data-section='K']"
        );

        if (ticketElement) {
          console.log("Ticket element found! Attempting to click...");
          await ticketElement.click();
          ticketFound = true;
          console.log("Successfully clicked on ticket element");
        } else {
          console.log(
            `Ticket not found. Refreshing page (attempt ${
              attempts + 1
            }/${maxAttempts})...`
          );
          await page.reload({ waitUntil: "networkidle2" });
          attempts++;
        }
      } catch (err) {
        console.log(`Error during attempt ${attempts + 1}: ${err.message}`);
        attempts++;
        await page.reload({ waitUntil: "networkidle2" });
      }
    }
    if (!ticketFound) {
      console.log("Max attempts reached. No ticket element found.");
      return;
    }
    // After clicking on ticket element, wait for ticket details to load
    console.log("Waiting for ticket details to load...");
    await page.evaluate(
      (waitInterval) =>
        new Promise((resolve) => setTimeout(resolve, waitInterval)),
      config.waitIntervalTwo
    );

    // Search for button with "Buscar asiento disponible" text
    console.log("Searching for 'Buscar asiento disponible' button...");
    await clickButtonWithText(page, "Buscar asiento disponible");
    await page.evaluate(
      (waitInterval) =>
        new Promise((resolve) => setTimeout(resolve, waitInterval)),
      config.waitIntervalThree
    );
    await clickButtonWithText(page, "Agregar platea");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Close the browser
    // await browser.close();
  }
}

// Run the bot
run();
