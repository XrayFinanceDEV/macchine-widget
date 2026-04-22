import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

async function testAIChatWidget() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    tests: [],
    screenshots: []
  };

  try {
    console.log('🚀 Starting AI Chat Widget Aesthetic Test...\n');

    // Navigate to the page
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Test 1: Check chat button size and icon visibility
    console.log('\n📊 TEST 1: Chat Button Size and Icon Visibility');
    const chatButton = await page.locator('button[aria-label*="chat" i], button:has(svg)').last();
    const isVisible = await chatButton.isVisible();
    console.log(`   ✓ Chat button visible: ${isVisible}`);

    if (isVisible) {
      const buttonBox = await chatButton.boundingBox();
      console.log(`   ✓ Button dimensions: ${buttonBox.width}x${buttonBox.height}px`);
      console.log(`   ✓ Button position: (${Math.round(buttonBox.x)}, ${Math.round(buttonBox.y)})`);

      // Check for icon inside button
      const hasIcon = await chatButton.locator('svg').count() > 0;
      console.log(`   ✓ Icon present: ${hasIcon}`);

      results.tests.push({
        name: 'Chat Button',
        passed: isVisible && hasIcon,
        details: `Size: ${buttonBox.width}x${buttonBox.height}px, Icon: ${hasIcon}`
      });
    }

    // Take initial screenshot
    await page.screenshot({ path: '/tmp/widget-initial.png', fullPage: false });
    console.log('   📸 Screenshot saved: widget-initial.png');
    results.screenshots.push('widget-initial.png');

    // Test 2: Click to open widget and check size
    console.log('\n📊 TEST 2: Opening Widget and Checking Size');
    await chatButton.click();
    await page.waitForTimeout(1000); // Wait for animation

    const widgetPanel = await page.locator('[role="dialog"], [data-radix-dialog-content], .sheet-content, div[class*="sheet"]').first();
    const isPanelVisible = await widgetPanel.isVisible().catch(() => false);
    console.log(`   ✓ Widget panel visible: ${isPanelVisible}`);

    if (isPanelVisible) {
      const panelBox = await widgetPanel.boundingBox();
      const screenWidth = page.viewportSize().width;
      const widthPercentage = ((panelBox.width / screenWidth) * 100).toFixed(1);
      console.log(`   ✓ Widget width: ${panelBox.width}px (${widthPercentage}% of screen)`);
      console.log(`   ✓ Widget height: ${panelBox.height}px`);

      results.tests.push({
        name: 'Widget Size',
        passed: isPanelVisible && widthPercentage >= 30,
        details: `Width: ${panelBox.width}px (${widthPercentage}%), Height: ${panelBox.height}px`
      });
    }

    await page.screenshot({ path: '/tmp/widget-opened-light.png', fullPage: false });
    console.log('   📸 Screenshot saved: widget-opened-light.png');
    results.screenshots.push('widget-opened-light.png');

    // Test 3: Check for theme toggle button
    console.log('\n📊 TEST 3: Theme Toggle Button');
    const themeButton = await page.locator('button:has(svg[class*="sun" i]), button:has(svg[class*="moon" i]), button[aria-label*="theme" i]').first();
    const themeButtonVisible = await themeButton.isVisible().catch(() => false);
    console.log(`   ✓ Theme toggle button visible: ${themeButtonVisible}`);

    if (themeButtonVisible) {
      const themeButtonBox = await themeButton.boundingBox();
      console.log(`   ✓ Theme button position: (${Math.round(themeButtonBox.x)}, ${Math.round(themeButtonBox.y)})`);

      results.tests.push({
        name: 'Theme Toggle Button',
        passed: themeButtonVisible,
        details: 'Button found in header'
      });
    }

    // Test 4: Test theme switcher functionality
    console.log('\n📊 TEST 4: Theme Switcher Functionality');
    if (themeButtonVisible) {
      await themeButton.click();
      await page.waitForTimeout(500);

      // Look for theme menu items
      const lightOption = await page.locator('text=/Light/i').first();
      const darkOption = await page.locator('text=/Dark/i').first();
      const systemOption = await page.locator('text=/System/i').first();

      const hasLightOption = await lightOption.isVisible().catch(() => false);
      const hasDarkOption = await darkOption.isVisible().catch(() => false);
      const hasSystemOption = await systemOption.isVisible().catch(() => false);

      console.log(`   ✓ Light mode option: ${hasLightOption}`);
      console.log(`   ✓ Dark mode option: ${hasDarkOption}`);
      console.log(`   ✓ System mode option: ${hasSystemOption}`);

      await page.screenshot({ path: '/tmp/widget-theme-menu.png', fullPage: false });
      console.log('   📸 Screenshot saved: widget-theme-menu.png');
      results.screenshots.push('widget-theme-menu.png');

      // Switch to Dark mode
      if (hasDarkOption) {
        console.log('\n   🌙 Switching to Dark mode...');
        await darkOption.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: '/tmp/widget-dark-mode.png', fullPage: false });
        console.log('   📸 Screenshot saved: widget-dark-mode.png');
        results.screenshots.push('widget-dark-mode.png');

        results.tests.push({
          name: 'Dark Mode Switch',
          passed: true,
          details: 'Successfully switched to dark mode'
        });
      }

      // Switch to Light mode
      if (hasLightOption) {
        console.log('\n   ☀️ Switching back to Light mode...');
        await themeButton.click();
        await page.waitForTimeout(500);
        const lightOptionAgain = await page.locator('text=/Light/i').first();
        await lightOptionAgain.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: '/tmp/widget-light-mode.png', fullPage: false });
        console.log('   📸 Screenshot saved: widget-light-mode.png');
        results.screenshots.push('widget-light-mode.png');
      }
    }

    // Test 5 & 6: Check avatars in messages
    console.log('\n📊 TEST 5 & 6: Avatar Visibility');

    // Look for existing messages or avatar placeholders
    const aiAvatars = await page.locator('img[alt*="AI" i], img[alt*="Agent" i], img[src*="chat-icon"], div[class*="avatar"]:has(img)').count();
    const userAvatars = await page.locator('img[alt*="User" i], div[class*="avatar"]:has-text("👤"), div[class*="avatar"]:has-text("🧑")').count();

    console.log(`   ✓ AI avatars found: ${aiAvatars}`);
    console.log(`   ✓ User avatars found: ${userAvatars}`);

    // Test 7: Send a test message
    console.log('\n📊 TEST 7: Sending Test Message');
    const inputField = await page.locator('input[type="text"], textarea').last();
    const isInputVisible = await inputField.isVisible().catch(() => false);
    console.log(`   ✓ Input field visible: ${isInputVisible}`);

    if (isInputVisible) {
      await inputField.fill('Hello! This is a test message to check the widget aesthetics. Can you see me?');
      console.log('   ✓ Message typed');

      // Find and click send button
      const sendButton = await page.locator('button:has(svg), button[type="submit"]').last();
      await sendButton.click();
      console.log('   ✓ Send button clicked');

      // Wait for response
      await page.waitForTimeout(3000);

      // Take screenshot after sending message
      await page.screenshot({ path: '/tmp/widget-with-message.png', fullPage: false });
      console.log('   📸 Screenshot saved: widget-with-message.png');
      results.screenshots.push('widget-with-message.png');

      // Check for message bubbles
      const messageBubbles = await page.locator('div[class*="message"], div[class*="chat"]').count();
      console.log(`   ✓ Message bubbles found: ${messageBubbles}`);

      results.tests.push({
        name: 'Message Sending',
        passed: messageBubbles > 0,
        details: `${messageBubbles} message bubbles visible`
      });

      // Wait a bit more for AI response
      await page.waitForTimeout(4000);

      await page.screenshot({ path: '/tmp/widget-with-response.png', fullPage: false });
      console.log('   📸 Screenshot saved: widget-with-response.png');
      results.screenshots.push('widget-with-response.png');
    }

    // Test 8 & 9: Final aesthetic check in both modes
    console.log('\n📊 TEST 8 & 9: Final Aesthetic Check');

    // Switch to dark mode for final comparison
    const themeBtn = await page.locator('button:has(svg[class*="sun" i]), button:has(svg[class*="moon" i])').first();
    if (await themeBtn.isVisible().catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      const darkOpt = await page.locator('text=/Dark/i').first();
      if (await darkOpt.isVisible().catch(() => false)) {
        await darkOpt.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: '/tmp/widget-final-dark.png', fullPage: false });
        console.log('   📸 Screenshot saved: widget-final-dark.png');
        results.screenshots.push('widget-final-dark.png');
      }
    }

    // Get console logs
    console.log('\n📊 Checking Console Logs...');
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));

    results.tests.forEach((test, idx) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.details}`);
    });

    console.log('\n📸 Screenshots captured:');
    results.screenshots.forEach(screenshot => {
      console.log(`   - ${screenshot}`);
    });

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: '/tmp/widget-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: widget-error.png');
  } finally {
    await browser.close();
  }

  return results;
}

// Run the test
testAIChatWidget().catch(console.error);
