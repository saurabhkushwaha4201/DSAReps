import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import AuthSuccess from './auth/AuthSuccess';
import Today from './dashboard/Today';
import AllProblems from './dashboard/AllProblems';
import Progress from './dashboard/Progress';
import DashboardLayout from './dashboard/DashboardLayout';
import ProtectedRoute from './auth/ProtectedRoute';

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
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: 'today',
                element: <Today />,
            },
            {
                path: 'all',
                element: <AllProblems />,
            },
            {
                path: 'progress',
                element: <Progress />,
            },
            {
                index: true,
                element: <Navigate to="/dashboard/today" replace />,
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/dashboard/today" replace />,
    },
]);
