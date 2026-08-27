import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConsentBanner } from './ConsentBanner'

// The banner is position:fixed with z-index 9999 and the page reserved no space
// for it, so it sat on top of whatever was at the bottom of the viewport:
//  - desktop: onboarding's "Continue" is the last element on a scrolling page,
//    so scrolling it into view landed it under the banner -- enabled but
//    unclickable (elementFromPoint returned the banner's "Accept").
//  - mobile 375x812: it fully covered nav.flow-tabbar (z-index 40), so a
//    first-time visitor could not press any primary navigation tab.
// Both hit only users who had not yet dismissed the banner -- i.e. every new
// user, on the activation path. The fix publishes the banner's height as
// --consent-h so the shell and the tab bar can reserve room for it.

beforeEach(() => {
  localStorage.clear()
  document.documentElement.style.removeProperty('--consent-h')
  // jsdom reports 0 for every measurement; pin a height so the effect has
  // something real to publish.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    height: 67, width: 1440, top: 745, bottom: 812, left: 0, right: 1440, x: 0, y: 745,
    toJSON: () => ({}),
  } as DOMRect)
})

describe('ConsentBanner space reservation', () => {
  it('publishes its height so the page can reserve room while it is visible', () => {
    render(<ConsentBanner />)

    expect(screen.getByRole('region', { name: 'Cookie consent' })).toBeInTheDocument()
    expect(
      document.documentElement.style.getPropertyValue('--consent-h'),
    ).toBe('67px')
  })

  it('releases the reserved space once the user decides', async () => {
    const user = userEvent.setup()
    render(<ConsentBanner />)

    await user.click(screen.getByRole('button', { name: 'Reject' }))

    expect(screen.queryByRole('region', { name: 'Cookie consent' })).toBeNull()
    expect(
      document.documentElement.style.getPropertyValue('--consent-h'),
    ).toBe('0px')
  })
})
