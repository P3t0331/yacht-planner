import { useState, useEffect } from 'react';
import {
    signInAnonymously,
    onAuthStateChanged,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [isCaptain, setIsCaptain] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const initAuth = async () => {
            // 1. Handle Magic Token (Sandbox/AI Environment)
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                try {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } catch (e) {
                    console.error("Custom token auth failed", e);
                }
            }
        };

        initAuth();

        // 2. Listen for Auth Changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // User is logged in (Captain or Guest)
                setUser(currentUser);
                setIsCaptain(!currentUser.isAnonymous);
            } else {
                // No user logged in, fallback to Guest
                signInAnonymously(auth).catch((e) => console.warn("Guest login failed", e));
            }
        });
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        setAuthError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Auth Error:", error);
            if (error.code === 'auth/operation-not-allowed') {
                setAuthError('Configuration Error: Enable "Email/Password" in Firebase Console.');
            } else {
                setAuthError("Invalid credentials. Only authorized Captains may enter.");
            }
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        signInAnonymously(auth).catch((e) => console.warn("Guest re-login failed", e));
    };

    return {
        user,
        isCaptain,
        authError,
        setAuthError,
        login,
        logout
    };
}
