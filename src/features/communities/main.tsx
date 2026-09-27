import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CommunityApp } from './CommunityApp'
import '../../index.css'
import './communities.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CommunityApp />
  </StrictMode>,
)
