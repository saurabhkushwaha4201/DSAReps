const AuthService = {
    /**
     * checks if the user is authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        const auth = await this.getAuth();
        if (!auth || !auth.token) {
            console.log('[AuthService] Not authenticated: No token found');
            return false;
        }

        if (Date.now() > auth.expiresAt) {
            console.log('[AuthService] Token expired');
            await this.clearAuth();
            return false;
        }

        return true;
    },

    /**
     * Retrieves the auth object from storage
     * @returns {Promise<{token: string, expiresAt: number} | null>}
     */
    async getAuth() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['auth'], (result) => {
                resolve(result.auth || null);
            });
        });
    },

    /**
     * Sets the auth token with decoded expiry
     * @param {string} token 
     * @returns {Promise<void>}
     */
    async setAuth(token) {
        console.log('[AuthService] Setting new auth token');

        let expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // Default 7 days

        try {
            // Simple decode to avoid large bundle deps if possible, or use jwt-decode
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);
            if (decoded.exp) {
                expiresAt = decoded.exp * 1000;
            }
        } catch (e) {
            console.warn('[AuthService] Failed to decode token exp, using default', e);
        }

        return new Promise((resolve) => {
            chrome.storage.local.set({
                auth: { token, expiresAt }
            }, resolve);
        });
    },

    /**
     * Clears auth data
     * @returns {Promise<void>}
     */
    async clearAuth() {
        console.log('[AuthService] Clearing auth data');
        return new Promise((resolve) => {
            chrome.storage.local.remove('auth', resolve);
        });
    }
};

export default AuthService;
