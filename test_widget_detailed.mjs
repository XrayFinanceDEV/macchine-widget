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
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]:', request.url());
  });

  try {
    console.log('\n=== Navigating to http://localhost:3001 ===');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    console.log('Page loaded');

    await page.waitForTimeout(2000);

    console.log('\n=== Screenshot 1: Landing page ===');
    await page.screenshot({ path: '/tmp/step1_landing.png', fullPage: true });

    console.log('\n=== Inspecting DOM structure ===');
    const bodyHTML = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.innerText,
        aria: btn.getAttribute('aria-label'),
        classes: btn.className,
        visible: btn.offsetParent !== null
      }));
    });
    console.log('Buttons found:', JSON.stringify(bodyHTML, null, 2));

    console.log('\n=== Looking for floating chat button (bottom-right) ===');
    // The chat button should be in the bottom-right corner
    const floatingButton = page.locator('button').last();
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lastButton = buttons[buttons.length - 1];
      if (lastButton) {
        const rect = lastButton.getBoundingClientRect();
        return {
          position: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
          hasIcon: lastButton.querySelector('svg') !== null,
          text: lastButton.innerText
        };
      }
      return null;
    });
    console.log('Last button info:', JSON.stringify(buttonInfo, null, 2));

    console.log('\n=== Clicking the floating chat button ===');
    await floatingButton.click();
    console.log('Button clicked, waiting for panel animation...');

    // Wait longer for the slide-in animation
    await page.waitForTimeout(1000);

    console.log('\n=== Screenshot 2: After clicking chat button ===');
    await page.screenshot({ path: '/tmp/step2_after_click.png', fullPage: true });

    console.log('\n=== Checking for Sheet component ===');
    const sheetInfo = await page.evaluate(() => {
      // Look for radix-ui sheet components
      const sheet = document.querySelector('[data-radix-dialog-content]') ||
                    document.querySelector('[role="dialog"]');
      const overlay = document.querySelector('[data-radix-dialog-overlay]');

      return {
        sheetExists: !!sheet,
        overlayExists: !!overlay,
        sheetHTML: sheet ? sheet.outerHTML.substring(0, 500) : null,
        allDialogs: document.querySelectorAll('[role="dialog"]').length
      };
    });
    console.log('Sheet info:', JSON.stringify(sheetInfo, null, 2));

    // Wait a bit more for content to render
    await page.waitForTimeout(1000);

    console.log('\n=== Looking for all input elements ===');
    const allInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      return inputs.map(input => ({
        type: input.tagName,
        inputType: input.getAttribute('type'),
        placeholder: input.getAttribute('placeholder'),
        visible: input.offsetParent !== null,
        value: input.value
      }));
    });
    console.log('All inputs:', JSON.stringify(allInputs, null, 2));

    console.log('\n=== Checking for textarea specifically ===');
    const textareaCount = await page.locator('textarea').count();
    console.log(`Textarea elements found: ${textareaCount}`);

    if (textareaCount > 0) {
      console.log('\n=== Attempting to interact with textarea ===');
      const textarea = page.locator('textarea').first();

      // Wait for it to be visible
      try {
        await textarea.waitFor({ state: 'visible', timeout: 2000 });
        console.log('Textarea is visible');

        await textarea.fill('Hello! This is a test message from the automated test.');
        await page.waitForTimeout(500);

        console.log('\n=== Screenshot 3: Message typed ===');
        await page.screenshot({ path: '/tmp/step3_typed.png' });

        // Look for submit button
        const submitButton = page.locator('button[type="submit"]').first();
        const submitVisible = await submitButton.isVisible().catch(() => false);

        if (submitVisible) {
          console.log('\n=== Clicking send button ===');
          await submitButton.click();
          console.log('Message sent, waiting for response...');
          await page.waitForTimeout(5000);

          console.log('\n=== Screenshot 4: After sending ===');
          await page.screenshot({ path: '/tmp/step4_sent.png', fullPage: true });
        }
      } catch (e) {
        console.log('Textarea not visible or error:', e.message);
      }
    }

    console.log('\n=== Getting full page structure ===');
    const pageStructure = await page.evaluate(() => {
      return document.body.innerHTML;
    });
    console.log('Page HTML length:', pageStructure.length);

    console.log('\n=== Final screenshot ===');
    await page.screenshot({ path: '/tmp/step5_final.png', fullPage: true });

    console.log('\n=== Keeping browser open for inspection (20 seconds) ===');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\nTest error:', error);
    await page.screenshot({ path: '/tmp/error_detailed.png' });
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();
