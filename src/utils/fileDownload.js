/**
 * Platform-aware file download.
 * - Native (Capacitor): fetch → base64 → Filesystem.writeFile → Share.share
 *   This opens the native share sheet so the user can save, open, or send the file.
 * - Web: fetch → blob → anchor click (standard browser download)
 */

const getFilename = (url, fallback = 'attachment') => {
    try {
        const parts = new URL(url).pathname.split('/');
        const raw = decodeURIComponent(parts[parts.length - 1]);
        // Strip the timestamp-- prefix: "1719000000000--report.pdf" → "report.pdf"
        const clean = raw.includes('--') ? raw.split('--').slice(1).join('--') : raw;
        const isUUID = /^[0-9a-f-]{36}$/i.test(clean);
        return (clean && !isUUID) ? clean : fallback;
    } catch {
        return fallback;
    }
};

const isNative = () =>
    typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform();

export const downloadOrShareFile = async (url, fallbackName = 'attachment') => {
    const filename = getFilename(url, fallbackName);

    if (isNative()) {
        try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const { Share } = await import('@capacitor/share');

            // 1. Fetch the file
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fetch failed');
            const blob = await response.blob();

            // 2. Convert to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            // 3. Write to app's cache directory
            const result = await Filesystem.writeFile({
                path: filename,
                data: base64,
                directory: Directory.Cache,
            });

            // 4. Open native share sheet — user can save to Files, open with app, etc.
            await Share.share({
                title: filename,
                url: result.uri,
                dialogTitle: 'Open or save file',
            });
        } catch (error) {
            console.error('[fileDownload] Native share failed:', error);
            // Fallback: open in browser
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    } else {
        // Web: standard anchor download
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('[fileDownload] Web download failed:', error);
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }
};
