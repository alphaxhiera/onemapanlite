export const WIB_TIMEZONE = 'Asia/Jakarta';

export const toWIBLocalString = (isoString) => {
    if (!isoString) return '';
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleString('sv-SE', { 
        timeZone: WIB_TIMEZONE 
        }).replace(' ', 'T');
    } catch (error) {
        console.error('Error converting to WIB:', error);
        return '';
    }
};

export const fromLocalToWIBISO = (localString) => {
    if (!localString) return null;

    try {
        // `datetime-local` values carry no timezone. Interpret them as WIB wall
        // time explicitly; converting via toLocaleString used the *browser*
        // timezone and shifted the instant for users outside UTC+7.
        const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?)?$/.exec(
            String(localString).trim()
        );

        const iso = match
            ? `${match[1]}T${match[2] || "00:00"}:${match[3] || "00"}+07:00`
            : localString;

        const date = new Date(iso);
        if (isNaN(date.getTime())) return null;

        return date.toISOString();
    } catch (error) {
        console.error('Error converting local to WIB ISO:', error);
        return null;
    }
};

export const formatWIBTime = (isoString) => {
    if (!isoString) return '';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('id-ID', { 
        timeZone: WIB_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
        }) + ' WIB';
    } catch (error) {
        return '';
    }
};