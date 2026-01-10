import { createContext, useContext, useEffect, useState } from 'react';
import { dataService } from '../api/dataService';
import toast from 'react-hot-toast';
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

                // SYNC GUEST DATA: Check for existing guest data and upload it
                const guestDataRaw = localStorage.getItem('greenpulse_guest_data');
                if (guestDataRaw) {
                    try {
                        const guestEntries = JSON.parse(guestDataRaw);
                        if (guestEntries && guestEntries.length > 0) {
                            // Upload guest entries to the new user account
                            // We construct the payload expected by dataService.addBulkEmissions
                            // The backend expects 'entries' and 'generate_if_missing'
                            // We need to ensure entries have required fields. Guest data should already match.
                            // We strip ID to let backend generate new ones or mapping? 
                            // Actually backend ignores ID in INSERT usually or uses it?
                            // Backend bulk endpoint: business_id = item.business_id or generate.
                            // Guest items have business_id = 'guest'. We want NEW business_id or existing one?
                            // Let's strip business_id so backend generates a real one (or uses user's existing one if we fetched it? 
                            // But we don't have business_id yet maybe?
                            // Ideally, we upload them, backend assigns them to this user.
                            // If the user already has a business_id, we might want to use it?
                            // For simplicity/robustness: let backend generate/handle.
                            // We just pass the entries associated with this user.

                            const payload = {
                                entries: guestEntries.map(e => ({
                                    ...e,
                                    business_id: null, // Force generation or usage of user's business
                                    user_id: currentUser.uid // dataService might add this but being explicit is good
                                })),
                                generate_if_missing: true
                            };

                            await dataService.addBulkEmissions(payload, currentUser.uid);
                            toast.success('Synced your guest data to your account!');
                        }
                    } catch (e) {
                        console.error("Failed to sync guest data", e);
                    }
                    // Clear guest data after attempt (or success? doing it after attempt to avoid loops/stuck data)
                    localStorage.removeItem('greenpulse_guest_data');
                }

                // Clear other guest artifacts
                localStorage.removeItem('dashboard_cache');
                // localStorage.removeItem('guest_emissions'); // Removed: Incorrect key
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
