import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './auth/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { router } from './routes';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AuthProvider>
                <ErrorBoundary>
                    <RouterProvider router={router} />
                </ErrorBoundary>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
