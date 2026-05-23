import { render, screen } from '@testing-library/react'
import { JokeRenderer, type JokePayload } from './JokeRenderer'

const base: JokePayload = { format: 'oneliner', text: '', setup: '', punchline: '', lines: null }

test('oneliner renders its text', () => {
  render(<JokeRenderer payload={{ ...base, format: 'oneliner', text: 'I put down a book on anti-gravity.' }} />)
  expect(screen.getByText(/anti-gravity/)).toBeInTheDocument()
})

test('setup is revealed (no blur gate) when revealed=true', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'setup', setup: 'Why did the scarecrow win?', punchline: 'Outstanding in his field.' }}
      revealed
    />,
  )
  expect(screen.getByText('Outstanding in his field.')).toBeInTheDocument()
  expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
})

test('knock renders all lines when interactive=false', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'knock', lines: ['Knock, knock.', "Who's there?", 'Olive.', 'Olive who?'] }}
      revealed
      interactive={false}
    />,
  )
  expect(screen.getByText('Olive who?')).toBeInTheDocument()
})

test('anti renders the auto footer', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'anti', setup: 'Why did the chicken cross the road?', punchline: 'To get to the other side.' }}
      revealed
    />,
  )
  expect(screen.getByText(/That's it\. That's the joke\./i)).toBeInTheDocument()
})
