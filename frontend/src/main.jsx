import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import {PrimeReactProvider} from 'primereact/api';
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrimeReactProvider>
      <Router>
        <App />
      </Router>
    </PrimeReactProvider>
  </StrictMode>,
)
