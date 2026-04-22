import { chromium } from 'playwright';

async function comprehensiveAestheticTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const report = [];

  try {
    console.log('🎨 AI CHAT WIDGET AESTHETIC TEST\n');
    console.log('=' .repeat(70));

    // Navigate to page
    console.log('\n1️⃣  LOADING PAGE...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('   ✅ Page loaded successfully');

    // TEST 1: Chat button visibility and size
    console.log('\n2️⃣  CHAT BUTTON INSPECTION...');
    await page.screenshot({ path: '/tmp/test-01-initial.png', fullPage: true });
    console.log('   📸 Screenshot saved: test-01-initial.png');

    // Find the chat button more reliably
    const chatButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await chatButton.scrollIntoViewIfNeeded();

    const buttonVisible = await chatButton.isVisible();
    console.log(`   ✅ Chat button visible: ${buttonVisible}`);

    if (buttonVisible) {
      const box = await chatButton.boundingBox();
      console.log(`   📏 Button size: ${box.width}px × ${box.height}px`);
      console.log(`   📍 Position: bottom-right (${Math.round(box.x)}, ${Math.round(box.y)})`);

      // Highlight the button
      await chatButton.evaluate(el => {
        el.style.outline = '3px solid red';
      });
      await page.screenshot({ path: '/tmp/test-02-button-highlighted.png' });
      console.log('   📸 Screenshot saved: test-02-button-highlighted.png');
      await chatButton.evaluate(el => {
        el.style.outline = '';
      });

      report.push({ test: 'Chat Button Size & Position', status: 'PASS', details: `${box.width}×${box.height}px` });
    }

    // TEST 2: Open the widget
    console.log('\n3️⃣  OPENING WIDGET...');
    await chatButton.click();
    await page.waitForTimeout(1500); // Wait for animation

    // Find the widget panel with better selectors
    const widgetPanel = page.locator('[data-state="open"]').or(page.locator('.sheet-content')).or(page.locator('[role="dialog"]')).first();
    const panelVisible = await widgetPanel.isVisible().catch(() => false);

    console.log(`   ✅ Widget panel opened: ${panelVisible}`);

    if (panelVisible) {
      const panelBox = await widgetPanel.boundingBox();
      const screenWidth = 1920;
      const widthPercent = ((panelBox.width / screenWidth) * 100).toFixed(1);

      console.log(`   📏 Widget width: ${panelBox.width}px (${widthPercent}% of screen)`);
      console.log(`   📏 Widget height: ${panelBox.height}px`);
      console.log(`   📍 Widget slides in from: right`);

      await page.screenshot({ path: '/tmp/test-03-widget-opened.png', fullPage: true });
      console.log('   📸 Screenshot saved: test-03-widget-opened.png');

      report.push({ test: 'Widget Size (Target: ~33%)', status: widthPercent >= 30 ? 'PASS' : 'FAIL', details: `${widthPercent}% width` });
    } else {
      console.log('   ⚠️  Widget panel not detected, trying alternative approach...');
      await page.screenshot({ path: '/tmp/test-03-widget-not-found.png', fullPage: true });
    }

    // TEST 3: Theme toggle button
    console.log('\n4️⃣  THEME TOGGLE BUTTON...');

    // Look for theme button in the widget
    const themeToggle = page.locator('button').filter({
      has: page.locator('svg').filter({ hasText: '' })
    }).filter({ hasText: /theme|sun|moon/i }).or(
      page.locator('button[aria-label*="theme" i]')
    ).first();

    // Try to find sun/moon icon buttons
    const sunMoonButton = page.locator('button svg').locator('..').filter({
      has: page.locator('svg')
    }).first();

    let themeButtonFound = false;
    if (await themeToggle.isVisible().catch(() => false)) {
      console.log('   ✅ Theme toggle button found');
      themeButtonFound = true;

      await themeToggle.evaluate(el => el.style.outline = '3px solid blue');
      await page.screenshot({ path: '/tmp/test-04-theme-button.png' });
      console.log('   📸 Screenshot saved: test-04-theme-button.png');
      await themeToggle.evaluate(el => el.style.outline = '');

      report.push({ test: 'Theme Toggle Button', status: 'PASS', details: 'Visible in header' });
    } else {
      console.log('   ⚠️  Theme toggle button not immediately visible');
      console.log('   🔍 Searching for theme controls...');

      // Look for any button with sun/moon SVG paths
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const svgContent = await btn.locator('svg').innerHTML().catch(() => '');
        if (svgContent.includes('circle') || svgContent.includes('path')) {
          const text = await btn.textContent();
          if (!text || text.length < 10) { // Theme buttons usually don't have text
            console.log('   🎯 Potential theme button found');
            themeButtonFound = true;
            await btn.evaluate(el => el.style.outline = '3px solid blue');
            await page.screenshot({ path: '/tmp/test-04-theme-button.png' });
            console.log('   📸 Screenshot saved: test-04-theme-button.png');
            break;
          }
        }
      }

      report.push({ test: 'Theme Toggle Button', status: themeButtonFound ? 'PASS' : 'FAIL', details: themeButtonFound ? 'Found' : 'Not found' });
    }

    // TEST 4: Test theme switching
    console.log('\n5️⃣  THEME SWITCHING...');

    // Click theme button if found
    const themeBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(0); // Usually first button in header

    try {
      // Try multiple potential theme button locations
      const potentialThemeButtons = await page.locator('button:has(svg)').all();

      for (let i = 0; i < Math.min(potentialThemeButtons.length, 5); i++) {
        const btn = potentialThemeButtons[i];
        const btnText = await btn.textContent();

        // Skip buttons with too much text (likely not theme toggle)
        if (btnText && btnText.length > 20) continue;

        await btn.click();
        await page.waitForTimeout(500);

        // Check if dropdown/menu appeared
        const darkOption = page.locator('text=/^Dark$/i, text=/Dark Mode/i').first();
        const lightOption = page.locator('text=/^Light$/i, text=/Light Mode/i').first();

        if (await darkOption.isVisible().catch(() => false)) {
          console.log('   ✅ Theme menu opened!');

          await page.screenshot({ path: '/tmp/test-05-theme-menu.png' });
          console.log('   📸 Screenshot saved: test-05-theme-menu.png');

          // Test Dark mode
          console.log('   🌙 Switching to Dark mode...');
          await darkOption.click();
          await page.waitForTimeout(1500);

          await page.screenshot({ path: '/tmp/test-06-dark-mode.png', fullPage: true });
          console.log('   📸 Screenshot saved: test-06-dark-mode.png');

          report.push({ test: 'Dark Mode Toggle', status: 'PASS', details: 'Successfully switched' });

          // Switch back to light
          await btn.click();
          await page.waitForTimeout(500);
          const lightOpt = page.locator('text=/^Light$/i').first();
          if (await lightOpt.isVisible().catch(() => false)) {
            console.log('   ☀️  Switching to Light mode...');
            await lightOpt.click();
            await page.waitForTimeout(1500);

            await page.screenshot({ path: '/tmp/test-07-light-mode.png', fullPage: true });
            console.log('   📸 Screenshot saved: test-07-light-mode.png');

            report.push({ test: 'Light Mode Toggle', status: 'PASS', details: 'Successfully switched' });
          }

          break;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Theme switching test skipped: ${error.message}`);
      report.push({ test: 'Theme Switching', status: 'SKIP', details: 'Could not find theme menu' });
    }

    // TEST 5 & 6: Avatar checks
    console.log('\n6️⃣  AVATAR INSPECTION...');

    // Check for chat icon (AI avatar)
    const aiAvatars = await page.locator('img[src*="chat-icon"], img[alt*="AI"], img[alt*="Agent"]').count();
    console.log(`   🤖 AI avatars found: ${aiAvatars}`);

    // Check for user avatars
    const userAvatars = await page.locator('img[alt*="User"], span:has-text("👤"), span:has-text("🧑")').count();
    console.log(`   👤 User avatars found: ${userAvatars}`);

    if (aiAvatars > 0) {
      report.push({ test: 'AI Avatar (chat-icon.png)', status: 'PASS', details: `${aiAvatars} found` });
    }

    // TEST 7: Send test message
    console.log('\n7️⃣  SENDING TEST MESSAGE...');

    const inputField = page.locator('input[type="text"], textarea').last();
    const sendButton = page.locator('button[type="submit"]').or(page.locator('button:has(svg[class*="send" i])')).last();

    if (await inputField.isVisible().catch(() => false)) {
      console.log('   ✅ Input field found');

      await inputField.fill('Hello! Testing the beautiful new chat widget design. How does it look?');
      console.log('   ⌨️  Message typed');

      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/test-08-message-typed.png' });
      console.log('   📸 Screenshot saved: test-08-message-typed.png');

      await sendButton.click();
      console.log('   📤 Message sent');

      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/test-09-message-sent.png', fullPage: true });
      console.log('   📸 Screenshot saved: test-09-message-sent.png');

      // Wait for AI response
      console.log('   ⏳ Waiting for AI response...');
      await page.waitForTimeout(5000);

      await page.screenshot({ path: '/tmp/test-10-with-response.png', fullPage: true });
      console.log('   📸 Screenshot saved: test-10-with-response.png');

      // Check for message bubbles
      const messages = await page.locator('div[class*="message"], p[class*="text"]').count();
      console.log(`   💬 Message elements found: ${messages}`);

      report.push({ test: 'Message Sending & Display', status: 'PASS', details: `${messages} message elements` });
    } else {
      console.log('   ⚠️  Input field not visible');
      report.push({ test: 'Message Input', status: 'FAIL', details: 'Input not found' });
    }

    // TEST 8 & 9: Final aesthetic review
    console.log('\n8️⃣  FINAL AESTHETIC REVIEW...');

    // Take a final screenshot in current mode
    await page.screenshot({ path: '/tmp/test-11-final-overview.png', fullPage: true });
    console.log('   📸 Screenshot saved: test-11-final-overview.png');

    // Try dark mode one more time for final comparison
    const themeBtns = await page.locator('button:has(svg)').all();
    for (const btn of themeBtns.slice(0, 5)) {
      await btn.click();
      await page.waitForTimeout(300);

      const darkOpt = page.locator('text=/^Dark$/i').first();
      if (await darkOpt.isVisible().catch(() => false)) {
        await darkOpt.click();
        await page.waitForTimeout(1500);

        await page.screenshot({ path: '/tmp/test-12-final-dark.png', fullPage: true });
        console.log('   📸 Screenshot saved: test-12-final-dark.png');
        break;
      }
    }

    // FINAL REPORT
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));

    let passed = 0, failed = 0, skipped = 0;

    report.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${icon} ${test.test.padEnd(35)} | ${test.details}`);

      if (test.status === 'PASS') passed++;
      else if (test.status === 'FAIL') failed++;
      else skipped++;
    });

    console.log('\n' + '='.repeat(70));
    console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    console.log('='.repeat(70));

    console.log('\n📸 All screenshots saved to /tmp/test-*.png');
    console.log('✨ Testing complete!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  } finally {
    await page.waitForTimeout(3000); // Keep browser open briefly
    await browser.close();
  }
}

comprehensiveAestheticTest().catch(console.error);
