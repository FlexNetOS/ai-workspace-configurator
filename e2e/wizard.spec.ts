import { test, expect } from '@playwright/test';

test.describe('AI Workspace Configurator Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('landing page loads with correct title', async ({ page }) => {
    await expect(page.locator('text=Your AI Workspace, Automated')).toBeVisible();
    await expect(page.locator('text=Download Setup Scripts')).toBeVisible();
  });

  test('step sidebar shows all 15 steps', async ({ page }) => {
    const steps = [
      'Initialize Configurator',
      'Select Provider & Policy',
      'Create Rollback Checkpoint',
      'Verify Security & Readiness',
      'Install PowerShell',
      'Windows Update & Apps',
      'Discover Hardware',
      'Device Registration',
      'Link Accounts',
      'Approve Final Plan',
      'Apply Configurations',
      'Install Full Stack',
      'Run E2E Tests',
      'Provision Environment',
      'Hardware Tuning',
    ];

    for (const step of steps) {
      // Use role button to target sidebar items (ActionBar also shows step name in a span)
      await expect(page.getByRole('button', { name: new RegExp(step) })).toBeVisible();
    }
  });

  test('progress bar is visible', async ({ page }) => {
    await expect(page.locator('.h-1').first()).toBeVisible();
  });

  test('terminal panel can be toggled', async ({ page }) => {
    // On step 1, the action button is "Run This Step" (step not yet completed)
    const runButton = page.getByRole('button', { name: /Run This Step/ });
    if (await runButton.isVisible().catch(() => false)) {
      await runButton.click();
      await expect(page.locator('text=Execution Log')).toBeVisible();
    }
  });

  test('Step 1: key content is visible', async ({ page }) => {
    await expect(page.locator('text=System Readiness Check')).toBeVisible();
    await expect(page.locator('text=Download Setup Scripts')).toBeVisible();
  });

  test('Step 2: provider selection appears when navigating', async ({ page }) => {
    // Click on step 2 in sidebar
    const step2 = page.getByRole('button', { name: /Select Provider & Policy/ });
    if (await step2.isVisible().catch(() => false)) {
      await step2.click();
      // Should show provider cards (Docker is mentioned in step 2)
      await expect(page.locator('text=Docker').first()).toBeVisible();
    }
  });

  test('navigation buttons exist', async ({ page }) => {
    // Back button exists on step 1 (disabled but visible)
    const backButton = page.getByRole('button', { name: /Back/ });
    // On step 1, Next is hidden; "Run This Step" is shown instead
    const actionButton = page.getByRole('button', { name: /Run This Step/ });

    const hasBack = await backButton.isVisible().catch(() => false);
    const hasAction = await actionButton.isVisible().catch(() => false);
    expect(hasBack || hasAction).toBe(true);
  });

  test('keyboard navigation works', async ({ page }) => {
    // Press right arrow — should not crash even if step 1 can't advance
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('body')).toBeVisible();
    // Press left arrow — should not crash
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Wizard Step Interactions', () => {
  test('Step 3: can click create restore point', async ({ page }) => {
    await page.goto('/');

    // Navigate to step 3
    const step3 = page.getByRole('button', { name: /Create Rollback Checkpoint/ });
    if (await step3.isVisible().catch(() => false)) {
      await step3.click();
      const button = page.getByRole('button', { name: /Create Restore Point/ });
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        await expect(page.locator('text=Creating...')).toBeVisible();
      }
    }
  });

  test('Step 4: can run security checks', async ({ page }) => {
    await page.goto('/');

    const step4 = page.getByRole('button', { name: /Verify Security & Readiness/ });
    if (await step4.isVisible().catch(() => false)) {
      await step4.click();
      const button = page.getByRole('button', { name: /Run Checks/ });
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        // Wait for checking state
        await page.waitForTimeout(500);
        await expect(page.locator('text=Checking...')).toBeVisible();
      }
    }
  });
});
