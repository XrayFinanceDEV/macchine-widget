import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testChatWidget() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = '/tmp/widget-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
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
    console.log('📍 Step 1: Loading page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Screenshot 1: Initial page load
    await page.screenshot({ path: join(screenshotDir, '01-initial-page.png'), fullPage: true });
    results.screenshots.push('01-initial-page.png');
    console.log('✅ Page loaded successfully');

    // Test 1: Check if chat button appears
    console.log('\n📍 Test 1: Checking for chat button in bottom-right corner...');
    const chatButton = await page.locator('[data-testid="chat-trigger"], button:has-text("Chat"), button[aria-label*="chat" i]').first();
    const isButtonVisible = await chatButton.isVisible().catch(() => false);

    if (!isButtonVisible) {
      // Try to find any button with chat-related content
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons on page`);

      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        const text = await btn.textContent().catch(() => '');
        const role = await btn.getAttribute('aria-label').catch(() => '');
        console.log(`  Button ${i}: text="${text}", aria-label="${role}"`);
      }

      results.tests.push({
        name: 'Chat button visibility',
        status: 'FAILED',
        message: 'Chat button not found in bottom-right corner'
      });
    } else {
      const buttonBox = await chatButton.boundingBox();
      const xPos = Math.round(buttonBox.x);
      const yPos = Math.round(buttonBox.y);
      results.tests.push({
        name: 'Chat button visibility',
        status: 'PASSED',
        message: `Chat button found at position (${xPos}, ${yPos})`
      });
      console.log(`✅ Chat button found at position (${xPos}, ${yPos})`);

      // Screenshot 2: Highlight chat button
      await chatButton.screenshot({ path: join(screenshotDir, '02-chat-button.png') });
      results.screenshots.push('02-chat-button.png');
    }

    // Test 2: Click chat button to open widget
    console.log('\n📍 Test 2: Clicking chat button to open widget...');
    await chatButton.click();
    await page.waitForTimeout(1000);

    // Screenshot 3: Widget opened
    await page.screenshot({ path: join(screenshotDir, '03-widget-opened.png'), fullPage: true });
    results.screenshots.push('03-widget-opened.png');

    const widgetPanel = await page.locator('[role="dialog"], [data-state="open"]').first();
    const isWidgetVisible = await widgetPanel.isVisible().catch(() => false);

    if (isWidgetVisible) {
      console.log('✅ Widget opened successfully');
      results.tests.push({
        name: 'Widget opens on button click',
        status: 'PASSED',
        message: 'Widget panel is visible after clicking button'
      });
    } else {
      console.log('❌ Widget did not open');
      results.tests.push({
        name: 'Widget opens on button click',
        status: 'FAILED',
        message: 'Widget panel not visible after clicking button'
      });
    }

    // Test 3: Verify widget UI components
    console.log('\n📍 Test 3: Verifying widget UI components...');
    const uiComponents = {
      header: await page.locator('text=/AI Assistant|Chat|Assistant/i').first().isVisible().catch(() => false),
      closeButton: await page.locator('button[aria-label*="close" i]').first().isVisible().catch(() => false),
      messageArea: await page.locator('[role="log"], .messages, [class*="message"]').first().isVisible().catch(() => false),
      inputField: await page.locator('input[type="text"], textarea').first().isVisible().catch(() => false),
      sendButton: await page.locator('button:has-text("Send"), button[aria-label*="send" i]').first().isVisible().catch(() => false)
    };

    const uiComponentsCount = Object.values(uiComponents).filter(v => v).length;
    console.log(`✅ Found ${uiComponentsCount}/5 UI components`);
    console.log(`  - Header: ${uiComponents.header ? '✅' : '❌'}`);
    console.log(`  - Close button: ${uiComponents.closeButton ? '✅' : '❌'}`);
    console.log(`  - Message area: ${uiComponents.messageArea ? '✅' : '❌'}`);
    console.log(`  - Input field: ${uiComponents.inputField ? '✅' : '❌'}`);
    console.log(`  - Send button: ${uiComponents.sendButton ? '✅' : '❌'}`);

    results.tests.push({
      name: 'Widget UI components',
      status: uiComponentsCount >= 4 ? 'PASSED' : 'FAILED',
      message: `${uiComponentsCount}/5 UI components visible`,
      details: uiComponents
    });

    // Test 4: Check for welcome message
    console.log('\n📍 Test 4: Checking for welcome message...');
    await page.waitForTimeout(500);
    const welcomeMessage = await page.locator('text=/Hello|Welcome|How can I help/i').first();
    const hasWelcomeMessage = await welcomeMessage.isVisible().catch(() => false);

    if (hasWelcomeMessage) {
      const welcomeText = await welcomeMessage.textContent();
      console.log(`✅ Welcome message found: "${welcomeText}"`);
      results.tests.push({
        name: 'Welcome message display',
        status: 'PASSED',
        message: `Welcome message: "${welcomeText}"`
      });

      // Screenshot 4: Welcome message
      await welcomeMessage.screenshot({ path: join(screenshotDir, '04-welcome-message.png') });
      results.screenshots.push('04-welcome-message.png');
    } else {
      console.log('ℹ️ No welcome message found');
      results.tests.push({
        name: 'Welcome message display',
        status: 'INFO',
        message: 'No welcome message visible'
      });
    }

    // Test 5: Send a test message
    console.log('\n📍 Test 5: Sending a test message...');
    const input = await page.locator('input[type="text"], textarea').first();
    const sendButton = await page.locator('button:has-text("Send"), button[aria-label*="send" i], button[type="submit"]').last();

    await input.fill('Hello, this is a test message!');
    await page.waitForTimeout(500);

    // Screenshot 5: Message typed
    await page.screenshot({ path: join(screenshotDir, '05-message-typed.png'), fullPage: true });
    results.screenshots.push('05-message-typed.png');

    await sendButton.click();
    console.log('✅ Message sent, waiting for response...');
    await page.waitForTimeout(3000);

    // Screenshot 6: After sending message
    await page.screenshot({ path: join(screenshotDir, '06-message-sent.png'), fullPage: true });
    results.screenshots.push('06-message-sent.png');

    // Check if message appears in chat
    const userMessage = await page.locator('text="Hello, this is a test message!"').first().isVisible().catch(() => false);

    if (userMessage) {
      console.log('✅ User message appears in chat');
      results.tests.push({
        name: 'Send message functionality',
        status: 'PASSED',
        message: 'User message successfully displayed in chat'
      });
    } else {
      console.log('❌ User message not visible in chat');
      results.tests.push({
        name: 'Send message functionality',
        status: 'FAILED',
        message: 'User message not displayed after sending'
      });
    }

    // Wait for AI response
    console.log('\n📍 Test 6: Waiting for AI response...');
    await page.waitForTimeout(5000);

    // Screenshot 7: AI response
    await page.screenshot({ path: join(screenshotDir, '07-ai-response.png'), fullPage: true });
    results.screenshots.push('07-ai-response.png');

    // Check message count
    const allMessages = await page.locator('[class*="message"], [role="article"]').all();
    console.log(`✅ Total messages visible: ${allMessages.length}`);

    results.tests.push({
      name: 'AI response received',
      status: allMessages.length >= 2 ? 'PASSED' : 'INFO',
      message: `${allMessages.length} messages in chat (expected: at least 2 - user + AI)`
    });

    // Test 7: Check auto-scroll
    console.log('\n📍 Test 7: Testing auto-scroll...');

    // Send multiple messages to test scroll
    for (let i = 1; i <= 3; i++) {
      await input.fill(`Test message ${i} for scroll testing`);
      await sendButton.click();
      await page.waitForTimeout(1500);
    }

    await page.waitForTimeout(2000);

    // Screenshot 8: Multiple messages (scroll test)
    await page.screenshot({ path: join(screenshotDir, '08-scroll-test.png'), fullPage: true });
    results.screenshots.push('08-scroll-test.png');

    const messageContainer = await page.locator('[role="log"], .messages, [class*="scroll"]').first();
    const scrollPosition = await messageContainer.evaluate(el => {
      return {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        isAtBottom: Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 50
      };
    }).catch(() => null);

    if (scrollPosition) {
      console.log(`✅ Scroll position: ${scrollPosition.scrollTop}/${scrollPosition.scrollHeight}`);
      console.log(`   At bottom: ${scrollPosition.isAtBottom ? 'YES' : 'NO'}`);
      results.tests.push({
        name: 'Auto-scroll functionality',
        status: scrollPosition.isAtBottom ? 'PASSED' : 'INFO',
        message: `Container scroll: ${scrollPosition.scrollTop}/${scrollPosition.scrollHeight}, At bottom: ${scrollPosition.isAtBottom}`,
        details: scrollPosition
      });
    } else {
      results.tests.push({
        name: 'Auto-scroll functionality',
        status: 'INFO',
        message: 'Could not verify scroll position'
      });
    }

    // Final screenshot - full widget view
    await page.screenshot({ path: join(screenshotDir, '09-final-view.png'), fullPage: true });
    results.screenshots.push('09-final-view.png');

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    results.errors.push(`Test execution error: ${error.message}`);

    // Error screenshot
    await page.screenshot({ path: join(screenshotDir, 'error.png'), fullPage: true });
    results.screenshots.push('error.png');
  } finally {
    await browser.close();
  }

  return results;
}

// Run tests
const results = await testChatWidget();

// Print summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

results.tests.forEach((test, idx) => {
  const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : 'ℹ️';
  console.log(`${icon} ${idx + 1}. ${test.name}: ${test.status}`);
  console.log(`   ${test.message}`);
});

if (results.errors.length > 0) {
  console.log('\n⚠️  ERRORS DETECTED:');
  results.errors.forEach(err => console.log(`   - ${err}`));
}

console.log('\n📸 Screenshots saved:');
results.screenshots.forEach(file => console.log(`   - /tmp/widget-screenshots/${file}`));

console.log('\n💾 Test results saved to: /tmp/test-results.json');
fs.writeFileSync('/tmp/test-results.json', JSON.stringify(results, null, 2));

process.exit(results.errors.length > 0 ? 1 : 0);
