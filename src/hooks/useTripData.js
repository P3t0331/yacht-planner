import { useState, useEffect } from 'react';
import { doc, onSnapshot, query, collection } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useTripData(tripId, user) {
    const [tripData, setTripData] = useState(null);
    const [yachts, setYachts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pax, setPax] = useState(8);

    useEffect(() => {
        if (!tripId) return;

        // Fetch Trip Data
        const tripRef = doc(db, 'artifacts', appId, 'trips', tripId);
        const unsubTrip = onSnapshot(tripRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTripData(data);
                if (data.confirmedGuests) setPax(data.confirmedGuests);
            }
        });

        // Fetch Yachts for this Trip
        const q = query(collection(db, 'artifacts', appId, 'trips', tripId, 'yachts'));
        const unsubYachts = onSnapshot(q, (snapshot) => {
            const loadedYachts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setYachts(loadedYachts);
            setLoading(false);
        });

        return () => {
            unsubTrip();
            unsubYachts();
        };
    }, [user, tripId]);

    return {
        tripData,
        yachts,
        loading,
        pax,
        setPax
    };
}
