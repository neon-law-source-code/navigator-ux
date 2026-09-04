import '../../src/styles/fonts.css'
import '../../src/styles/theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
