import { FORMAT_SLUGS } from './types'

test('exposes the 6 format slugs', () => {
  expect([...FORMAT_SLUGS].sort()).toEqual(['anti', 'knock', 'observ', 'oneliner', 'setup', 'story'])
})
