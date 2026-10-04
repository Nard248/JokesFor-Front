import { expect, test } from '@playwright/test'
import { declineCookies } from './fixtures/auth'
import { apiGet } from './fixtures/api'

test('the real locale catalogue exposes five native languages and strict intersections', async ({ page }) => {
  await page.goto('/explore')
  await declineCookies(page)
  const catalog = await apiGet<{ languages: { code: string; native_name: string }[]; countries: { code: string }[]; cultures: { slug: string }[] }>(page, '/discovery-locales/')
  for (const code of ['es', 'fr', 'de', 'hy', 'it']) {
    expect(catalog.languages.find((language) => language.code === code)?.native_name).toBeTruthy()
  }
  for (const code of ['ES', 'FR', 'DE', 'AM', 'IT']) expect(catalog.countries.some((country) => country.code === code)).toBe(true)
  for (const [language, country, culture] of [
    ['es', 'ES', 'spain-everyday'], ['fr', 'FR', 'france-everyday'], ['de', 'DE', 'germany-everyday'],
    ['hy', 'AM', 'armenia-everyday'], ['it', 'IT', 'italy-everyday'],
  ]) {
    const response = await apiGet<{ count: number; results: { language: { code: string }; countries: { code: string }[]; culture_tags: { slug: string }[] }[] }>(page, `/jokes/?language=${language}&country=${country}&culture_tags=${culture}`)
    // A missing corpus or a filter that matches nothing must fail, not pass vacuously.
    expect(response.count, `${language}/${country}/${culture} collection`).toBeGreaterThan(0)
    expect(response.results.length).toBeGreaterThan(0)
    for (const joke of response.results) {
      expect(joke.language.code).toBe(language)
      expect(joke.countries.some((item) => item.code === country)).toBe(true)
      expect(joke.culture_tags.some((item) => item.slug === culture)).toBe(true)
    }
  }
  // The negative case only means something next to the non-empty hy collection above.
  const empty = await apiGet<{ count: number }>(page, '/jokes/?language=hy&country=ZZ')
  expect(empty.count).toBe(0)
})

test('switching languages persists, updates real requests, and never retains another language', async ({ page }) => {
  await page.goto('/explore')
  await declineCookies(page)
  await page.getByRole('button', { name: /Joke languages/ }).click()
  const language = page.getByLabel('Joke language', { exact: true })
  await expect(language).toBeVisible()
  const spanishResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/v1/jokes/' && url.searchParams.get('language') === 'es' && response.ok()
  })
  await language.selectOption('es')
  await spanishResponse
  await expect(page.locator('main article[lang="en"]')).toHaveCount(0)
  await expect(page).toHaveURL(/language=es/)
  await page.goto('/explore')
  await expect(page.getByRole('button', { name: /Joke languages/ })).toContainText('Español')
  await page.goto('/explore?language=hy&country=AM&culture_tags=armenia-everyday')
  await page.getByRole('button', { name: /Joke languages/ }).click()
  await expect(page.getByLabel('Joke language', { exact: true })).toHaveValue('hy')
  await expect(page.getByLabel('Country', { exact: true })).toHaveValue('AM')
  await expect(page.getByLabel('Culture', { exact: true })).toHaveValue('armenia-everyday')
  await page.getByRole('button', { name: 'Clear language, country and culture' }).click()
  await expect(page.getByLabel('Joke language', { exact: true })).toHaveValue('')
})

test('locale controls fit phone, tablet and desktop widths', async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/explore?language=hy&country=AM&culture_tags=armenia-everyday')
    await declineCookies(page)
    await page.getByRole('button', { name: /Joke languages/ }).click()
    await expect(page.getByLabel('Joke language', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Country', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Culture', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})
