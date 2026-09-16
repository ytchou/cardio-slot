import { isIosDevice } from './install'

describe('Given install guidance is evaluated on an Apple tablet', () => {
  it('recognizes iPadOS when it uses the desktop-class user agent', () => {
    expect(isIosDevice({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    })).toBe(true)
  })
})

