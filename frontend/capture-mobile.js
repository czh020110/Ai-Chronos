const { chromium } = require("./node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // Use 'load' instead of 'networkidle' for faster initial load
  await page.goto("http://localhost:3002", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(8000); // Wait for JS rendering

  // 1. Page overflow
  const overflowInfo = await page.evaluate(() => {
    const html = document.documentElement;
    return {
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      hasHorizontalOverflow: html.scrollWidth > html.clientWidth,
    };
  });
  console.log("=== Overflow (Dark) ===", JSON.stringify(overflowInfo));

  // 2. NavBar
  const navInfo = await page.evaluate(() => {
    const header = document.querySelector("header");
    if (!header) return { error: "no header" };
    const rect = header.getBoundingClientRect();
    const h1 = header.querySelector("h1");
    const tR = h1 ? h1.getBoundingClientRect() : null;
    const isTrunc = h1 ? h1.scrollWidth > h1.clientWidth : null;
    const btns = header.querySelectorAll("button");
    let thR = null, seR = null;
    for (const b of btns) {
      const l = b.getAttribute("aria-label") || "";
      if (l.includes("主题")) thR = b.getBoundingClientRect();
      if (l.includes("搜索")) seR = b.getBoundingClientRect();
    }
    return {
      headerW: rect.width, headerR: rect.right,
      titleW: tR ? tR.width : 0, titleR: tR ? tR.right : 0,
      isTrunc,
      themeL: thR ? thR.x : 0, themeR: thR ? thR.right : 0,
      searchR: seR ? seR.right : 0,
      overlap: tR && thR ? tR.right > thR.x : null,
    };
  });
  console.log("=== NavBar ===", JSON.stringify(navInfo));
  await page.screenshot({ path: "/tmp/mobile-screenshots/01-dark-theme-main.png", fullPage: false });

  // Light theme
  await page.locator('button[aria-label="切换到白天主题"]').click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/mobile-screenshots/02-light-theme-main.png", fullPage: false });

  const lightOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  console.log("=== Overflow (Light) ===", JSON.stringify(lightOverflow));

  // Back to dark
  await page.locator('button[aria-label="切换到黑夜主题"]').click();
  await page.waitForTimeout(1500);

  // 3. DetailDrawer - scan for clickable nodes
  console.log("\n=== DetailDrawer ===");

  // Check what elements are at various points in the viewport
  const scanResults = await page.evaluate(() => {
    const results = [];
    for (const y of [200, 250, 300, 350, 400, 450, 500]) {
      const els = document.elementsFromPoint(187, y);
      results.push({
        y,
        top3: els.slice(0, 3).map(e => ({
          tag: e.tagName,
          cls: (e.className || '').substring(0, 50),
        })),
      });
    }
    return results;
  });
  console.log("Scan results:", JSON.stringify(scanResults, null, 2));

  // Try tapping multiple positions to find a timeline node
  for (const pos of [{x: 187, y: 350}, {x: 100, y: 400}, {x: 280, y: 400}]) {
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(1500);
    const drawerState = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      if (!aside) return { found: false };
      const rect = aside.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    });
    console.log(`  After click (${pos.x},${pos.y}): drawer=${JSON.stringify(drawerState)}`);
    if (drawerState.w > 0 && drawerState.h > 0) break;
  }

  // If drawer didn't open from timeline, use list view
  const drawerOpened = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return false;
    const rect = aside.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  if (!drawerOpened) {
    console.log("Drawer not opened from timeline clicks. Switching to list view first...");
    await page.locator('button[aria-label="切换到事件档案视图"]').click();
    await page.waitForTimeout(2500);
    const container = page.locator('[class*="overflow-y-auto"]');
    const btns = container.locator('button');
    if (await btns.count() > 0) {
      await btns.first().click();
      await page.waitForTimeout(2000);
    }
  }

  const drawerInfo = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return { error: "not found" };
    const rect = aside.getBoundingClientRect();
    const style = window.getComputedStyle(aside);
    return {
      x: rect.x, y: rect.y, w: rect.width, h: rect.height, bottom: rect.bottom,
      position: style.position,
      isBottomSheet: style.position === 'fixed' && rect.left === 0 && Math.abs(rect.bottom - window.innerHeight) < 5,
      heightFrac: (rect.height / window.innerHeight).toFixed(3),
      hasCloseBtn: !!aside.querySelector('button[aria-label="关闭详情抽屉"]'),
    };
  });
  console.log("Drawer info:", JSON.stringify(drawerInfo));
  await page.screenshot({ path: "/tmp/mobile-screenshots/03-detail-drawer.png", fullPage: false });

  // Close drawer
  const closeBtn = page.locator('button[aria-label="关闭详情抽屉"]');
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // 4. SearchPanel
  console.log("\n=== SearchPanel ===");
  await page.locator('button[aria-label="打开搜索面板"]').click();
  await page.waitForTimeout(1500);

  const searchInfo = await page.evaluate(() => {
    const panels = document.querySelectorAll('.fixed');
    let sp = null;
    for (const el of panels) {
      if (el.querySelector('input[type="text"]')) { sp = el; break; }
    }
    if (!sp) return { error: "not found" };
    const rect = sp.getBoundingClientRect();
    return {
      x: rect.x, y: rect.y, w: rect.width, h: rect.height,
      nearlyFull: rect.width >= window.innerWidth - 16 && rect.height >= window.innerHeight - 16,
      hFrac: (rect.height / window.innerHeight).toFixed(3),
    };
  });
  console.log(JSON.stringify(searchInfo));
  await page.screenshot({ path: "/tmp/mobile-screenshots/04-search-panel.png", fullPage: false });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);

  // 5. ListView
  console.log("\n=== ListView ===");
  // We might already be in list view. Check current view and switch if needed
  const currentView = await page.evaluate(() => {
    const listActive = document.querySelector('button[aria-label="切换到事件档案视图"][class*="cosmos-gold"]');
    return { isListView: !!listActive };
  });
  console.log("Current view:", JSON.stringify(currentView));

  if (!currentView.isListView) {
    await page.locator('button[aria-label="切换到事件档案视图"]').click();
    await page.waitForTimeout(2500);
  }

  const listInfo = await page.evaluate(() => {
    const c = document.querySelector('[class*="overflow-y-auto"]');
    if (!c) return { error: "no container" };
    const items = c.querySelectorAll('button');
    const first = items[0];
    if (!first) return { error: "no items" };
    const rect = first.getBoundingClientRect();
    const style = window.getComputedStyle(first);
    return {
      count: items.length,
      w: rect.width, h: rect.height,
      dir: style.flexDirection,
      stacked: style.flexDirection === 'column',
      hasFlexCol: first.className.includes('flex-col'),
      hasSmGrid: first.className.includes('sm:grid'),
    };
  });
  console.log(JSON.stringify(listInfo));
  await page.screenshot({ path: "/tmp/mobile-screenshots/05-list-view.png", fullPage: false });

  // Light theme + list view
  await page.locator('button[aria-label="切换到白天主题"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/mobile-screenshots/06-list-view-light.png", fullPage: false });

  // DetailDrawer from list view (light theme)
  const listC2 = page.locator('[class*="overflow-y-auto"]');
  const listB2 = listC2.locator('button');
  if (await listB2.count() > 0) {
    await listB2.first().click();
    await page.waitForTimeout(2000);
  }

  const drawerLight = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return { error: "not found" };
    const rect = aside.getBoundingClientRect();
    const style = window.getComputedStyle(aside);
    return {
      x: rect.x, y: rect.y, w: rect.width, h: rect.height,
      isBottomSheet: style.position === 'fixed' && rect.left === 0 && Math.abs(rect.bottom - window.innerHeight) < 5,
      hFrac: (rect.height / window.innerHeight).toFixed(3),
    };
  });
  console.log("Drawer (light):", JSON.stringify(drawerLight));
  await page.screenshot({ path: "/tmp/mobile-screenshots/07-detail-drawer-light.png", fullPage: false });

  // 7. Timeline mobile scale
  console.log("\n=== Timeline Scale ===");
  const closeDrawer2 = page.locator('button[aria-label="关闭详情抽屉"]');
  if (await closeDrawer2.count() > 0) {
    await closeDrawer2.click();
    await page.waitForTimeout(1000);
  }
  await page.locator('button[aria-label="切换到黑夜主题"]').click();
  await page.waitForTimeout(1500);
  await page.locator('button[aria-label="切换到螺旋时间线视图"]').click();
  await page.waitForTimeout(2500);

  const scaleInfo = await page.evaluate(() => {
    const winH = window.innerHeight;
    const mobileScale = winH < 700 ? Math.max(0.6, winH / 900) : 1;
    return { winH, mobileScale, shouldScale: winH < 700 };
  });
  console.log(JSON.stringify(scaleInfo));
  await page.screenshot({ path: "/tmp/mobile-screenshots/08-timeline-nodes.png", fullPage: false });

  // Final: check dark theme properly renders
  console.log("\n=== Theme toggle final check ===");
  // Currently in dark theme. Toggle to light and back to verify
  await page.locator('button[aria-label="切换到白天主题"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/mobile-screenshots/09-light-theme-final.png", fullPage: false });

  await page.locator('button[aria-label="切换到黑夜主题"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/mobile-screenshots/10-dark-theme-final.png", fullPage: false });

  await browser.close();
  console.log("\nAll screenshots saved to /tmp/mobile-screenshots/");
})();
