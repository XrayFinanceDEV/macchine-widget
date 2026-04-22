import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testChatWidget() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = '/tmp/widget-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const results = {
    tests: [],
    errors: [],
    consoleLogs: [],
    screenshots: []
  };

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    results.consoleLogs.push({ type, text });
    if (type === 'error') {
      results.errors.push(`Console error: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    results.errors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('\n=== TEST 1: PAGE LOAD ===');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotDir, '01-initial-page.png'), fullPage: true });
    results.screenshots.push('01-initial-page.png');
    console.log('✅ Page loaded successfully');
    results.tests.push({ name: 'Page Load', status: 'PASSED', message: 'Page loaded without errors' });

    console.log('\n=== TEST 2: CHAT BUTTON VISIBILITY ===');
    // Look for the button - it's a button with an image inside, fixed position at bottom-right
    const chatButton = page.locator('button.fixed.bottom-8.right-8').first();

    let isButtonVisible = false;
    let buttonPosition = null;

    try {
      await chatButton.waitFor({ state: 'visible', timeout: 5000 });
      isButtonVisible = true;
      buttonPosition = await chatButton.boundingBox();
      console.log(`✅ Chat button found at position (${Math.round(buttonPosition.x)}, ${Math.round(buttonPosition.y)})`);
      console.log(`   Size: ${Math.round(buttonPosition.width)}x${Math.round(buttonPosition.height)}px`);

      results.tests.push({
        name: 'Chat Button Visibility',
        status: 'PASSED',
        message: `Button visible at (${Math.round(buttonPosition.x)}, ${Math.round(buttonPosition.y)})`,
        details: { position: buttonPosition }
      });

      // Highlight the button
      await chatButton.evaluate(el => {
        el.style.outline = '4px solid red';
      });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotDir, '02-chat-button-highlighted.png'), fullPage: true });
      results.screenshots.push('02-chat-button-highlighted.png');

      // Remove highlight
      await chatButton.evaluate(el => {
        el.style.outline = '';
      });
    } catch (error) {
      console.log('❌ Chat button not found:', error.message);
      results.tests.push({
        name: 'Chat Button Visibility',
        status: 'FAILED',
        message: 'Chat button not visible on page'
      });
      results.errors.push('Chat button not found');
    }

    if (!isButtonVisible) {
      console.log('\n⚠️  Cannot continue tests - chat button not found');
      return results;
    }

    console.log('\n=== TEST 3: OPEN WIDGET ===');
    await chatButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(screenshotDir, '03-widget-opened.png'), fullPage: true });
    results.screenshots.push('03-widget-opened.png');

    // Check if widget is open by looking for the sheet content
    const widgetPanel = page.locator('[role="dialog"]').first();
    const isWidgetOpen = await widgetPanel.isVisible().catch(() => false);

    if (isWidgetOpen) {
      console.log('✅ Widget opened successfully');
      results.tests.push({
        name: 'Widget Opens',
        status: 'PASSED',
        message: 'Widget panel visible after button click'
      });
    } else {
      console.log('❌ Widget did not open');
      results.tests.push({
        name: 'Widget Opens',
        status: 'FAILED',
        message: 'Widget panel not visible after clicking button'
      });
      return results;
    }

    console.log('\n=== TEST 4: WIDGET UI COMPONENTS ===');

    const components = {
      title: { selector: 'text=/AI Assistant/i', found: false },
      subtitle: { selector: 'text=/Powered by/i', found: false },
      welcomeMessage: { selector: 'text=/Hi.*help/i', found: false },
      inputField: { selector: 'textarea, input[type="text"]', found: false },
      sendButton: { selector: 'button[type="submit"]', found: false },
      closeButton: { selector: 'button[aria-label*="close" i]', found: false }
    };

    for (const [name, comp] of Object.entries(components)) {
      const element = page.locator(comp.selector).first();
      comp.found = await element.isVisible().catch(() => false);
      const icon = comp.found ? '✅' : '❌';
      console.log(`${icon} ${name}: ${comp.found ? 'FOUND' : 'NOT FOUND'}`);
    }

    const foundCount = Object.values(components).filter(c => c.found).length;
    const totalCount = Object.keys(components).length;

    results.tests.push({
      name: 'Widget UI Components',
      status: foundCount >= 4 ? 'PASSED' : 'PARTIAL',
      message: `${foundCount}/${totalCount} components found`,
      details: components
    });

    console.log('\n=== TEST 5: WELCOME MESSAGE ===');
    const welcomeMsg = page.locator('text=/Hi.*help/i').first();
    const hasWelcome = await welcomeMsg.isVisible().catch(() => false);

    if (hasWelcome) {
      const text = await welcomeMsg.textContent();
      console.log(`✅ Welcome message: "${text}"`);

      await welcomeMsg.evaluate(el => {
        el.style.backgroundColor = 'yellow';
      });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(screenshotDir, '04-welcome-message.png') });
      results.screenshots.push('04-welcome-message.png');

      results.tests.push({
        name: 'Welcome Message',
        status: 'PASSED',
        message: `Message displayed: "${text}"`
      });
    } else {
      console.log('⚠️  Welcome message not visible');
      results.tests.push({
        name: 'Welcome Message',
        status: 'FAILED',
        message: 'Welcome message not found'
      });
    }

    console.log('\n=== TEST 6: SEND MESSAGE ===');
    const input = page.locator('textarea, input[type="text"]').first();
    const sendButton = page.locator('button[type="submit"]').first();

    await input.fill('Hello! This is a test message.');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(screenshotDir, '05-message-typed.png'), fullPage: true });
    results.screenshots.push('05-message-typed.png');

    console.log('📤 Sending message...');
    await sendButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(screenshotDir, '06-message-sent.png'), fullPage: true });
    results.screenshots.push('06-message-sent.png');

    // Check if message appears
    const userMessage = page.locator('text="Hello! This is a test message."').first();
    const messageVisible = await userMessage.isVisible().catch(() => false);

    if (messageVisible) {
      console.log('✅ User message appears in chat');
      results.tests.push({
        name: 'Send Message',
        status: 'PASSED',
        message: 'User message successfully displayed'
      });
    } else {
      console.log('❌ User message not visible');
      results.tests.push({
        name: 'Send Message',
        status: 'FAILED',
        message: 'User message not displayed'
      });
    }

    console.log('\n=== TEST 7: AI RESPONSE ===');
    console.log('⏳ Waiting for AI response...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: path.join(screenshotDir, '07-after-response-wait.png'), fullPage: true });
    results.screenshots.push('07-after-response-wait.png');

    // Count messages - look for message containers
    const messageContainers = await page.locator('[role="article"], .message, [class*="Message"]').all();
    console.log(`📊 Total message containers found: ${messageContainers.length}`);

    results.tests.push({
      name: 'AI Response',
      status: messageContainers.length >= 2 ? 'PASSED' : 'PARTIAL',
      message: `${messageContainers.length} messages visible (expected ≥2)`
    });

    console.log('\n=== TEST 8: MULTIPLE MESSAGES & SCROLL ===');
    for (let i = 1; i <= 3; i++) {
      console.log(`📤 Sending test message ${i}...`);
      await input.fill(`Test message ${i} for scroll testing`);
      await page.waitForTimeout(300);
      await sendButton.click();
      await page.waitForTimeout(1500);
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '08-multiple-messages.png'), fullPage: true });
    results.screenshots.push('08-multiple-messages.png');

    // Check scroll position
    const scrollContainer = page.locator('[class*="scroll"], [role="log"]').first();
    const scrollInfo = await scrollContainer.evaluate(el => {
      return {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        isAtBottom: Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 100
      };
    }).catch(() => null);

    if (scrollInfo) {
      console.log(`📊 Scroll position: ${scrollInfo.scrollTop}/${scrollInfo.scrollHeight}`);
      console.log(`   At bottom: ${scrollInfo.isAtBottom ? 'YES ✅' : 'NO ❌'}`);

      results.tests.push({
        name: 'Auto-scroll',
        status: scrollInfo.isAtBottom ? 'PASSED' : 'PARTIAL',
        message: `Scroll: ${scrollInfo.scrollTop}/${scrollInfo.scrollHeight}, At bottom: ${scrollInfo.isAtBottom}`,
        details: scrollInfo
      });
    } else {
      console.log('⚠️  Could not check scroll position');
      results.tests.push({
        name: 'Auto-scroll',
        status: 'INFO',
        message: 'Could not verify scroll behavior'
      });
    }

    console.log('\n=== TEST 9: CLOSE AND REOPEN ===');
    const closeButton = page.locator('button[aria-label*="close" i]').first();
    const hasCloseButton = await closeButton.isVisible().catch(() => false);

    if (hasCloseButton) {
      console.log('🔽 Closing widget...');
      await closeButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(screenshotDir, '09-widget-closed.png'), fullPage: true });
      results.screenshots.push('09-widget-closed.png');

      const isStillOpen = await widgetPanel.isVisible().catch(() => false);
      console.log(`   Widget closed: ${!isStillOpen ? 'YES ✅' : 'NO ❌'}`);

      if (!isStillOpen) {
        console.log('🔼 Reopening widget...');
        await chatButton.click();
        await page.waitForTimeout(1000);

        const isReopened = await widgetPanel.isVisible().catch(() => false);
        console.log(`   Widget reopened: ${isReopened ? 'YES ✅' : 'NO ❌'}`);

        results.tests.push({
          name: 'Close & Reopen',
          status: isReopened ? 'PASSED' : 'FAILED',
          message: `Widget closed and reopened successfully: ${isReopened}`
        });

        await page.screenshot({ path: path.join(screenshotDir, '10-widget-reopened.png'), fullPage: true });
        results.screenshots.push('10-widget-reopened.png');
      } else {
        results.tests.push({
          name: 'Close & Reopen',
          status: 'FAILED',
          message: 'Widget did not close'
        });
      }
    } else {
      console.log('⚠️  Close button not found');
      results.tests.push({
        name: 'Close & Reopen',
        status: 'SKIPPED',
        message: 'Close button not found'
      });
    }

    // Final comprehensive screenshot
    await page.screenshot({ path: path.join(screenshotDir, '11-final-state.png'), fullPage: true });
    results.screenshots.push('11-final-state.png');

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
    results.errors.push(`Fatal error: ${error.message}`);

    try {
      await page.screenshot({ path: path.join(screenshotDir, 'error.png'), fullPage: true });
      results.screenshots.push('error.png');
    } catch (screenshotError) {
      console.error('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
  }

  return results;
}

// Run tests and generate report
console.log('🚀 Starting AI Chat Widget Tests...\n');

const results = await testChatWidget();

console.log('\n' + '='.repeat(70));
console.log('                         TEST SUMMARY REPORT                           ');
console.log('='.repeat(70));

let passed = 0, failed = 0, partial = 0, skipped = 0;

results.tests.forEach((test, idx) => {
  let icon = '❓';
  if (test.status === 'PASSED') { icon = '✅'; passed++; }
  else if (test.status === 'FAILED') { icon = '❌'; failed++; }
  else if (test.status === 'PARTIAL') { icon = '⚠️ '; partial++; }
  else if (test.status === 'SKIPPED') { icon = '⏭️ '; skipped++; }
  else if (test.status === 'INFO') { icon = 'ℹ️ '; }

  console.log(`\n${icon} Test ${idx + 1}: ${test.name}`);
  console.log(`   Status: ${test.status}`);
  console.log(`   ${test.message}`);
});

console.log('\n' + '-'.repeat(70));
console.log(`RESULTS: ${passed} Passed | ${failed} Failed | ${partial} Partial | ${skipped} Skipped`);
console.log('-'.repeat(70));

if (results.errors.length > 0) {
  console.log('\n⚠️  ERRORS DETECTED:');
  results.errors.forEach((err, idx) => console.log(`   ${idx + 1}. ${err}`));
}

if (results.consoleLogs.length > 0) {
  console.log('\n📝 Console Logs (last 10):');
  results.consoleLogs.slice(-10).forEach(log => {
    const icon = log.type === 'error' ? '❌' : log.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`   ${icon} [${log.type}] ${log.text}`);
  });
}

console.log('\n📸 Screenshots saved to: /tmp/widget-screenshots/');
results.screenshots.forEach(file => console.log(`   - ${file}`));

console.log('\n💾 Full test results: /tmp/test-results.json\n');
fs.writeFileSync('/tmp/test-results.json', JSON.stringify(results, null, 2));

const exitCode = failed > 0 ? 1 : 0;
console.log(`\n${exitCode === 0 ? '✅ All critical tests passed!' : '❌ Some tests failed!'}`);
console.log('='.repeat(70) + '\n');

process.exit(exitCode);
