import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const logs = [];
  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    errors.push({ message: error.message, stack: error.stack });
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText
    });
  });

  // Track network requests
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      const headers = response.headers();
      let body = null;
      try {
        body = await response.text();
      } catch (e) {
        body = '[Unable to read body]';
      }
      apiCalls.push({
        type: 'response',
        url: response.url(),
        status,
        headers,
        body: body.substring(0, 500)
      });
    }
  });

  try {
    console.log('Opening page and testing chat...\n');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Open chat
    await page.locator('button.fixed.bottom-8.right-8').click();
    await page.waitForTimeout(1000);

    // Type and send message
    await page.locator('textarea').fill('Test message for API call');
    await page.locator('button[type="submit"]').click();

    console.log('Message sent, waiting for response...');
    await page.waitForTimeout(5000);

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('CONSOLE LOGS:');
    console.log('='.repeat(60));
    logs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('PAGE ERRORS:');
    console.log('='.repeat(60));
    if (errors.length === 0) {
      console.log('No errors detected');
    } else {
      errors.forEach(err => {
        console.log(`Message: ${err.message}`);
        console.log(`Stack: ${err.stack}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('NETWORK ERRORS:');
    console.log('='.repeat(60));
    if (networkErrors.length === 0) {
      console.log('No network errors');
    } else {
      networkErrors.forEach(err => {
        console.log(JSON.stringify(err, null, 2));
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('API CALLS:');
    console.log('='.repeat(60));
    if (apiCalls.length === 0) {
      console.log('No API calls detected');
    } else {
      apiCalls.forEach(call => {
        console.log(JSON.stringify(call, null, 2));
        console.log('---');
      });
    }

    await page.screenshot({ path: '/tmp/console_test.png', fullPage: true });
    console.log('\nScreenshot saved to /tmp/console_test.png');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
