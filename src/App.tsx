import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/common';
import { AuthTestComponent } from '@/components/AuthTestComponent';
import './styles/globals.css';

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="app">
            <div className="app-content container">
              <header style={{ padding: 'var(--spacing-8) 0', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--color-primary-600)' }}>
                  Magic Auth Dashboard
                </h1>
                <p style={{ 
                  color: 'var(--color-gray-600)', 
                  marginTop: 'var(--spacing-4)'
                }}>
                  Authentication Context Ready - Milestone 2.1 Complete
                </p>
              </header>

                             <main style={{ padding: 'var(--spacing-8) 0' }}>
                 <div style={{ 
                   background: 'var(--color-gray-100)', 
                   padding: 'var(--spacing-6)',
                   borderRadius: 'var(--border-radius-lg)',
                   maxWidth: '600px',
                   margin: '0 auto'
                 }}>
                   <h2 style={{ color: 'var(--color-gray-800)', marginBottom: 'var(--spacing-4)' }}>
                     ✅ Milestone 2.1 Complete
                   </h2>
                   <ul style={{ color: 'var(--color-gray-700)', lineHeight: 'var(--line-height-relaxed)' }}>
                     <li>✅ Authentication Context with React Context API</li>
                     <li>✅ Authentication reducer with typed actions</li>
                     <li>✅ Session persistence and token validation</li>
                     <li>✅ useAuth, usePermissions, useUserType hooks</li>
                     <li>✅ Error boundary for auth failures</li>
                     <li>✅ Permission checking utilities</li>
                   </ul>
                 </div>

                 {/* Temporary test component to demonstrate auth context */}
                 <AuthTestComponent />
               </main>

              <footer style={{ 
                textAlign: 'center', 
                padding: 'var(--spacing-8) 0',
                color: 'var(--color-gray-500)',
                fontSize: 'var(--font-size-sm)'
              }}>
                Next: Milestone 2.2 - Route Protection System
              </footer>
            </div>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
