import { FORMAT_SLUGS } from './types'

test('exposes the 9 format slugs', () => {
  expect([...FORMAT_SLUGS].sort()).toEqual(['anti', 'audio', 'image', 'knock', 'observ', 'oneliner', 'setup', 'story', 'video'])
})
