import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { COLLECTION_SETTINGS, DOC_SETTINGS } from '../config/constants';

export function useExchangeRate(isCaptain) {
    const [exchangeRate, setExchangeRate] = useState(25);
    const [isRateLoading, setIsRateLoading] = useState(false);

    const updateRateInDb = async (newRate) => {
        if (!isCaptain) return;
        try {
            const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_SETTINGS, DOC_SETTINGS);
            await setDoc(settingsRef, { rate: parseFloat(newRate) }, { merge: true });
        } catch (e) { console.error(e); }
    }

    const fetchRate = async () => {
        setIsRateLoading(true);
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            const data = await response.json();
            if (data && data.rates && data.rates.CZK) {
                setExchangeRate(data.rates.CZK);
                if (isCaptain) updateRateInDb(data.rates.CZK);
            }
        } catch (e) {
            console.warn("Failed to auto-fetch rate");
        } finally {
            setIsRateLoading(false);
        }
    };

    const handleManualRateChange = (val) => {
        setExchangeRate(val);
        updateRateInDb(val);
    }

    useEffect(() => {
        fetchRate();
    }, []);

    useEffect(() => {
        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_SETTINGS, DOC_SETTINGS);
        const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setExchangeRate(docSnap.data().rate || 25);
            }
        });
        return () => unsubSettings();
    }, []);

    return {
        exchangeRate,
        isRateLoading,
        fetchRate,
        handleManualRateChange,
        eurToCzk: (eur) => (eur * exchangeRate)
    };
}
