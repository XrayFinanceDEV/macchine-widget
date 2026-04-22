import { chromium } from 'playwright';

(async () => {
  console.log('Starting comprehensive UI test...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
    slowMo: 100  // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Console and error tracking
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    console.log(`[${msg.type().toUpperCase()}]:`, text);
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.error('[PAGE ERROR]:', error.message);
  });

  try {
    console.log('='.repeat(60));
    console.log('STEP 1: Navigate to http://localhost:3001');
    console.log('='.repeat(60));

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/test_01_landing.png', fullPage: true });
    console.log('✓ Screenshot saved: test_01_landing.png\n');

    console.log('='.repeat(60));
    console.log('STEP 2: Locate the floating chat button');
    console.log('='.repeat(60));

    // Get all buttons and their details
    const buttonDetails = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map((btn, idx) => {
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        return {
          index: idx,
          text: btn.innerText.substring(0, 30),
          classes: btn.className.substring(0, 100),
          position: {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom)
          },
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          hasImage: btn.querySelector('img') !== null,
          hasSVG: btn.querySelector('svg') !== null
        };
      });
    });

    console.log('Found buttons:');
    buttonDetails.forEach(btn => {
      console.log(`  [${btn.index}] "${btn.text || '(empty)'}" - Position: bottom:${btn.position.bottom}, right:${btn.position.right}, hasImage:${btn.hasImage}`);
    });

    // Find the floating button (should be bottom-right with an image)
    const floatingButton = page.locator('button.fixed.bottom-8.right-8');
    const floatingExists = await floatingButton.count();
    console.log(`\nFloating button (fixed.bottom-8.right-8): ${floatingExists > 0 ? 'FOUND' : 'NOT FOUND'}`);

    if (floatingExists === 0) {
      console.log('ERROR: Floating chat button not found!');
      await page.screenshot({ path: '/tmp/test_error_no_button.png' });
      return;
    }

    console.log('\n='.repeat(60));
    console.log('STEP 3: Click the chat button');
    console.log('='.repeat(60));

    await floatingButton.click();
    console.log('✓ Chat button clicked');

    // Wait for the Sheet animation
    await page.waitForTimeout(1500);

    await page.screenshot({ path: '/tmp/test_02_after_click.png', fullPage: true });
    console.log('✓ Screenshot saved: test_02_after_click.png\n');

    console.log('='.repeat(60));
    console.log('STEP 4: Check if Sheet panel opened');
    console.log('='.repeat(60));

    const sheetState = await page.evaluate(() => {
      // Look for Sheet content (Radix UI Dialog)
      const sheetContent = document.querySelector('[data-radix-dialog-content]');
      const overlay = document.querySelector('[data-radix-dialog-overlay]');

      return {
        sheetContentExists: !!sheetContent,
        overlayExists: !!overlay,
        sheetDataState: sheetContent?.getAttribute('data-state'),
        sheetVisible: sheetContent ? window.getComputedStyle(sheetContent).display !== 'none' : false,
        sheetClasses: sheetContent?.className.substring(0, 200)
      };
    });

    console.log('Sheet state:', JSON.stringify(sheetState, null, 2));

    if (!sheetState.sheetContentExists) {
      console.log('⚠ WARNING: Sheet content not found in DOM!');
    } else {
      console.log(`✓ Sheet content found - State: ${sheetState.sheetDataState}`);
    }

    console.log('\n='.repeat(60));
    console.log('STEP 5: Check for chat interface elements');
    console.log('='.repeat(60));

    // Check for textarea
    const textarea = page.locator('textarea');
    const textareaCount = await textarea.count();
    console.log(`Textarea elements: ${textareaCount}`);

    if (textareaCount > 0) {
      const textareaVisible = await textarea.first().isVisible();
      const placeholder = await textarea.first().getAttribute('placeholder');
      console.log(`  ✓ Textarea visible: ${textareaVisible}`);
      console.log(`  ✓ Placeholder: "${placeholder}"`);

      if (textareaVisible) {
        console.log('\n='.repeat(60));
        console.log('STEP 6: Test message input');
        console.log('='.repeat(60));

        await textarea.first().fill('Hello! This is an automated test of the chat widget.');
        console.log('✓ Message typed');

        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/test_03_message_typed.png' });
        console.log('✓ Screenshot saved: test_03_message_typed.png\n');

        // Check for send button
        const sendButton = page.locator('button[type="submit"]');
        const sendButtonExists = await sendButton.count();
        console.log(`Send button: ${sendButtonExists > 0 ? 'FOUND' : 'NOT FOUND'}`);

        if (sendButtonExists > 0) {
          const sendDisabled = await sendButton.first().isDisabled();
          console.log(`  Send button disabled: ${sendDisabled}`);

          if (!sendDisabled) {
            console.log('\n='.repeat(60));
            console.log('STEP 7: Send message and wait for response');
            console.log('='.repeat(60));

            await sendButton.first().click();
            console.log('✓ Send button clicked');

            // Wait for response
            console.log('Waiting for AI response (5 seconds)...');
            await page.waitForTimeout(5000);

            await page.screenshot({ path: '/tmp/test_04_after_send.png', fullPage: true });
            console.log('✓ Screenshot saved: test_04_after_send.png\n');

            // Check for messages
            const messageCount = await page.evaluate(() => {
              // Count message bubbles
              return document.querySelectorAll('[class*="rounded-lg"][class*="p-4"]').length;
            });
            console.log(`Message bubbles found: ${messageCount}`);
          }
        }
      }
    } else {
      console.log('⚠ WARNING: No textarea found - chat input may not be working');
    }

    console.log('\n='.repeat(60));
    console.log('STEP 8: Test non-modal behavior');
    console.log('='.repeat(60));

    // Try to scroll the page
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(300);
    const scrollAfter = await page.evaluate(() => window.scrollY);

    console.log(`Scroll test: ${scrollBefore} -> ${scrollAfter}`);
    console.log(`✓ Page is ${scrollAfter > scrollBefore ? 'SCROLLABLE' : 'NOT scrollable'} (non-modal: ${scrollAfter > scrollBefore})`);

    // Check for overlay blocking interaction
    const hasBlockingOverlay = await page.evaluate(() => {
      const overlay = document.querySelector('[data-radix-dialog-overlay]');
      return overlay !== null;
    });
    console.log(`Blocking overlay present: ${hasBlockingOverlay ? 'YES (modal)' : 'NO (non-modal)'}`);

    console.log('\n='.repeat(60));
    console.log('STEP 9: Final state');
    console.log('='.repeat(60));

    await page.screenshot({ path: '/tmp/test_05_final.png', fullPage: true });
    console.log('✓ Screenshot saved: test_05_final.png');

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Console logs: ${consoleLogs.length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.log('\n⚠ ERRORS DETECTED:');
      pageErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    console.log('\n✓ Test complete! Browser will remain open for 15 seconds for inspection...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/test_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();
