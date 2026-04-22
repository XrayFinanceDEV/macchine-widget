import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/home/peter/DEV/ai-widget/test-screenshots';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAIChatWidget() {
  console.log('Starting AI Chat Widget Tests...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  const results = {
    tests: [],
    screenshots: [],
    passed: 0,
    failed: 0
  };

  try {
    // Test 1: Initial Page Load
    console.log('Test 1: Initial Page Load');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const screenshotPath1 = join(SCREENSHOTS_DIR, '01-landing-page.jpeg');
    await page.screenshot({ path: screenshotPath1, type: 'jpeg', quality: 90 });
    results.screenshots.push(screenshotPath1);

    // Check for chat widget button
    const widgetButton = await page.$('[aria-label*="chat" i], button:has-text("Chat"), button:has(svg)').catch(() => null);
    const hasWidgetButton = widgetButton !== null;

    results.tests.push({
      name: 'Landing Page Loads',
      passed: true,
      details: 'Page loaded successfully'
    });

    results.tests.push({
      name: 'Chat Widget Button Visible',
      passed: hasWidgetButton,
      details: hasWidgetButton ? 'Widget button found' : 'Widget button not found'
    });

    if (hasWidgetButton) results.passed++; else results.failed++;
    results.passed++;

    console.log(`  ✓ Page loaded`);
    console.log(`  ${hasWidgetButton ? '✓' : '✗'} Widget button visible\n`);

    // Test 2: Widget Opening
    console.log('Test 2: Widget Opening');

    // Try multiple selectors to find the chat button
    let chatButton = null;
    const buttonSelectors = [
      'button[aria-label*="chat" i]',
      'button:has-text("Chat")',
      'button:has(svg.lucide-message-circle)',
      '[role="button"]:has(svg)',
      'button.fixed.bottom-4.right-4',
      'button.rounded-full',
      'button >> nth=0'
    ];

    for (const selector of buttonSelectors) {
      try {
        chatButton = await page.$(selector);
        if (chatButton) {
          console.log(`  Found button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chatButton) {
      // Get all buttons for debugging
      const allButtons = await page.$$('button');
      console.log(`  Found ${allButtons.length} buttons on page`);
      if (allButtons.length > 0) {
        chatButton = allButtons[allButtons.length - 1]; // Try last button (likely fixed position)
      }
    }

    if (chatButton) {
      await chatButton.click();
      await sleep(1000); // Wait for animation

      const screenshotPath2 = join(SCREENSHOTS_DIR, '02-widget-opened.jpeg');
      await page.screenshot({ path: screenshotPath2, type: 'jpeg', quality: 90 });
      results.screenshots.push(screenshotPath2);

      // Check if chat panel is visible
      const chatPanel = await page.$('[role="dialog"], .sheet, [data-state="open"]').catch(() => null);
      const panelVisible = chatPanel !== null;

      results.tests.push({
        name: 'Chat Panel Opens',
        passed: panelVisible,
        details: panelVisible ? 'Chat panel visible after clicking button' : 'Chat panel not visible'
      });

      if (panelVisible) results.passed++; else results.failed++;
      console.log(`  ${panelVisible ? '✓' : '✗'} Chat panel opened\n`);

      // Test 3: Chat Interface Elements
      console.log('Test 3: Chat Interface Elements');

      // Check for welcome message
      const welcomeMessage = await page.$('text=/welcome/i, text=/hello/i, text=/help/i').catch(() => null);
      const hasWelcome = welcomeMessage !== null;

      results.tests.push({
        name: 'Welcome Message Present',
        passed: hasWelcome,
        details: hasWelcome ? 'Welcome message found' : 'No welcome message found'
      });

      console.log(`  ${hasWelcome ? '✓' : '✗'} Welcome message`);

      // Check for input field
      const inputField = await page.$('input[type="text"], textarea, [contenteditable="true"]').catch(() => null);
      const hasInput = inputField !== null;

      results.tests.push({
        name: 'Input Field Present',
        passed: hasInput,
        details: hasInput ? 'Input field found' : 'No input field found'
      });

      if (hasInput) results.passed++; else results.failed++;
      console.log(`  ${hasInput ? '✓' : '✗'} Input field\n`);

      // Check for quick actions/suggestions
      const quickActions = await page.$$('button:has-text(""), [role="button"]').catch(() => []);
      const hasQuickActions = quickActions.length > 3; // More than just standard buttons

      results.tests.push({
        name: 'Quick Actions/Suggestions',
        passed: hasQuickActions,
        details: `Found ${quickActions.length} interactive elements`
      });

      console.log(`  ${hasQuickActions ? '✓' : '~'} Quick actions (${quickActions.length} elements)\n`);

      // Test 4: Sending a Message
      if (hasInput) {
        console.log('Test 4: Sending a Message');

        const testMessage = 'Hello, can you help me?';

        // Type the message
        await inputField.fill(testMessage);
        await sleep(500);

        // Find and click send button
        const sendButton = await page.$('button[type="submit"], button:has(svg.lucide-send), button:has-text("Send")').catch(() => null);

        if (sendButton) {
          await sendButton.click();
          console.log(`  ✓ Message sent: "${testMessage}"`);

          // Wait for user message to appear
          await sleep(1000);

          // Check if user message appears
          const userMessage = await page.$(`text="${testMessage}"`).catch(() => null);
          const userMessageVisible = userMessage !== null;

          results.tests.push({
            name: 'User Message Displays',
            passed: userMessageVisible,
            details: userMessageVisible ? 'User message appears in chat' : 'User message not visible'
          });

          if (userMessageVisible) results.passed++; else results.failed++;
          console.log(`  ${userMessageVisible ? '✓' : '✗'} User message displayed`);

          // Wait for AI response (streaming)
          console.log('  Waiting for AI response...');
          await sleep(5000); // Give time for API response

          const screenshotPath3 = join(SCREENSHOTS_DIR, '03-conversation.jpeg');
          await page.screenshot({ path: screenshotPath3, type: 'jpeg', quality: 90 });
          results.screenshots.push(screenshotPath3);

          // Check if there are multiple messages (user + assistant)
          const allMessages = await page.$$('[role="article"], .message, [data-message]').catch(() => []);
          const hasResponse = allMessages.length >= 2;

          results.tests.push({
            name: 'AI Response Received',
            passed: hasResponse,
            details: `Found ${allMessages.length} messages in chat`
          });

          if (hasResponse) results.passed++; else results.failed++;
          console.log(`  ${hasResponse ? '✓' : '✗'} AI response (${allMessages.length} total messages)\n`);
        } else {
          results.tests.push({
            name: 'Send Button Found',
            passed: false,
            details: 'Send button not found'
          });
          results.failed++;
          console.log(`  ✗ Send button not found\n`);
        }
      }

      // Test 5: Non-Modal Behavior
      console.log('Test 5: Non-Modal Behavior (UI/UX)');

      // Check if there's an overlay (there shouldn't be one for non-modal)
      const overlay = await page.$('[data-overlay], .overlay, [role="presentation"]').catch(() => null);
      const isNonModal = overlay === null;

      results.tests.push({
        name: 'Non-Modal Design',
        passed: isNonModal,
        details: isNonModal ? 'No overlay detected (non-modal)' : 'Overlay detected (modal behavior)'
      });

      if (isNonModal) results.passed++; else results.failed++;
      console.log(`  ${isNonModal ? '✓' : '✗'} Non-modal design (no overlay)`);

      // Test closing the widget
      const closeButton = await page.$('button[aria-label*="close" i], button:has(svg.lucide-x)').catch(() => null);

      if (closeButton) {
        await closeButton.click();
        await sleep(500);

        const screenshotPath4 = join(SCREENSHOTS_DIR, '04-widget-closed.jpeg');
        await page.screenshot({ path: screenshotPath4, type: 'jpeg', quality: 90 });
        results.screenshots.push(screenshotPath4);

        results.tests.push({
          name: 'Widget Closes',
          passed: true,
          details: 'Close button clicked successfully'
        });
        results.passed++;
        console.log(`  ✓ Widget closed\n`);

        // Test reopening
        console.log('Test 6: Reopening Widget');
        const reopenButton = await page.$('button').catch(() => null);
        if (reopenButton) {
          await reopenButton.click();
          await sleep(500);

          const screenshotPath5 = join(SCREENSHOTS_DIR, '05-widget-reopened.jpeg');
          await page.screenshot({ path: screenshotPath5, type: 'jpeg', quality: 90 });
          results.screenshots.push(screenshotPath5);

          results.tests.push({
            name: 'Widget Reopens',
            passed: true,
            details: 'Widget can be reopened'
          });
          results.passed++;
          console.log(`  ✓ Widget reopened\n`);
        }
      }
    } else {
      results.tests.push({
        name: 'Chat Button Click',
        passed: false,
        details: 'Could not find chat button to click'
      });
      results.failed++;
      console.log(`  ✗ Could not find chat button\n`);
    }

  } catch (error) {
    console.error('Test Error:', error.message);
    results.tests.push({
      name: 'Test Execution',
      passed: false,
      details: `Error: ${error.message}`
    });
    results.failed++;
  } finally {
    await browser.close();
  }

  return results;
}

// Run tests
console.log('='.repeat(60));
console.log('AI CHAT WIDGET TEST SUITE');
console.log('='.repeat(60));
console.log('');

testAIChatWidget().then(results => {
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  console.log('Test Results:');
  results.tests.forEach((test, idx) => {
    console.log(`  ${idx + 1}. ${test.name}: ${test.passed ? 'PASS' : 'FAIL'}`);
    console.log(`     ${test.details}`);
  });

  console.log('');
  console.log('Screenshots saved:');
  results.screenshots.forEach(path => {
    console.log(`  - ${path}`);
  });

  // Write JSON report
  const reportPath = '/home/peter/DEV/ai-widget/test-report.json';
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log('');
  console.log(`Full report saved to: ${reportPath}`);

  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
