import { AppRoutes } from './routes'
import { Providers } from './providers'
import { ConsentBanner } from '@/features/consent'

function App() {
  return (
    <Providers>
      <AppRoutes />
      <ConsentBanner />
    </Providers>
  )
}

export default App
