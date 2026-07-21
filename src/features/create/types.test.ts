import { FORMAT_SLUGS } from './types'

test('exposes the 7 format slugs', () => {
  expect([...FORMAT_SLUGS].sort()).toEqual(['anti', 'image', 'knock', 'observ', 'oneliner', 'setup', 'story'])
})
