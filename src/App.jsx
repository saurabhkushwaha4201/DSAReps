import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth/AuthContext';
import { DashboardProvider } from './dashboard/DashboardContext';
import { router } from './routes';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <AuthProvider>
                <DashboardProvider>
                    <RouterProvider router={router} />
                    <ToastContainer position="top-right" theme="dark" />
                </DashboardProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
