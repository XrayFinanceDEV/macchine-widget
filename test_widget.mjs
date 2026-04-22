import { chromium } from 'playwright';

(async () => {
  console.log('Launching Chrome...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[CONSOLE ${type.toUpperCase()}]:`, msg.text());
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
    console.log(error.stack);
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]:', request.url(), request.failure().errorText);
  });

  try {
    console.log('\n=== Navigating to http://localhost:3001 ===');
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('Page loaded successfully');

    await page.waitForTimeout(2000);

    console.log('\n=== Taking screenshot of landing page ===');
    await page.screenshot({ path: '/tmp/01_landing_page.png', fullPage: true });
    console.log('Screenshot saved to /tmp/01_landing_page.png');

    const title = await page.title();
    console.log('\nPage title:', title);

    console.log('\n=== Looking for chat button ===');
    // Look for any button that might be the chat trigger
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on the page`);

    // Try to find the chat button
    let chatButton = null;
    for (const button of buttons) {
      const text = await button.innerText().catch(() => '');
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`Button text: "${text}"`);
      }
    }

    // Try common selectors for chat button
    const selectors = [
      'button[aria-label*="chat"]',
      'button[aria-label*="Chat"]',
      'button:has-text("Chat")',
      'button:has(svg) >> nth=-1', // Last button with an icon (likely the floating button)
    ];

    for (const selector of selectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible()) {
          chatButton = btn;
          console.log(`Found chat button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!chatButton) {
      // Try the last visible button (often the floating action button)
      const visibleButtons = await page.locator('button:visible').all();
      if (visibleButtons.length > 0) {
        chatButton = visibleButtons[visibleButtons.length - 1];
        console.log('Using last visible button as chat button');
      }
    }

    if (chatButton) {
      console.log('\n=== Clicking chat button ===');
      await chatButton.click();
      await page.waitForTimeout(1500);

      console.log('Taking screenshot of opened chat panel');
      await page.screenshot({ path: '/tmp/02_chat_opened.png', fullPage: true });
      console.log('Screenshot saved to /tmp/02_chat_opened.png');

      console.log('\n=== Checking non-modal behavior ===');
      const overlay = await page.locator('[data-radix-overlay]').count();
      console.log(`Overlay elements found: ${overlay}`);

      console.log('\n=== Looking for input field ===');
      const inputs = await page.locator('input, textarea').all();
      console.log(`Found ${inputs.length} input/textarea elements`);

      let inputField = null;
      for (const input of inputs) {
        const isVisible = await input.isVisible().catch(() => false);
        if (isVisible) {
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          console.log(`Input placeholder: "${placeholder}"`);
          inputField = input;
        }
      }

      if (inputField) {
        console.log('\n=== Typing test message ===');
        await inputField.fill('Hello! This is a test message from Playwright.');
        await page.waitForTimeout(500);

        console.log('Taking screenshot with typed message');
        await page.screenshot({ path: '/tmp/03_message_typed.png' });
        console.log('Screenshot saved to /tmp/03_message_typed.png');

        console.log('\n=== Looking for send button ===');
        const sendButton = await page.locator('button[type="submit"]').first();
        const sendVisible = await sendButton.isVisible().catch(() => false);

        if (sendVisible) {
          console.log('Clicking send button');
          await sendButton.click();

          console.log('Waiting for response...');
          await page.waitForTimeout(4000);

          console.log('Taking screenshot after sending message');
          await page.screenshot({ path: '/tmp/04_after_send.png', fullPage: true });
          console.log('Screenshot saved to /tmp/04_after_send.png');
        } else {
          console.log('Send button not visible');
        }
      } else {
        console.log('No visible input field found');
      }

    } else {
      console.log('ERROR: Could not find chat button');
    }

    console.log('\n=== Test complete. Browser will stay open for 10 seconds ===');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\nTest error:', error.message);
    await page.screenshot({ path: '/tmp/error.png' });
    console.log('Error screenshot saved to /tmp/error.png');
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();
