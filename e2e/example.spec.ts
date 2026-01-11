import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display the hero section', async ({ page }) => {
    await page.goto('/')

    // Check hero heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Find Your')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Perfect Joke')

    // Check search input
    await expect(page.getByPlaceholder('Search for jokes about...')).toBeVisible()

    // Check quick category buttons (without emojis now)
    await expect(page.getByRole('button', { name: 'Dad Jokes' })).toBeVisible()
  })

  test('should show header navigation', async ({ page, isMobile }) => {
    await page.goto('/')

    // Check logo in header
    await expect(page.getByRole('link', { name: 'Jokes For' }).first()).toBeVisible()

    if (!isMobile) {
      // Check navigation links (desktop only)
      await expect(page.getByRole('link', { name: /Daily/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /Saved/i })).toBeVisible()
    } else {
      // Mobile should have hamburger menu
      await expect(page.getByLabel('Toggle menu')).toBeVisible()
    }
  })

  test('should navigate to daily jokes page', async ({ page, isMobile }) => {
    await page.goto('/')

    if (isMobile) {
      // Open mobile menu first
      await page.getByLabel('Toggle menu').click()
    }

    // Click Daily link
    await page.getByRole('link', { name: /Daily/i }).first().click()

    // Should be on daily page
    await expect(page).toHaveURL('/daily')
    await expect(page.getByText('Daily Joke')).toBeVisible()
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should toggle mobile menu', async ({ page }) => {
    await page.goto('/')

    // Click hamburger
    await page.getByLabel('Toggle menu').click()

    // Menu items should be visible
    await expect(page.getByRole('link', { name: /Daily/i })).toBeVisible()
  })
})

test.describe('Auth Pages', () => {
  test('login page should render without layout', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('Login')).toBeVisible()

    // Header should NOT be present on auth pages
    await expect(page.locator('header')).not.toBeVisible()
  })
})
