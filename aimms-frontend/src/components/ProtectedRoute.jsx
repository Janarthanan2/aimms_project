import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // 1. Not Authenticated
    if (!token) {
        return <Navigate to="/login-user" replace />;
    }

    // 2. Role Authorization
    if (allowedRoles) {
        const hasRole = allowedRoles.includes(role);
        if (!hasRole) {
            // Unauthorized access: Redirect to harmless page or login
            // Admin users trying to access user pages -> Dashboard?
            // User trying to access admin pages -> User Login?
            return <Navigate to="/login-user" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
