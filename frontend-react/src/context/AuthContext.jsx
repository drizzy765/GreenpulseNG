import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Get and store token for backend requests
                const token = await currentUser.getIdToken();
                localStorage.setItem('token', token);

                // Clear guest data on login to ensure clean state
                localStorage.removeItem('guest_emissions');
                localStorage.removeItem('dashboard_cache');
            } else {
                // Clear token on logout
                localStorage.removeItem('token');
            }

            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Auth Functions
    const loginEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const registerEmail = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const loginGoogle = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = () => {
        return signOut(auth);
    };

    const updateUserProfile = (profileData) => {
        if (auth.currentUser) {
            return updateProfile(auth.currentUser, profileData);
        }
        return Promise.resolve();
    }

    const value = {
        user,
        loading,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        updateUserProfile,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
