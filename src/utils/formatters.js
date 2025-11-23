export const formatCurrency = (amount, currency = 'EUR') => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat(currency === 'CZK' ? 'cs-CZ' : 'en-IE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper to clean price strings like "3 459,00 €" -> 3459.00
export const parsePrice = (str) => {
    if (!str) return 0;
    // Remove all non-numeric chars except comma and dot
    let clean = str.replace(/[^\d,.]/g, '');
    // Replace comma with dot for float parsing if comma is decimal separator
    clean = clean.replace(',', '.');
    // If multiple dots exist (thousands separators), keep only the last one
    return parseFloat(clean) || 0;
};
