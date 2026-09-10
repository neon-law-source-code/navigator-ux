import '../../src/styles/fonts.css'
import '../../src/styles/theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { NeonSite } from '../../gallery/neon-site'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')

const showcase = new URLSearchParams(window.location.search).get('showcase')

createRoot(root).render(
  <StrictMode>{showcase === 'neon' ? <NeonSite /> : <App />}</StrictMode>,
)
