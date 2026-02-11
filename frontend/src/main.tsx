import { createRoot } from 'react-dom/client'
import './index.css'
import { Web3Provider } from './contexts/Web3Context.tsx'
import { AlertProvider } from './contexts/AlertContext.tsx'
import { ProposalsProvider } from './contexts/ProposalsContext.tsx'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <Web3Provider>
        <AlertProvider>
            <ProposalsProvider>
                <App />
            </ProposalsProvider>
        </AlertProvider>
    </Web3Provider>,
);
