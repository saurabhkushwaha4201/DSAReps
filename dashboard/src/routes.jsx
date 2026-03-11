import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import AuthSuccess from './auth/AuthSuccess';
import ProtectedRoute from './auth/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import DashboardHome from './features/dashboard/DashboardHome';
import SettingsPage from './features/dashboard/SettingsPage';
import ProblemList from './features/problems/ProblemList';


export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/extension-auth-success',
        element: <AuthSuccess />,
    },

    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <DashboardHome />,
            },
            {
                path: 'problems',
                element: <ProblemList />,
            },
            {
                path: 'settings',
                element: <SettingsPage />,
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]);
