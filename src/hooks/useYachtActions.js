import { useState } from 'react';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { parsePrice } from '../utils/formatters';

export function useYachtActions(tripId, isCaptain, tripData) {
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const saveYacht = async (formData, editingId) => {
        if (!isCaptain) return;
        if (!formData.name) return;

        const payload = {
            name: formData.name,
            link: formData.link,
            detailsLink: formData.detailsLink,
            imageUrl: formData.imageUrl,
            price: parseFloat(formData.price) || 0,
            charterPack: parseFloat(formData.charterPack) || 0,
            extras: parseFloat(formData.extras) || 0,
            marina: formData.marina || '',
            maxGuests: parseInt(formData.maxGuests) || 0,
            updatedAt: serverTimestamp(),
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId, 'yachts', editingId), payload);
            } else {
                await addDoc(collection(db, 'artifacts', appId, 'trips', tripId, 'yachts'), {
                    ...payload,
                    createdAt: serverTimestamp()
                });
            }
            return true;
        } catch (error) {
            console.error("Error saving:", error);
            return false;
        }
    };

    const deleteYacht = async (id) => {
        if (!isCaptain) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'trips', tripId, 'yachts', id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const selectYacht = async (yachtId) => {
        if (!isCaptain) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId), {
                selectedYachtId: yachtId === tripData?.selectedYachtId ? null : yachtId
            });
        } catch (error) {
            console.error("Error selecting yacht:", error);
        }
    };

    const confirmTrip = async (selectedYacht, pax) => {
        if (!isCaptain || !selectedYacht) return;

        const totalCost = selectedYacht.price + selectedYacht.charterPack + selectedYacht.extras;
        const deposit = totalCost * 0.5;
        const final = totalCost * 0.5;

        try {
            await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId), {
                status: 'confirmed',
                depositAmount: deposit,
                finalPaymentAmount: final,
                confirmedGuests: pax // Lock guest count
            });
            return true;
        } catch (error) {
            console.error("Error confirming trip:", error);
            return false;
        }
    };

    const updateTripSettings = async (settings) => {
        if (!isCaptain) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId), {
                confirmedGuests: parseInt(settings.confirmedGuests) || null,
                captainIbanEur: settings.captainIbanEur,
                captainIbanCzk: settings.captainIbanCzk,
                depositAmount: parseFloat(settings.depositAmount) || 0,
                finalPaymentAmount: parseFloat(settings.finalPaymentAmount) || 0
            });
            return true;
        } catch (error) {
            console.error("Error saving settings:", error);
            return false;
        }
    };

    // --- SMART PARSING LOGIC (AAAYacht) ---
    const fetchAaayachtData = async (url, setFormData) => {
        if (!url) return;
        setIsFetchingData(true);
        setFetchError(false);

        let htmlContent = "";
        let fetchSuccess = false;

        try {
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.contents) {
                        htmlContent = data.contents;
                        fetchSuccess = true;
                    }
                }
            } catch (err1) { console.warn("Proxy 1 failed"); }

            if (!fetchSuccess) {
                try {
                    const backupProxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    const response = await fetch(backupProxy);
                    if (response.ok) {
                        htmlContent = await response.text();
                        fetchSuccess = true;
                    }
                } catch (err2) { console.warn("Proxy 2 failed"); }
            }

            if (!fetchSuccess || !htmlContent) {
                throw new Error("All proxies failed");
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");

            const nameEl = doc.querySelector('h1.yacht-name-header');
            const name = nameEl ? nameEl.textContent.trim() : "";

            const imgEl = doc.querySelector('meta[property="og:image"]');
            const image = imgEl ? imgEl.getAttribute('content') : "";

            let techSpecsUrl = "";
            if (image) {
                const idMatch = image.match(/yacht\/(\d+)\//);
                if (idMatch && idMatch[1]) {
                    techSpecsUrl = `https://ws.nausys.com/CBMS-external/rest/yacht/${idMatch[1]}/html`;
                }
            }

            const priceContainer = doc.querySelector('.price-after-discount');
            let price = 0;
            if (priceContainer) {
                const text = priceContainer.textContent;
                const match = text.match(/([\d\s]+[,.]\d{2})/);
                if (match && match[1]) {
                    price = parsePrice(match[1]);
                }
            }

            let charterPack = 0;
            const allElements = Array.from(doc.querySelectorAll('*'));
            const labelNode = allElements.find(el =>
                el.children.length === 0 &&
                (el.textContent.toLowerCase().includes('charter package') ||
                    el.textContent.toLowerCase().includes('transit log'))
            );

            if (labelNode) {
                const parentRow = labelNode.closest('.row');
                if (parentRow) {
                    const bTag = parentRow.querySelector('b');
                    if (bTag) {
                        charterPack = parsePrice(bTag.textContent);
                    }
                }
            }

            // Extract marina location - look for <b>Marína</b> in <p> tags
            let marina = '';
            const marinaParagraphs = Array.from(doc.querySelectorAll('p'));
            const marinaP = marinaParagraphs.find(p => {
                const bTag = p.querySelector('b');
                return bTag && (
                    bTag.textContent.toLowerCase().includes('marína') ||
                    bTag.textContent.toLowerCase().includes('marina') ||
                    bTag.textContent.toLowerCase().includes('port')
                );
            });

            if (marinaP) {
                // Extract text after the <b> tag
                const text = marinaP.textContent;
                const colonIndex = text.indexOf(':');
                if (colonIndex !== -1) {
                    marina = text.substring(colonIndex + 1).trim();
                }
            }

            // Extract max guests / capacity - look for dt/dd structure
            let maxGuests = 0;
            const dtElements = Array.from(doc.querySelectorAll('dt'));
            const capacityDt = dtElements.find(dt =>
                dt.textContent.toLowerCase().includes('počet lůžek') ||
                dt.textContent.toLowerCase().includes('berths') ||
                dt.textContent.toLowerCase().includes('guests') ||
                dt.textContent.toLowerCase().includes('capacity') ||
                dt.textContent.toLowerCase().includes('lůžek')
            );

            if (capacityDt) {
                const ddElement = capacityDt.nextElementSibling;
                if (ddElement && ddElement.tagName.toLowerCase() === 'dd') {
                    const numberMatch = ddElement.textContent.match(/(\d+)/);
                    if (numberMatch) {
                        maxGuests = parseInt(numberMatch[1]);
                    }
                }
            }

            setFormData(prev => ({
                ...prev,
                name: name || prev.name,
                imageUrl: image || prev.imageUrl,
                detailsLink: techSpecsUrl || prev.detailsLink,
                price: price || prev.price,
                charterPack: charterPack || prev.charterPack,
                marina: marina || prev.marina,
                maxGuests: maxGuests || prev.maxGuests,
                link: url
            }));

        } catch (error) {
            console.error("Failed to fetch yacht data", error);
            setFetchError(true);
            setTimeout(() => setFetchError(false), 3000);
        } finally {
            setIsFetchingData(false);
        }
    };

    return {
        isFetchingData,
        fetchError,
        saveYacht,
        deleteYacht,
        selectYacht,
        confirmTrip,
        updateTripSettings,
        fetchAaayachtData
    };
}
