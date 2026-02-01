// Strategic Planning Workflow Script

var currentStep = 1;
var totalSteps = 7;
var planData = {
    businessName: '',
    userName: '',
    vision: '',
    values: '',
    mission: '',
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
    goals: [],
    targetsInitiatives: '',
    kpis: '',
    strategyMap: '',
    marketing: '',
    sales: '',
    operations: '',
    administration: '',
    mindMap: '',
    reviewFrequency: 'quarterly',
    successCriteria: '',
    notes: ''
};
var userDataBackup = null; // Store user's data when loading sample data

// Authentication and Cloud Storage System
var currentUser = null; // {username, pastebinUrl, createdAt, lastLogin}
var userSession = null; // Session token stored in sessionStorage
var isLoggedIn = false;

// Initialize authentication on page load
function initAuth() {
    // Check if user is logged in (sessionStorage)
    var session = sessionStorage.getItem('userSession');
    if (session) {
        try {
            var sessionData = JSON.parse(session);
            currentUser = sessionData.user;
            isLoggedIn = true;
            updateAuthUI();
            // Auto-load user's data from cloud
            loadUserDataFromCloud();
        } catch (e) {
            console.log('Session invalid');
            logout();
        }
    } else {
        updateAuthUI();
    }
}

// Generate encryption key from password using PBKDF2
async function deriveKeyFromPassword(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Check if Web Crypto API is available
function isWebCryptoAvailable() {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
}

// Encrypt data with password
async function encryptData(data, password) {
    // Check if Web Crypto API is available
    if (!isWebCryptoAvailable()) {
        throw new Error('Web Crypto API not available. Please use a modern browser.');
    }
    
    try {
        const encoder = new TextEncoder();
        const dataString = JSON.stringify(data);
        const dataBuffer = encoder.encode(dataString);
        
        // Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Derive key from password
        const key = await deriveKeyFromPassword(password, salt);
        
        // Encrypt data
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            dataBuffer
        );
        
        // Combine salt, IV, and encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        // Convert to base64 for storage
        return btoa(String.fromCharCode.apply(null, combined));
    } catch (e) {
        console.error('Encryption error:', e);
        const isMobile = isMobileDevice();
        if (isMobile && e.message && e.message.includes('not supported')) {
            throw new Error('Encryption not supported on this device. Please try a different browser or update your device.');
        }
        throw new Error('Failed to encrypt data: ' + (e.message || 'Unknown error'));
    }
}

// Decrypt data with password
async function decryptData(encryptedBase64, password) {
    // Check if Web Crypto API is available
    if (!isWebCryptoAvailable()) {
        throw new Error('Web Crypto API not available. Please use a modern browser.');
    }
    
    try {
        // Convert from base64
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        // Extract salt, IV, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);
        
        // Derive key from password
        const key = await deriveKeyFromPassword(password, salt);
        
        // Decrypt data
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );
        
        // Convert to string and parse JSON
        const decoder = new TextDecoder();
        const decryptedString = decoder.decode(decrypted);
        return JSON.parse(decryptedString);
    } catch (e) {
        console.error('Decryption error:', e);
        const isMobile = isMobileDevice();
        if (e.message && e.message.includes('not supported')) {
            throw new Error('Decryption not supported on this device. Please try a different browser.');
        }
        if (e.message && e.message.includes('operation')) {
            throw new Error('Failed to decrypt data. Wrong password?');
        }
        throw new Error('Failed to decrypt data: ' + (e.message || 'Unknown error'));
    }
}

// Generate unique user ID from username
function generateUserId(username) {
    // Simple hash function (for client-side)
    var hash = 0;
    for (var i = 0; i < username.length; i++) {
        var char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// Fetch with timeout (important for mobile)
function fetchWithTimeout(url, options, timeout) {
    timeout = timeout || 15000; // 15 second default timeout
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Save to pastebin (using multiple services with fallback)
// IMPORTANT: Both mobile and desktop use the SAME cloud storage for cross-device sync
async function saveToPastebin(content, expiresDays) {
    expiresDays = expiresDays || 365; // Default 1 year
    const isMobile = isMobileDevice();
    const timeout = isMobile ? 20000 : 15000; // Longer timeout for mobile
    
    // ALWAYS try cloud storage first (both mobile and desktop)
    // This ensures data can be shared across devices
    
    // Try hastebin.com first (more reliable, simpler API, works on both mobile and desktop)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch('https://hastebin.com/documents', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: content,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            if (result.key) {
                console.log('Saved to cloud (hastebin.com):', `https://hastebin.com/${result.key}`);
                return `https://hastebin.com/${result.key}`;
            } else {
                console.error('hastebin.com response missing key. Full response:', result);
            }
        } else {
            const errorText = await response.text();
            console.error('hastebin.com error response:', response.status, response.statusText, errorText);
        }
    } catch (e) {
        console.error('hastebin.com failed:', e.name, e.message, e.stack);
        if (e.name === 'AbortError') {
            console.error('Request timed out after', timeout, 'ms');
        } else if (e.message && e.message.includes('CORS')) {
            console.error('CORS error - hastebin.com may not allow cross-origin requests');
        }
    }
    
    // Fallback: Try dpaste.com (with timeout) - same for both mobile and desktop
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch('https://dpaste.com/api/v2/', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `content=${encodeURIComponent(content)}&format=json&lexer=text&expires_days=${expiresDays}`,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            if (result.url) {
                console.log('Saved to cloud (dpaste.com):', result.url);
                return result.url;
            }
            if (result) {
                console.error('dpaste.com response missing url. Full response:', result);
            } else {
                console.error('dpaste.com returned empty result');
            }
        } else {
            const errorText = await response.text();
            console.error('dpaste.com error response:', response.status, response.statusText, errorText);
        }
    } catch (e) {
        console.error('dpaste.com failed:', e.name, e.message, e.stack);
        if (e.name === 'AbortError') {
            console.error('Request timed out after', timeout, 'ms');
        } else if (e.message && e.message.includes('CORS')) {
            console.error('CORS error - dpaste.com may not allow cross-origin requests');
        }
    }
    
    // Additional fallback: Try paste.gg (another pastebin service)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch('https://api.paste.gg/v1/pastes', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Strategic Plan',
                description: 'Strategic planning data',
                visibility: 'unlisted',
                files: [{
                    name: 'plan.json',
                    content: {
                        format: 'text',
                        value: content
                    }
                }]
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            if (result.result && result.result.id) {
                const pasteUrl = `https://paste.gg/${result.result.id}`;
                console.log('Saved to cloud (paste.gg):', pasteUrl);
                return pasteUrl;
            }
        } else {
            const errorText = await response.text();
            console.error('paste.gg error response:', response.status, response.statusText, errorText);
        }
    } catch (e) {
        console.error('paste.gg failed:', e.name, e.message);
    }
    
    // LAST RESORT: Use localStorage (device-specific, won't sync across devices)
    // Only use this if ALL cloud services fail
    // Warn user that this won't work across devices
    const shareKey = 'sp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    try {
        if (isStorageAvailable('localStorage')) {
            localStorage.setItem('cloud_' + shareKey, content);
            console.warn('WARNING: Using localStorage fallback. Data will NOT sync across devices!');
            console.log('localStorage key:', shareKey);
            // Show warning to user (only if this is actually being used, not just as backup)
            // Don't show alert immediately - let the calling function decide if it should warn
            // The alert will be shown by the saveUserDataToCloud function if needed
            // Return localStorage URL but this is device-specific
            return 'localstorage://' + shareKey;
        }
    } catch (e) {
        console.error('localStorage fallback failed:', e);
    }
    
    throw new Error('Failed to save to cloud storage. Please check your internet connection and try again.');
}

// Load from pastebin URL
async function loadFromPastebin(url) {
    const isMobile = isMobileDevice();
    const timeout = isMobile ? 20000 : 15000;
    
    try {
        // Check if it's a localStorage URL
        if (url.startsWith('localstorage://')) {
            const key = url.replace('localstorage://', '');
            const content = localStorage.getItem('cloud_' + key);
            if (content) {
                return content;
            }
            throw new Error('Data not found in local storage');
        }
        
        // Try to extract paste ID from URL
        let pasteId = url.split('/').filter(part => part).pop();
        
        // Remove any query parameters or fragments
        pasteId = pasteId.split('?')[0].split('#')[0];
        
        // Try hastebin.com first (more reliable)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`https://hastebin.com/raw/${pasteId}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            console.log('hastebin.com load failed:', e.message);
        }
        
        // Try dpaste.com
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`https://dpaste.com/${pasteId}/raw/`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            console.log('dpaste.com load failed:', e.message);
        }
        
        throw new Error('Failed to load from cloud storage');
    } catch (e) {
        console.error('Pastebin load error:', e);
        if (isMobile && e.message && e.message.includes('timeout')) {
            throw new Error('Connection timeout on mobile. Please check your internet connection and try again.');
        }
        throw new Error('Failed to load from cloud storage. The data may have expired or the URL is invalid.');
    }
}

// Store user account mapping (in localStorage)
function saveUserAccount(username, pastebinUrl) {
    var accounts = getUserAccounts();
    accounts[username] = {
        username: username,
        pastebinUrl: pastebinUrl,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    localStorage.setItem('userAccounts', JSON.stringify(accounts));
}

// Get user account by username
function getUserAccount(username) {
    var accounts = getUserAccounts();
    return accounts[username] || null;
}

// Get all user accounts
function getUserAccounts() {
    try {
        var accounts = localStorage.getItem('userAccounts');
        return accounts ? JSON.parse(accounts) : {};
    } catch (e) {
        return {};
    }
}

// Sign up new user
async function signUp(username, password) {
    if (!username || !password) {
        throw new Error('Username and password are required');
    }
    
    if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
    }
    
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    
    // Check if username already exists
    if (getUserAccount(username)) {
        throw new Error('Username already exists');
    }
    
    // Encrypt empty plan data
    var emptyPlan = {
        businessName: '',
        userName: '',
        vision: '',
        values: '',
        mission: '',
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: '',
        goals: [],
        targetsInitiatives: '',
        kpis: '',
        strategyMap: '',
        marketing: '',
        sales: '',
        operations: '',
        administration: '',
        reviewFrequency: 'quarterly',
        successCriteria: '',
        notes: ''
    };
    
    var encryptedData;
    try {
        encryptedData = await encryptData(emptyPlan, password);
    } catch (e) {
        console.error('Encryption error:', e);
        throw new Error('Failed to encrypt data: ' + e.message);
    }
    
    // Save to pastebin
    var pastebinUrl;
    try {
        pastebinUrl = await saveToPastebin(encryptedData);
        console.log('Saved to cloud storage:', pastebinUrl);
    } catch (e) {
        console.error('Pastebin save error:', e);
        // Provide more helpful error message
        if (e.message.includes('network') || e.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection and try again.');
        } else if (e.message.includes('CORS')) {
            throw new Error('Cloud storage service unavailable. Please try again later or check your browser settings.');
        } else {
            throw new Error('Failed to save to cloud storage: ' + e.message);
        }
    }
    
    // Store user account
    saveUserAccount(username, pastebinUrl);
    
    // Log in the user
    await login(username, password);
    
    return true;
}

// Login user
async function login(username, password) {
    if (!username || !password) {
        throw new Error('Username and password are required');
    }
    
    // Get user account
    var account = getUserAccount(username);
    if (!account) {
        throw new Error('Username not found');
    }
    
    var encryptedData;
    
    // Check if account is using localStorage (device-specific, needs migration)
    if (account.pastebinUrl && account.pastebinUrl.startsWith('localstorage://')) {
        // Load from localStorage
        const key = account.pastebinUrl.replace('localstorage://', '');
        encryptedData = localStorage.getItem('cloud_' + key);
        
        if (!encryptedData) {
            throw new Error('Data not found. It may have been cleared from this device.');
        }
        
        // Try to migrate to cloud storage automatically
        try {
            console.log('Migrating localStorage account to cloud storage...');
            const newCloudUrl = await saveToPastebin(encryptedData);
            
            // Only update if we got a real cloud URL (not localStorage)
            if (!newCloudUrl.startsWith('localstorage://')) {
                account.pastebinUrl = newCloudUrl;
                saveUserAccount(username, newCloudUrl);
                console.log('Successfully migrated to cloud storage:', newCloudUrl);
                
                // Show success message
                setTimeout(function() {
                    alert('✅ Your account has been migrated to cloud storage! Your data will now sync across all devices.');
                }, 500);
            }
        } catch (e) {
            console.warn('Could not migrate to cloud storage:', e);
            // Continue with localStorage for now
        }
    } else {
        // Load encrypted data from cloud storage (hastebin/dpaste)
        encryptedData = await loadFromPastebin(account.pastebinUrl);
    }
    
    // Decrypt data (this will throw if password is wrong)
    var decryptedData = await decryptData(encryptedData, password);
    
    // Update last login
    account.lastLogin = new Date().toISOString();
    saveUserAccount(username, account.pastebinUrl);
    
    // Set current user and session
    currentUser = account;
    isLoggedIn = true;
    
    // Create session
    var session = {
        user: account,
        loginTime: new Date().toISOString()
    };
    sessionStorage.setItem('userSession', JSON.stringify(session));
    
    // Load data into app
    planData = decryptedData;
    populateForm();
    updateStepCompletion();
    updateProgress();
    setupCharacterCounts();
    
    updateAuthUI();
    
    return true;
}

// Logout user
function logout() {
    currentUser = null;
    isLoggedIn = false;
    sessionStorage.removeItem('userSession');
    clearForm();
    updateAuthUI();
}

// Save user data to cloud
async function saveUserDataToCloud(password) {
    if (!isLoggedIn || !currentUser) {
        throw new Error('Not logged in');
    }
    
    // Collect current form data
    saveData(); // This updates planData
    
    // Encrypt data
    var encryptedData = await encryptData(planData, password);
    
    // Save to pastebin (same cloud storage for both mobile and desktop)
    var pastebinUrl = await saveToPastebin(encryptedData);
    
    // Check if localStorage was used (device-specific, won't sync)
    if (pastebinUrl.startsWith('localstorage://')) {
        // Warn user that this won't sync across devices
        console.warn('Data saved to localStorage - will not sync across devices');
        // Show warning alert
        alert('⚠️ WARNING: Could not save to cloud storage. Data saved locally only and will NOT sync across devices.\n\nPlease check:\n- Your internet connection\n- Browser console for error details (F12)\n- Try again in a few moments');
    } else {
        // Successfully saved to cloud
        console.log('Successfully saved to cloud storage:', pastebinUrl);
    }
    
    // Update user account with new URL
    currentUser.pastebinUrl = pastebinUrl;
    saveUserAccount(currentUser.username, pastebinUrl);
    
    // Update session
    var session = JSON.parse(sessionStorage.getItem('userSession'));
    session.user = currentUser;
    sessionStorage.setItem('userSession', JSON.stringify(session));
    
    showSaveIndicator();
    return pastebinUrl;
}

// Load user data from cloud
async function loadUserDataFromCloud() {
    if (!isLoggedIn || !currentUser) {
        return;
    }
    
    // Note: We need the password to decrypt, so this is called after login
    // This function is mainly for auto-loading after page refresh
    // The actual loading happens in the login function
}

// Update authentication UI
function updateAuthUI() {
    var authButton = document.getElementById('authButton');
    var userInfo = document.getElementById('userInfo');
    var saveToCloudBtn = document.getElementById('saveToCloudBtn');
    
    if (isLoggedIn && currentUser) {
        // Show logged in state
        if (authButton) {
            authButton.textContent = 'Logout';
            authButton.onclick = function() {
                if (confirm('Are you sure you want to logout? Your current work will be saved.')) {
                    logout();
                }
            };
        }
        if (userInfo) {
            userInfo.textContent = 'Logged in as: ' + currentUser.username;
            userInfo.style.display = 'block';
        }
        if (saveToCloudBtn) {
            saveToCloudBtn.style.display = 'inline-block';
        }
    } else {
        // Show login/signup state
        if (authButton) {
            authButton.textContent = 'Login / Sign Up';
            authButton.onclick = showAuthModal;
        }
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        if (saveToCloudBtn) {
            saveToCloudBtn.style.display = 'none';
        }
    }
}

// Show authentication modal (login/signup)
function showAuthModal() {
    var modal = document.createElement('div');
    modal.id = 'authModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    var modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 30px; border-radius: 8px; max-width: 400px; width: 90%; max-height: 90%; overflow-y: auto;';
    
    var title = document.createElement('h2');
    title.style.cssText = 'margin-top: 0; color: #0f4c75;';
    title.textContent = 'Login / Sign Up';
    modalContent.appendChild(title);
    
    var description = document.createElement('p');
    description.style.cssText = 'color: #666; margin-bottom: 20px;';
    description.textContent = 'Create an account to save your strategic plan to the cloud and access it from any device.';
    modalContent.appendChild(description);
    
    // Check Web Crypto API availability and show warning if needed
    if (!isWebCryptoAvailable()) {
        var warningMsg = document.createElement('div');
        warningMsg.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px;';
        warningMsg.textContent = '⚠️ Encryption not available on this browser. Please use a modern browser (Chrome, Firefox, Safari, Edge) for secure cloud storage.';
        modalContent.appendChild(warningMsg);
    }
    
    // Username input
    var usernameLabel = document.createElement('label');
    usernameLabel.textContent = 'Username';
    usernameLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
    modalContent.appendChild(usernameLabel);
    
    var usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'authUsername';
    usernameInput.placeholder = 'Enter username (min 3 characters)';
    usernameInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;';
    modalContent.appendChild(usernameInput);
    
    // Password input
    var passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Password';
    passwordLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
    modalContent.appendChild(passwordLabel);
    
    var passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'authPassword';
    passwordInput.placeholder = 'Enter password (min 6 characters)';
    passwordInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;';
    modalContent.appendChild(passwordInput);
    
    // Error message
    var errorMsg = document.createElement('div');
    errorMsg.id = 'authError';
    errorMsg.style.cssText = 'color: #dc3545; margin-bottom: 15px; display: none;';
    modalContent.appendChild(errorMsg);
    
    // Success message
    var successMsg = document.createElement('div');
    successMsg.id = 'authSuccess';
    successMsg.style.cssText = 'color: #28a745; margin-bottom: 15px; display: none;';
    modalContent.appendChild(successMsg);
    
    // Buttons container
    var buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
    
    // Login button
    var loginBtn = document.createElement('button');
    loginBtn.textContent = 'Login';
    loginBtn.style.cssText = 'flex: 1; padding: 12px; background: #0f4c75; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    loginBtn.onclick = async function() {
        var username = usernameInput.value.trim();
        var password = passwordInput.value;
        
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
        
        if (!username || !password) {
            errorMsg.textContent = 'Please enter username and password';
            errorMsg.style.display = 'block';
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        try {
            // Check Web Crypto before attempting login
            if (!isWebCryptoAvailable()) {
                throw new Error('Web Crypto API not available. Please use a modern browser.');
            }
            
            await login(username, password);
            successMsg.textContent = 'Login successful!';
            successMsg.style.display = 'block';
            setTimeout(function() {
                modal.remove();
            }, 1000);
        } catch (e) {
            errorMsg.textContent = e.message || 'Login failed';
            errorMsg.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            
            // Show mobile-specific help
            if (isMobileDevice() && e.message && e.message.includes('Crypto')) {
                errorMsg.innerHTML = e.message + '<br><small>Try updating your browser or using Chrome/Safari.</small>';
            }
        }
    };
    buttonContainer.appendChild(loginBtn);
    
    // Sign up button
    var signupBtn = document.createElement('button');
    signupBtn.textContent = 'Sign Up';
    signupBtn.style.cssText = 'flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    signupBtn.onclick = async function() {
        var username = usernameInput.value.trim();
        var password = passwordInput.value;
        
        errorMsg.style.display = 'none';
        successMsg.style.display = 'none';
        
        if (!username || !password) {
            errorMsg.textContent = 'Please enter username and password';
            errorMsg.style.display = 'block';
            return;
        }
        
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';
        
        try {
            // Check Web Crypto before attempting signup
            if (!isWebCryptoAvailable()) {
                throw new Error('Web Crypto API not available. Please use a modern browser.');
            }
            
            await signUp(username, password);
            successMsg.textContent = 'Account created! Logging you in...';
            successMsg.style.display = 'block';
            setTimeout(function() {
                modal.remove();
            }, 1500);
        } catch (e) {
            errorMsg.textContent = e.message || 'Sign up failed';
            errorMsg.style.display = 'block';
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
            
            // Show mobile-specific help
            if (isMobileDevice() && e.message && e.message.includes('Crypto')) {
                errorMsg.innerHTML = e.message + '<br><small>Try updating your browser or using Chrome/Safari.</small>';
            }
        }
    };
    buttonContainer.appendChild(signupBtn);
    
    modalContent.appendChild(buttonContainer);
    
    // Cancel button
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'width: 100%; padding: 10px; margin-top: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
    cancelBtn.onclick = function() {
        modal.remove();
    };
    modalContent.appendChild(cancelBtn);
    
    // Info text
    var infoText = document.createElement('p');
    infoText.style.cssText = 'font-size: 12px; color: #999; margin-top: 15px; margin-bottom: 0;';
    infoText.textContent = 'Your data is encrypted and stored securely in the cloud. You can access it from any device.';
    modalContent.appendChild(infoText);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Focus username input
    setTimeout(function() {
        usernameInput.focus();
    }, 100);
}

// Save to cloud button handler
async function saveToCloud() {
    if (!isLoggedIn || !currentUser) {
        showAuthModal();
        return;
    }
    
    // Show password modal
    var modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    var modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 30px; border-radius: 8px; max-width: 400px; width: 90%;';
    
    var title = document.createElement('h3');
    title.style.cssText = 'margin-top: 0; color: #0f4c75;';
    title.textContent = 'Save to Cloud';
    modalContent.appendChild(title);
    
    var description = document.createElement('p');
    description.style.cssText = 'color: #666; margin-bottom: 20px;';
    description.textContent = 'Enter your password to encrypt and save your plan to the cloud.';
    modalContent.appendChild(description);
    
    var passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Password';
    passwordLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
    modalContent.appendChild(passwordLabel);
    
    var passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'cloudSavePassword';
    passwordInput.placeholder = 'Enter your password';
    passwordInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;';
    modalContent.appendChild(passwordInput);
    
    var errorMsg = document.createElement('div');
    errorMsg.id = 'cloudSaveError';
    errorMsg.style.cssText = 'color: #dc3545; margin-bottom: 15px; display: none;';
    modalContent.appendChild(errorMsg);
    
    var buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
    
    var saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    saveBtn.onclick = async function() {
        var password = passwordInput.value;
        if (!password) {
            errorMsg.textContent = 'Please enter your password';
            errorMsg.style.display = 'block';
            return;
        }
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        errorMsg.style.display = 'none';
        
        try {
            var pastebinUrl = await saveUserDataToCloud(password);
            modal.remove();
            alert('Your plan has been saved to the cloud!\n\nYou can access it from any device by logging in with your username and password.');
        } catch (e) {
            errorMsg.textContent = e.message || 'Error saving to cloud';
            errorMsg.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
        }
    };
    buttonContainer.appendChild(saveBtn);
    
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    cancelBtn.onclick = function() {
        modal.remove();
    };
    buttonContainer.appendChild(cancelBtn);
    
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Enter key to save
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
    
    // Focus password input
    setTimeout(function() {
        passwordInput.focus();
    }, 100);
}

// Clear all form fields
function clearForm() {
    // Reset planData to initial state
    planData = {
        businessName: '',
        userName: '',
        vision: '',
        values: '',
        mission: '',
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: '',
        goals: [],
        targetsInitiatives: '',
        kpis: '',
        strategyMap: '',
        marketing: '',
        sales: '',
        operations: '',
        administration: '',
        mindMap: '',
        reviewFrequency: 'quarterly',
        successCriteria: '',
        notes: ''
    };
    
    // Clear all form fields
    populateForm();
    
    // Clear goals container
    var container = document.getElementById('goalsContainer');
    if (container) {
        container.innerHTML = '<div class="goal-item"><div class="form-group"><label>Goal</label><p class="field-help">Set goals for different time horizons: 6 Month, 1 Year, 10 Year, etc. What do you want to achieve in each timeframe?</p><input type="text" class="goal-title" placeholder="Enter a strategic goal..."></div><div class="form-group"><label>Time Horizon</label><select class="goal-timeline"><option value="">Select timeframe...</option><option value="6-month">6 Months</option><option value="1-year">1 Year</option><option value="3-year">3 Years</option><option value="5-year">5 Years</option><option value="10-year">10 Years</option></select></div><div class="form-group"><label>Strategic Intent</label><p class="field-help">How will you get there? Refer to your SWOT analysis when formulating this.</p><textarea class="goal-strategic-intent" placeholder="Describe how you will achieve this goal..."></textarea></div><div class="form-group"><label>Drivers (Elephant Projects)</label><p class="field-help">What will you focus on? These are your major initiatives or "elephant projects" that drive progress.</p><textarea class="goal-drivers" placeholder="List the key focus areas or major projects..."></textarea></div><div class="form-group"><label>Enablers</label><p class="field-help">What frameworks, resources, and skills will you use? What capabilities do you need to develop?</p><textarea class="goal-enablers" placeholder="List frameworks, resources, and skills needed..."></textarea></div></div>';
        setupEventListeners();
    }
    
    // Update UI
    setupCharacterCounts();
    updateStepCompletion();
}

// Initialize on page load
function init() {
    // Initialize authentication first
    initAuth();
    
    // Don't load saved data on initial load - start with blank form
    // loadSavedData(); // Removed - app starts blank
    updateProgress();
    setupEventListeners();
    setupCharacterCounts();
    setupKeyboardNavigation();
    updateStepCompletion();
    
    // Save data before page unload (important for iPhone Safari)
    window.addEventListener('beforeunload', function() {
        saveData();
    });
    
    // Also save on page visibility change (when user switches tabs/apps on mobile)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            saveData();
        }
    });
}

// Setup event listeners for auto-save
function setupEventListeners() {
    var inputs = document.querySelectorAll('input, textarea, select');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', function() {
            saveData();
            updateCharacterCount(this);
            updateStepCompletion();
        });
        inputs[i].addEventListener('change', function() {
            saveData();
            updateStepCompletion();
        });
    }
}

// Setup character counts
function setupCharacterCounts() {
    var elements = document.querySelectorAll('[data-char-count]');
    for (var i = 0; i < elements.length; i++) {
        updateCharacterCount(elements[i]);
    }
}

// Update character count for a textarea or input
function updateCharacterCount(element) {
    var countEl = null;
    if (element.id) {
        countEl = document.getElementById(element.id + '-count');
    } else {
        // Handle class-based elements
        var className = element.className.split(' ')[0];
        if (className === 'proponent-marketing') {
            countEl = document.getElementById('marketing-count');
        } else if (className === 'proponent-sales') {
            countEl = document.getElementById('sales-count');
        } else if (className === 'proponent-operations') {
            countEl = document.getElementById('operations-count');
        } else if (className === 'proponent-administration') {
            countEl = document.getElementById('administration-count');
        }
    }
    if (countEl) {
        var count = element.value.length;
        countEl.textContent = count + ' characters';
    }
}

// Setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Only navigate if not typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (e.key === 'ArrowRight' && currentStep < totalSteps) {
            nextStep();
        } else if (e.key === 'ArrowLeft' && currentStep > 1) {
            prevStep();
        }
    });
}

// Check if storage is available (handles iPhone Safari private browsing)
function isStorageAvailable(type) {
    try {
        var storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
}

// Save data to localStorage with iPhone Safari compatibility
function saveData() {
    // Save step 1 data (Purpose)
    planData.businessName = document.getElementById('business-name') ? document.getElementById('business-name').value : '';
    planData.userName = document.getElementById('user-name') ? document.getElementById('user-name').value : '';
    planData.vision = document.getElementById('vision') ? document.getElementById('vision').value : '';
    planData.values = document.getElementById('values') ? document.getElementById('values').value : '';
    planData.mission = document.getElementById('mission') ? document.getElementById('mission').value : '';
    
    // Save step 2 data is educational only, no data to save
    
    // Save step 3 data (Mind Map - Proponents)
    var marketingEl = document.querySelector('.proponent-marketing');
    planData.marketing = marketingEl ? marketingEl.value : '';
    var salesEl = document.querySelector('.proponent-sales');
    planData.sales = salesEl ? salesEl.value : '';
    var operationsEl = document.querySelector('.proponent-operations');
    planData.operations = operationsEl ? operationsEl.value : '';
    var administrationEl = document.querySelector('.proponent-administration');
    planData.administration = administrationEl ? administrationEl.value : '';
    
    // Save step 4 data (SWOT)
    planData.strengths = document.getElementById('strengths') ? document.getElementById('strengths').value : '';
    planData.weaknesses = document.getElementById('weaknesses') ? document.getElementById('weaknesses').value : '';
    planData.opportunities = document.getElementById('opportunities') ? document.getElementById('opportunities').value : '';
    planData.threats = document.getElementById('threats') ? document.getElementById('threats').value : '';
    
    // Save step 5 data (Strategy - Goals)
    saveGoals();
    
    // Save step 6 data (Execution)
    planData.targetsInitiatives = document.getElementById('targets-initiatives') ? document.getElementById('targets-initiatives').value : '';
    planData.kpis = document.getElementById('kpis') ? document.getElementById('kpis').value : '';
    planData.strategyMap = document.getElementById('strategy-map') ? document.getElementById('strategy-map').value : '';
    
    // Save step 7 data (Review)
    planData.reviewFrequency = document.getElementById('review-frequency') ? document.getElementById('review-frequency').value : 'quarterly';
    planData.successCriteria = document.getElementById('success-criteria') ? document.getElementById('success-criteria').value : '';
    planData.notes = document.getElementById('notes') ? document.getElementById('notes').value : '';
    
    // Try localStorage first, fallback to sessionStorage for iPhone Safari compatibility
    var dataString = JSON.stringify(planData);
    var saved = false;
    
    if (isStorageAvailable('localStorage')) {
    try {
            localStorage.setItem('strategicPlan', dataString);
            saved = true;
    } catch (e) {
            console.log('localStorage setItem failed, trying sessionStorage');
        }
    }
    
    // Fallback to sessionStorage if localStorage fails (iPhone Safari private mode)
    if (!saved && isStorageAvailable('sessionStorage')) {
        try {
            sessionStorage.setItem('strategicPlan', dataString);
            saved = true;
        } catch (e) {
            console.log('sessionStorage also not available');
        }
    }
    
    if (saved) {
        showSaveIndicator();
    }
}

// Show save indicator
function showSaveIndicator() {
    var indicator = document.getElementById('saveIndicator');
    if (indicator) {
        indicator.classList.add('show');
        setTimeout(function() {
            indicator.classList.remove('show');
        }, 2000);
    }
}

// Load saved data from localStorage with iPhone Safari compatibility
function loadSavedData() {
    var saved = null;
    
    // Try localStorage first
    if (isStorageAvailable('localStorage')) {
        try {
            saved = localStorage.getItem('strategicPlan');
        } catch (e) {
            console.log('localStorage getItem failed, trying sessionStorage');
        }
    }
    
    // Fallback to sessionStorage if localStorage fails (iPhone Safari private mode)
    if (!saved && isStorageAvailable('sessionStorage')) {
        try {
            saved = sessionStorage.getItem('strategicPlan');
        } catch (e) {
            console.log('sessionStorage also not available');
        }
    }
    
        if (saved) {
        try {
            planData = JSON.parse(saved);
            populateForm();
    } catch (e) {
            console.log('Could not parse saved data');
        }
    }
}

// Populate form with saved data
function populateForm() {
    if (document.getElementById('business-name')) document.getElementById('business-name').value = planData.businessName || '';
    if (document.getElementById('user-name')) document.getElementById('user-name').value = planData.userName || '';
    if (document.getElementById('vision')) document.getElementById('vision').value = planData.vision || '';
    if (document.getElementById('values')) document.getElementById('values').value = planData.values || '';
    if (document.getElementById('mission')) document.getElementById('mission').value = planData.mission || '';
    if (document.getElementById('strengths')) document.getElementById('strengths').value = planData.strengths || '';
    if (document.getElementById('weaknesses')) document.getElementById('weaknesses').value = planData.weaknesses || '';
    if (document.getElementById('opportunities')) document.getElementById('opportunities').value = planData.opportunities || '';
    if (document.getElementById('threats')) document.getElementById('threats').value = planData.threats || '';
    if (document.getElementById('targets-initiatives')) document.getElementById('targets-initiatives').value = planData.targetsInitiatives || '';
    if (document.getElementById('kpis')) document.getElementById('kpis').value = planData.kpis || '';
    if (document.getElementById('strategy-map')) document.getElementById('strategy-map').value = planData.strategyMap || '';
    if (document.getElementById('review-frequency')) document.getElementById('review-frequency').value = planData.reviewFrequency || 'quarterly';
    if (document.getElementById('success-criteria')) document.getElementById('success-criteria').value = planData.successCriteria || '';
    if (document.getElementById('notes')) document.getElementById('notes').value = planData.notes || '';
    
    var marketingEl = document.querySelector('.proponent-marketing');
    if (marketingEl) marketingEl.value = planData.marketing || '';
    var salesEl = document.querySelector('.proponent-sales');
    if (salesEl) salesEl.value = planData.sales || '';
    var operationsEl = document.querySelector('.proponent-operations');
    if (operationsEl) operationsEl.value = planData.operations || '';
    var administrationEl = document.querySelector('.proponent-administration');
    if (administrationEl) administrationEl.value = planData.administration || '';
    
    loadGoals();
    setupCharacterCounts();
    updateStepCompletion();
}

// Navigate to next step
function nextStep() {
    if (currentStep < totalSteps) {
        hideStep(currentStep);
        currentStep++;
        showStep(currentStep);
        updateProgress();
        saveData();
        // Scroll to top of step
        window.scrollTo(0, 0);
    }
}

// Navigate to previous step
function prevStep() {
    if (currentStep > 1) {
        hideStep(currentStep);
        currentStep--;
        showStep(currentStep);
        updateProgress();
        saveData();
        // Scroll to top of step
        window.scrollTo(0, 0);
    }
}

// Show step
function showStep(step) {
    var stepElement = document.getElementById('step' + step);
    if (stepElement) {
        stepElement.classList.add('active');
    }
}

// Hide step
function hideStep(step) {
    var stepElement = document.getElementById('step' + step);
    if (stepElement) {
        stepElement.classList.remove('active');
    }
}

// Update progress bar
function updateProgress() {
    var progressFill = document.getElementById('progressFill');
    var progressText = document.getElementById('progressText');
    var percentage = (currentStep / totalSteps) * 100;
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = 'Step ' + currentStep + ' of ' + totalSteps;
    }
    
    // Update step navigation dots
    updateStepDots();
}

// Update step navigation dots
function updateStepDots() {
    var dots = document.querySelectorAll('.step-dot');
    for (var i = 0; i < dots.length; i++) {
        var stepNum = parseInt(dots[i].getAttribute('data-step'));
        dots[i].classList.remove('active', 'complete');
        
        if (stepNum === currentStep) {
            dots[i].classList.add('active');
        } else if (stepNum < currentStep || isStepComplete(stepNum)) {
            dots[i].classList.add('complete');
        }
    }
}

// Check if a step is complete
function isStepComplete(step) {
    switch(step) {
        case 1:
            var businessName = document.getElementById('business-name');
            var userName = document.getElementById('user-name');
            var vision = document.getElementById('vision');
            var values = document.getElementById('values');
            var mission = document.getElementById('mission');
            return (businessName && businessName.value.trim()) || (userName && userName.value.trim()) || 
                   (vision && vision.value.trim()) || (values && values.value.trim()) || (mission && mission.value.trim());
        case 2:
            return true; // Educational step, always complete
        case 3:
            var marketing = document.querySelector('.proponent-marketing');
            var sales = document.querySelector('.proponent-sales');
            var operations = document.querySelector('.proponent-operations');
            var administration = document.querySelector('.proponent-administration');
            return (marketing && marketing.value.trim()) || (sales && sales.value.trim()) || 
                   (operations && operations.value.trim()) || (administration && administration.value.trim());
        case 4:
            var strengths = document.getElementById('strengths');
            var weaknesses = document.getElementById('weaknesses');
            var opportunities = document.getElementById('opportunities');
            var threats = document.getElementById('threats');
            return (strengths && strengths.value.trim()) || (weaknesses && weaknesses.value.trim()) || 
                   (opportunities && opportunities.value.trim()) || (threats && threats.value.trim());
        case 5:
            return planData.goals && planData.goals.length > 0;
        case 6:
            var targets = document.getElementById('targets-initiatives');
            var kpis = document.getElementById('kpis');
            var strategyMap = document.getElementById('strategy-map');
            return (targets && targets.value.trim()) || (kpis && kpis.value.trim()) || (strategyMap && strategyMap.value.trim());
        case 7:
            var successCriteria = document.getElementById('success-criteria');
            return successCriteria && successCriteria.value.trim();
        default:
            return false;
    }
}

// Update step completion indicators
function updateStepCompletion() {
    for (var i = 1; i <= totalSteps; i++) {
        var indicator = document.getElementById('step' + i + 'Complete');
        if (indicator) {
            if (isStepComplete(i)) {
                indicator.classList.add('show');
            } else {
                indicator.classList.remove('show');
            }
        }
    }
    updateStepDots();
}

// Go to specific step
function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
        hideStep(currentStep);
        currentStep = step;
        showStep(currentStep);
        updateProgress();
        window.scrollTo(0, 0);
    }
}

// Toggle education section
function toggleEducation(button) {
    var educationBox = button.closest('.education-box');
    if (educationBox) {
        educationBox.classList.toggle('collapsed');
        button.textContent = educationBox.classList.contains('collapsed') ? '+' : '−';
    }
}

// Toggle help text
function toggleHelp(button) {
    var label = button.closest('label');
    if (label) {
        var helpText = label.nextElementSibling;
        if (helpText && helpText.classList.contains('field-help')) {
            helpText.classList.toggle('hidden');
        }
    }
}

// Show proponent popup
function showProponentPopup(proponent) {
    var popup = document.getElementById('proponentPopup');
    var title = document.getElementById('popupTitle');
    var content = document.getElementById('popupContent');
    
    if (!popup || !title || !content) return;
    
    var proponentData = {
        marketing: {
            title: 'Marketing',
            principle: 'DO NOT OVER COMPLICATE. OUTSOURCE IF YOU NEED TO',
            description: 'Get and keep attention. Get brand in front of customers 8 times. Lead generation. Convert to sales team. Marketing includes things like branding, advertising, market research, email/social media outreach.'
        },
        sales: {
            title: 'Sales',
            principle: 'DO NOT COMPETE ON PRICE. COMPETE ON QUALITY!',
            description: 'Qualify customers before interacting. Follow up. Outreach. Build relationships. Do not try to get the sale on first call. The main purpose of Sales is to convert leads into customers. Bring money in.'
        },
        operations: {
            title: 'Operations',
            principle: 'TAKE TIME TO MAKE SURE OPERATIONS IS EFFICIENT',
            description: 'Responsible for delivering product or service to customers. Operations should be ready to react to changes in the market. Don\'t be afraid to outsource parts of operations.'
        },
        administration: {
            title: 'Administration',
            principle: 'If YOU WERE ABSENT COULD THE BUSINESS RUN ITSELF? COULD IT SCALE WITHOUT YOU?',
            description: 'Administration is anything in back end of business that isn\'t Marketing, Sales, or Operations. Examples are Accounting, I.T., H.R., Payroll, etc. Your job is to sit at the top of Administration strategizing and deciding where the business needs to go. You must lay out a strategic plan and communicate it to the team, so they can carry it out. You must create a system that will operate and even grow without you present. Never micromanage, communicate the plan, and trust your team to carry it out.'
        }
    };
    
    var data = proponentData[proponent];
    if (data) {
        title.textContent = data.title;
        content.innerHTML = '<p class="proponent-note"><strong>Principle:</strong> ' + escapeHtml(data.principle) + '</p>' +
                           '<p>' + escapeHtml(data.description) + '</p>';
        popup.classList.add('show');
    }
}

// Close proponent popup
function closeProponentPopup(event) {
    if (event) {
        event.stopPropagation();
    }
    var popup = document.getElementById('proponentPopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

// Add goal
function addGoal() {
    var container = document.getElementById('goalsContainer');
    if (!container) return;
    
    var goalDiv = document.createElement('div');
    goalDiv.className = 'goal-item';
    goalDiv.innerHTML = '<div class="form-group"><label>Goal</label><p class="field-help">Set goals for different time horizons: 6 Month, 1 Year, 10 Year, etc. What do you want to achieve in each timeframe?</p><input type="text" class="goal-title" placeholder="Enter a strategic goal..."></div>' +
        '<div class="form-group"><label>Time Horizon</label><select class="goal-timeline"><option value="">Select timeframe...</option><option value="6-month">6 Months</option><option value="1-year">1 Year</option><option value="3-year">3 Years</option><option value="5-year">5 Years</option><option value="10-year">10 Years</option></select></div>' +
        '<div class="form-group"><label>Strategic Intent</label><p class="field-help">How will you get there? Refer to your SWOT analysis when formulating this.</p><textarea class="goal-strategic-intent" placeholder="Describe how you will achieve this goal..."></textarea></div>' +
        '<div class="form-group"><label>Drivers (Elephant Projects)</label><p class="field-help">What will you focus on? These are your major initiatives or "elephant projects" that drive progress.</p><textarea class="goal-drivers" placeholder="List the key focus areas or major projects..."></textarea></div>' +
        '<div class="form-group"><label>Enablers</label><p class="field-help">What frameworks, resources, and skills will you use? What capabilities do you need to develop?</p><textarea class="goal-enablers" placeholder="List frameworks, resources, and skills needed..."></textarea></div>' +
        '<button class="btn-remove" onclick="removeGoal(this)" style="background: #dc3545; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Remove</button>';
    
    container.appendChild(goalDiv);
    setupEventListeners();
    updateStepCompletion();
}

// Remove goal
function removeGoal(button) {
    var goalItem = button.parentElement;
    goalItem.parentElement.removeChild(goalItem);
    saveGoals();
}

// Save goals
function saveGoals() {
    planData.goals = [];
    var goalItems = document.querySelectorAll('.goal-item');
    for (var i = 0; i < goalItems.length; i++) {
        var title = goalItems[i].querySelector('.goal-title');
        var timeline = goalItems[i].querySelector('.goal-timeline');
        var strategicIntent = goalItems[i].querySelector('.goal-strategic-intent');
        var drivers = goalItems[i].querySelector('.goal-drivers');
        var enablers = goalItems[i].querySelector('.goal-enablers');
        
        if (title && title.value.trim()) {
            planData.goals.push({
                title: title.value,
                timeline: timeline ? timeline.value : '',
                strategicIntent: strategicIntent ? strategicIntent.value : '',
                drivers: drivers ? drivers.value : '',
                enablers: enablers ? enablers.value : ''
            });
        }
    }
}

// Load goals
function loadGoals() {
    var container = document.getElementById('goalsContainer');
    if (!container || !planData.goals || planData.goals.length === 0) return;
    
    container.innerHTML = '';
    for (var i = 0; i < planData.goals.length; i++) {
        var goal = planData.goals[i];
        var goalDiv = document.createElement('div');
        goalDiv.className = 'goal-item';
        goalDiv.innerHTML = '<div class="form-group"><label>Goal</label><p class="field-help">Set goals for different time horizons: 6 Month, 1 Year, 10 Year, etc. What do you want to achieve in each timeframe?</p><input type="text" class="goal-title" value="' + escapeHtml(goal.title) + '" placeholder="Enter a strategic goal..."></div>' +
            '<div class="form-group"><label>Time Horizon</label><select class="goal-timeline"><option value="">Select timeframe...</option><option value="6-month"' + (goal.timeline === '6-month' ? ' selected' : '') + '>6 Months</option><option value="1-year"' + (goal.timeline === '1-year' ? ' selected' : '') + '>1 Year</option><option value="3-year"' + (goal.timeline === '3-year' ? ' selected' : '') + '>3 Years</option><option value="5-year"' + (goal.timeline === '5-year' ? ' selected' : '') + '>5 Years</option><option value="10-year"' + (goal.timeline === '10-year' ? ' selected' : '') + '>10 Years</option></select></div>' +
            '<div class="form-group"><label>Strategic Intent</label><p class="field-help">How will you get there? Refer to your SWOT analysis when formulating this.</p><textarea class="goal-strategic-intent" placeholder="Describe how you will achieve this goal...">' + escapeHtml(goal.strategicIntent || '') + '</textarea></div>' +
            '<div class="form-group"><label>Drivers (Elephant Projects)</label><p class="field-help">What will you focus on? These are your major initiatives or "elephant projects" that drive progress.</p><textarea class="goal-drivers" placeholder="List the key focus areas or major projects...">' + escapeHtml(goal.drivers || '') + '</textarea></div>' +
            '<div class="form-group"><label>Enablers</label><p class="field-help">What frameworks, resources, and skills will you use? What capabilities do you need to develop?</p><textarea class="goal-enablers" placeholder="List frameworks, resources, and skills needed...">' + escapeHtml(goal.enablers || '') + '</textarea></div>' +
            '<button class="btn-remove" onclick="removeGoal(this)" style="background: #dc3545; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Remove</button>';
        container.appendChild(goalDiv);
    }
    setupEventListeners();
    setupCharacterCounts();
    updateStepCompletion();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Show export options
function showExportOptions() {
    var dropdown = document.getElementById('exportDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close export dropdown when clicking outside
document.addEventListener('click', function(event) {
    var dropdown = document.getElementById('exportDropdown');
    var exportBtn = event.target.closest('.btn-export');
    if (dropdown && !dropdown.contains(event.target) && !exportBtn) {
        dropdown.classList.remove('show');
    }
});

// Check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if Web Share API is available
function isWebShareAvailable() {
    return navigator.share && navigator.canShare;
}

// Export plan with mobile support
function exportPlan(format) {
    saveData();
    
    // Close dropdown
    var dropdown = document.getElementById('exportDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    var filename = 'Strategic_Plan_' + new Date().toISOString().split('T')[0];
    var blob, mimeType, extension, content;
    
    if (format === 'docx') {
        content = generateWordDocument();
        // Create HTML that Word can open
        blob = new Blob([content], { type: 'application/msword' });
        mimeType = 'application/msword';
        extension = '.doc';
        filename += extension;
    } else if (format === 'xlsx') {
        content = generateExcelDocument();
        // Create HTML that Excel can open
        blob = new Blob([content], { type: 'application/vnd.ms-excel' });
        mimeType = 'application/vnd.ms-excel';
        extension = '.xls';
        filename += extension;
    } else {
        content = generatePlanDocument();
        blob = new Blob([content], { type: 'text/plain' });
        mimeType = 'text/plain';
        extension = '.txt';
        filename += extension;
    }
    
    // For text files on mobile, always show options (better for iPhone)
    if (isMobileDevice() && format === 'txt') {
        shareFileMobileFallback(blob, filename, mimeType, content);
    } else if (isMobileDevice() && isWebShareAvailable()) {
        // Use Web Share API for mobile devices if available
        shareFileMobile(blob, filename, mimeType);
    } else if (isMobileDevice()) {
        // Fallback for mobile devices without Web Share API
        shareFileMobileFallback(blob, filename, mimeType, content);
    } else {
        // Standard download for desktop
        downloadFile(blob, filename);
    }
}

// Share file on mobile using Web Share API
function shareFileMobile(blob, filename, mimeType) {
    var file = new File([blob], filename, { type: mimeType });
    
    // Try to share file if supported
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
            files: [file],
            title: 'Strategic Plan',
            text: 'My Strategic Plan - ' + filename
        }).catch(function(error) {
            console.log('Error sharing file:', error);
            // Fallback to alternative method
            shareFileMobileFallback(blob, filename, mimeType, null);
        });
    } else {
        // File sharing not supported, try text sharing for text files
        if (mimeType === 'text/plain') {
            blob.text().then(function(text) {
                if (navigator.share) {
                    navigator.share({
                        title: 'Strategic Plan',
                        text: text
                    }).catch(function(error) {
                        console.log('Error sharing text:', error);
                        shareFileMobileFallback(blob, filename, mimeType, text);
                    });
                } else {
                    shareFileMobileFallback(blob, filename, mimeType, text);
                }
            }).catch(function(error) {
                console.log('Error reading blob:', error);
                shareFileMobileFallback(blob, filename, mimeType, null);
            });
        } else {
            // For non-text files, use fallback
            shareFileMobileFallback(blob, filename, mimeType, null);
        }
    }
}

// Fallback method for mobile devices
function shareFileMobileFallback(blob, filename, mimeType, content) {
    // Try to create a download link that works on mobile
    var url = window.URL.createObjectURL(blob);
    
    // For text files, show export options modal
    if (mimeType === 'text/plain' && content) {
        showMobileExportOptions(url, filename, content);
        return;
    }
    
    // For other file types, try to download or show options
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
        // iOS: Try download first, then show options
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
        a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
        
        // Show options after a brief delay
        setTimeout(function() {
            showMobileFileOptions(url, filename, mimeType);
    document.body.removeChild(a);
        }, 300);
    } else {
        // Android: Try download
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show options modal for additional methods
        setTimeout(function() {
            showMobileFileOptions(url, filename, mimeType);
        }, 300);
    }
}

// Show file export options for non-text files
function showMobileFileOptions(url, filename, mimeType) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    var modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 80%; overflow-y: auto;';
    
    var title = document.createElement('h3');
    title.style.cssText = 'margin-top: 0;';
    title.textContent = 'Export Options';
    modalContent.appendChild(title);
    
    var description = document.createElement('p');
    description.textContent = 'If the download didn\'t work, try these options:';
    modalContent.appendChild(description);
    
    // Download file link
    var downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.textContent = 'Try Download Again';
    downloadLink.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; text-align: center; text-decoration: none;';
    downloadLink.onclick = function() {
        setTimeout(function() {
            modal.remove();
            setTimeout(function() {
                window.URL.revokeObjectURL(url);
            }, 100);
        }, 100);
    };
    modalContent.appendChild(downloadLink);
    
    // Open in new tab (for viewing)
    var openLink = document.createElement('a');
    openLink.href = url;
    openLink.target = '_blank';
    openLink.textContent = 'Open in New Tab';
    openLink.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #0f4c75; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; text-align: center; text-decoration: none;';
    openLink.onclick = function() {
        setTimeout(function() {
            modal.remove();
            setTimeout(function() {
                window.URL.revokeObjectURL(url);
            }, 1000);
        }, 100);
    };
    modalContent.appendChild(openLink);
    
    // Cancel button
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Close';
    cancelBtn.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    cancelBtn.onclick = function() {
        modal.remove();
        window.URL.revokeObjectURL(url);
    };
    modalContent.appendChild(cancelBtn);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            window.URL.revokeObjectURL(url);
        }
    });
}

// Show additional export options for mobile
function showMobileExportOptions(url, filename, textContent) {
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Create a modal with export options
    var modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    var modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 80%; overflow-y: auto;';
    
    // Store text content in a data attribute for safe access
    modalContent.setAttribute('data-text-content', textContent);
    modalContent.setAttribute('data-file-url', url);
    
    var title = document.createElement('h3');
    title.style.cssText = 'margin-top: 0;';
    title.textContent = 'Export Options';
    modalContent.appendChild(title);
    
    var description = document.createElement('p');
    description.textContent = 'Choose how you want to save your strategic plan:';
    modalContent.appendChild(description);
    
    // For iOS, add "View & Save" option first (best for iPhone)
    if (isIOS) {
        var viewSaveBtn = document.createElement('button');
        viewSaveBtn.textContent = 'View & Save to Files (Recommended for iPhone)';
        viewSaveBtn.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #007AFF; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;';
        viewSaveBtn.onclick = function() {
            openTextForIOSSave(textContent, filename);
            modal.remove();
            window.URL.revokeObjectURL(url);
        };
        modalContent.appendChild(viewSaveBtn);
    }
    
    // Copy to clipboard button
    var copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Text to Clipboard';
    copyBtn.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #0f4c75; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    copyBtn.onclick = function() {
        copyToClipboard(textContent);
        modal.remove();
        window.URL.revokeObjectURL(url);
    };
    modalContent.appendChild(copyBtn);
    
    // Download file link
    var downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.textContent = 'Download File';
    downloadLink.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; text-align: center; text-decoration: none;';
    downloadLink.onclick = function() {
        setTimeout(function() {
            modal.remove();
            setTimeout(function() {
                window.URL.revokeObjectURL(url);
            }, 100);
        }, 100);
    };
    modalContent.appendChild(downloadLink);
    
    // Email button
    var emailBtn = document.createElement('button');
    emailBtn.textContent = 'Email as Text';
    emailBtn.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    emailBtn.onclick = function() {
        shareViaEmail(textContent);
        modal.remove();
        window.URL.revokeObjectURL(url);
    };
    modalContent.appendChild(emailBtn);
    
    // Cancel button
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'display: block; width: 100%; padding: 12px; margin: 8px 0; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;';
    cancelBtn.onclick = function() {
        modal.remove();
        window.URL.revokeObjectURL(url);
    };
    modalContent.appendChild(cancelBtn);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            window.URL.revokeObjectURL(url);
        }
    });
}

// Open text in a new page that can be saved on iOS
function openTextForIOSSave(textContent, filename) {
    // Create an HTML page with the text content that can be saved
    var htmlContent = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + escapeHtml(filename) + '</title>\n<style>body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;}</style>\n</head>\n<body>\n' + escapeHtml(textContent) + '\n</body>\n</html>';
    
    // Create a blob with the HTML content
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var blobUrl = window.URL.createObjectURL(blob);
    
    // Try to open in new window/tab
    var newWindow = window.open(blobUrl, '_blank');
    
    // If that doesn't work, create a link and click it
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        var link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Also create a plain text version for direct download
    setTimeout(function() {
        var textBlob = new Blob([textContent], { type: 'text/plain' });
        var textBlobUrl = window.URL.createObjectURL(textBlob);
        var textLink = document.createElement('a');
        textLink.href = textBlobUrl;
        textLink.download = filename;
        textLink.style.display = 'none';
        document.body.appendChild(textLink);
        textLink.click();
        document.body.removeChild(textLink);
        
        // Clean up after a delay
        setTimeout(function() {
            window.URL.revokeObjectURL(textBlobUrl);
        }, 1000);
    }, 500);
    
    // Clean up HTML blob URL after a delay
    setTimeout(function() {
        window.URL.revokeObjectURL(blobUrl);
    }, 5000);
    
    // Show instructions
    alert('The document has been opened. On iPhone:\n\n1. Tap the Share button (square with arrow) at the bottom\n2. Scroll and tap "Save to Files"\n3. Choose where to save it\n\nOr use "Copy Text" option to paste into Notes or other apps.');
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            alert('Text copied to clipboard! You can now paste it into any app.');
        }).catch(function(err) {
            console.error('Failed to copy:', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy to clipboard for older browsers
function fallbackCopyToClipboard(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('Text copied to clipboard! You can now paste it into any app.');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Could not copy to clipboard. Please select and copy the text manually.');
    }
    
    document.body.removeChild(textArea);
}

// Share via email
function shareViaEmail(text) {
    var subject = encodeURIComponent('Strategic Plan - ' + new Date().toLocaleDateString());
    var body = encodeURIComponent(text);
    var mailtoLink = 'mailto:?subject=' + subject + '&body=' + body;
    window.location.href = mailtoLink;
}

// Standard file download for desktop
function downloadFile(blob, filename) {
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Generate plan document
function generatePlanDocument() {
    var doc = 'STRATEGIC PLAN\n';
    doc += 'Generated: ' + new Date().toLocaleDateString() + '\n';
    doc += '='.repeat(50) + '\n\n';
    
    doc += 'BUSINESS INFORMATION\n';
    doc += '-'.repeat(50) + '\n';
    doc += 'Business Name: ' + (planData.businessName || 'Not specified') + '\n';
    doc += 'Prepared by: ' + (planData.userName || 'Not specified') + '\n\n';
    
    doc += 'PURPOSE\n';
    doc += '-'.repeat(50) + '\n';
    doc += 'Vision:\n' + planData.vision + '\n\n';
    doc += 'Values:\n' + planData.values + '\n\n';
    doc += 'Mission:\n' + planData.mission + '\n\n';
    
    doc += 'SWOT ANALYSIS\n';
    doc += '-'.repeat(50) + '\n';
    doc += 'Strengths:\n' + planData.strengths + '\n\n';
    doc += 'Weaknesses:\n' + planData.weaknesses + '\n\n';
    doc += 'Opportunities:\n' + planData.opportunities + '\n\n';
    doc += 'Threats:\n' + planData.threats + '\n\n';
    
    doc += 'STRATEGY - GOALS\n';
    doc += '-'.repeat(50) + '\n';
    for (var i = 0; i < planData.goals.length; i++) {
        doc += (i + 1) + '. ' + planData.goals[i].title + '\n';
        doc += '   Time Horizon: ' + planData.goals[i].timeline + '\n';
        doc += '   Strategic Intent: ' + planData.goals[i].strategicIntent + '\n';
        doc += '   Drivers: ' + planData.goals[i].drivers + '\n';
        doc += '   Enablers: ' + planData.goals[i].enablers + '\n\n';
    }
    
    doc += 'EXECUTION\n';
    doc += '-'.repeat(50) + '\n';
    doc += 'Targets & Initiatives:\n' + planData.targetsInitiatives + '\n\n';
    doc += 'Performance Indicators (KPIs):\n' + planData.kpis + '\n\n';
    doc += 'Strategy Map:\n' + planData.strategyMap + '\n\n';
    
    doc += 'MIND MAP - BUSINESS PROPONENTS\n';
    doc += '-'.repeat(50) + '\n';
    doc += 'Marketing:\n' + planData.marketing + '\n\n';
    doc += 'Sales:\n' + planData.sales + '\n\n';
    doc += 'Operations:\n' + planData.operations + '\n\n';
    doc += 'Administration:\n' + planData.administration + '\n\n';
    
    doc += 'REVIEW & MONITORING\n';
    doc += '-'.repeat(50) + '\n';
    doc += 'Review Frequency: ' + planData.reviewFrequency + '\n';
    doc += 'Success Criteria: ' + planData.successCriteria + '\n';
    doc += 'Notes: ' + planData.notes + '\n';
    
    return doc;
}

// Generate Word document (HTML format for Word)
function generateWordDocument() {
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var businessName = planData.businessName || 'Your Business';
    var userName = planData.userName || 'Strategic Planning Team';
    
    var html = '<!DOCTYPE html>\n';
    html += '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<meta name="ProgId" content="Word.Document">\n';
    html += '<meta name="Generator" content="Microsoft Word">\n';
    html += '<meta name="Originator" content="Microsoft Word">\n';
    html += '<title>Strategic Plan - ' + escapeHtml(businessName) + '</title>\n';
    html += '<!--[if gte mso 9]><xml>\n';
    html += '<w:WordDocument>\n';
    html += '<w:View>Print</w:View>\n';
    html += '<w:Zoom>100</w:Zoom>\n';
    html += '<w:DoNotOptimizeForBrowser/>\n';
    html += '</w:WordDocument>\n';
    html += '</xml><![endif]-->\n';
    html += '<style>\n';
    html += '@page { size: 8.5in 11in; margin: 1in; }\n';
    html += 'body { font-family: "Calibri", "Arial", sans-serif; font-size: 11pt; margin: 0; padding: 0; line-height: 1.5; color: #333; }\n';
        html += '.header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #0f4c75; page-break-after: avoid; }\n';
        html += '.header h1 { color: #0f4c75; font-size: 16pt; margin: 10px 0 5px 0; font-weight: bold; }\n';
    html += '.header .business-name { color: #333; font-size: 14pt; font-weight: bold; margin: 5px 0; }\n';
    html += '.header .subtitle { color: #666; font-size: 10pt; margin-top: 5px; }\n';
    html += '.header .meta { color: #999; font-size: 9pt; margin-top: 10px; }\n';
    html += '.section { margin-bottom: 30px; page-break-inside: avoid; }\n';
        html += '.section-title { color: #0f4c75; font-size: 14pt; font-weight: bold; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #0f4c75; page-break-after: avoid; }\n';
    html += '.subsection { margin-bottom: 15px; margin-left: 0; }\n';
    html += '.subsection-title { color: #555; font-size: 12pt; font-weight: bold; margin-bottom: 6px; margin-top: 12px; }\n';
    html += '.content { margin-bottom: 10px; line-height: 1.5; text-align: left; font-size: 11pt; }\n';
    html += '.content p { margin: 6px 0; }\n';
        html += '.goal-item { background: #f8f9fa; padding: 12px; margin-bottom: 12px; border-left: 4px solid #0f4c75; page-break-inside: avoid; }\n';
        html += '.goal-title { font-weight: bold; color: #0f4c75; font-size: 12pt; margin-bottom: 6px; }\n';
    html += '.goal-detail { margin-left: 12px; margin-bottom: 6px; color: #555; font-size: 11pt; line-height: 1.5; }\n';
    html += '.goal-label { font-weight: bold; color: #333; }\n';
    html += '.swot-grid { display: table; width: 100%; margin: 12px 0; border-collapse: separate; border-spacing: 10px; }\n';
    html += '.swot-row { display: table-row; }\n';
    html += '.swot-item { display: table-cell; width: 50%; padding: 12px; vertical-align: top; page-break-inside: avoid; }\n';
    html += '.swot-item h4 { font-weight: bold; margin-bottom: 6px; font-size: 11pt; }\n';
    html += '.swot-item .content { font-size: 10pt; }\n';
    html += '.swot-strengths { background: #e8f5e9; border-left: 3px solid #4caf50; }\n';
    html += '.swot-weaknesses { background: #fff3e0; border-left: 3px solid #ff9800; }\n';
    html += '.swot-opportunities { background: #e3f2fd; border-left: 3px solid #2196f3; }\n';
    html += '.swot-threats { background: #fce4ec; border-left: 3px solid #e91e63; }\n';
        html += '.proponent-item { background: #f8f9fa; padding: 12px; margin-bottom: 12px; border-left: 4px solid #0f4c75; page-break-inside: avoid; }\n';
        html += '.proponent-title { font-weight: bold; color: #0f4c75; font-size: 12pt; margin-bottom: 6px; }\n';
    html += 'p { margin: 8px 0; }\n';
    html += 'ul { margin: 8px 0; padding-left: 25px; }\n';
    html += 'li { margin: 4px 0; line-height: 1.5; }\n';
    html += '@media print { .section { page-break-inside: avoid; } }\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    
    // Header
    html += '<div class="header">\n';
    html += '<h1>STRATEGIC PLAN</h1>\n';
    html += '<div class="business-name">' + escapeHtml(businessName) + '</div>\n';
    html += '<div class="subtitle">Comprehensive Strategic Planning Document</div>\n';
    html += '<div class="meta">Prepared by: ' + escapeHtml(userName) + ' | Generated: ' + date + '</div>\n';
    html += '</div>\n';
    
    // Purpose Section
    html += '<div class="section">\n';
    html += '<div class="section-title">PURPOSE</div>\n';
    
    if (planData.vision) {
        html += '<div class="subsection">\n';
        html += '<div class="subsection-title">Vision Statement</div>\n';
        html += '<div class="content">' + formatTextForWord(planData.vision) + '</div>\n';
        html += '</div>\n';
    }
    
    if (planData.values) {
        html += '<div class="subsection">\n';
        html += '<div class="subsection-title">Core Values</div>\n';
        html += '<div class="content">' + formatTextForWord(planData.values) + '</div>\n';
        html += '</div>\n';
    }
    
    if (planData.mission) {
        html += '<div class="subsection">\n';
        html += '<div class="subsection-title">Mission Statement</div>\n';
        html += '<div class="content">' + formatTextForWord(planData.mission) + '</div>\n';
        html += '</div>\n';
    }
    
    html += '</div>\n';
    
    // Mind Map Section
    if (planData.marketing || planData.sales || planData.operations || planData.administration) {
        html += '<div class="section">\n';
        html += '<div class="section-title">BUSINESS MIND MAP</div>\n';
        
        if (planData.marketing) {
            html += '<div class="proponent-item">\n';
            html += '<div class="proponent-title">Marketing</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.marketing) + '</div>\n';
            html += '</div>\n';
        }
        
        if (planData.sales) {
            html += '<div class="proponent-item">\n';
            html += '<div class="proponent-title">Sales</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.sales) + '</div>\n';
            html += '</div>\n';
        }
        
        if (planData.operations) {
            html += '<div class="proponent-item">\n';
            html += '<div class="proponent-title">Operations</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.operations) + '</div>\n';
            html += '</div>\n';
        }
        
        if (planData.administration) {
            html += '<div class="proponent-item">\n';
            html += '<div class="proponent-title">Administration</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.administration) + '</div>\n';
            html += '</div>\n';
        }
        
        html += '</div>\n';
    }
    
    // SWOT Analysis
    if (planData.strengths || planData.weaknesses || planData.opportunities || planData.threats) {
        html += '<div class="section">\n';
        html += '<div class="section-title">SWOT ANALYSIS</div>\n';
        html += '<div class="swot-grid">\n';
        html += '<div class="swot-row">\n';
        
        html += '<div class="swot-item swot-strengths">\n';
        html += '<h4>Strengths</h4>\n';
        html += '<div class="content">' + formatTextForWord(planData.strengths || 'Not specified') + '</div>\n';
        html += '</div>\n';
        
        html += '<div class="swot-item swot-weaknesses">\n';
        html += '<h4>Weaknesses</h4>\n';
        html += '<div class="content">' + formatTextForWord(planData.weaknesses || 'Not specified') + '</div>\n';
        html += '</div>\n';
        
        html += '</div>\n';
        html += '<div class="swot-row">\n';
        
        html += '<div class="swot-item swot-opportunities">\n';
        html += '<h4>Opportunities</h4>\n';
        html += '<div class="content">' + formatTextForWord(planData.opportunities || 'Not specified') + '</div>\n';
        html += '</div>\n';
        
        html += '<div class="swot-item swot-threats">\n';
        html += '<h4>Threats</h4>\n';
        html += '<div class="content">' + formatTextForWord(planData.threats || 'Not specified') + '</div>\n';
        html += '</div>\n';
        
        html += '</div>\n';
        html += '</div>\n';
        html += '</div>\n';
    }
    
    // Strategy - Goals
    if (planData.goals && planData.goals.length > 0) {
        html += '<div class="section">\n';
        html += '<div class="section-title">STRATEGY - GOALS</div>\n';
        
        for (var i = 0; i < planData.goals.length; i++) {
            var goal = planData.goals[i];
            html += '<div class="goal-item">\n';
            html += '<div class="goal-title">' + (i + 1) + '. ' + escapeHtml(goal.title) + '</div>\n';
            
            if (goal.timeline) {
                html += '<div class="goal-detail"><span class="goal-label">Time Horizon:</span> ' + escapeHtml(goal.timeline) + '</div>\n';
            }
            
            if (goal.strategicIntent) {
                html += '<div class="goal-detail"><span class="goal-label">Strategic Intent:</span> ' + formatTextForWord(goal.strategicIntent) + '</div>\n';
            }
            
            if (goal.drivers) {
                html += '<div class="goal-detail"><span class="goal-label">Drivers (Elephant Projects):</span> ' + formatTextForWord(goal.drivers) + '</div>\n';
            }
            
            if (goal.enablers) {
                html += '<div class="goal-detail"><span class="goal-label">Enablers:</span> ' + formatTextForWord(goal.enablers) + '</div>\n';
            }
            
            html += '</div>\n';
        }
        
        html += '</div>\n';
    }
    
    // Execution
    if (planData.targetsInitiatives || planData.kpis || planData.strategyMap) {
        html += '<div class="section">\n';
        html += '<div class="section-title">EXECUTION</div>\n';
        
        if (planData.targetsInitiatives) {
            html += '<div class="subsection">\n';
            html += '<div class="subsection-title">Targets & Initiatives</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.targetsInitiatives) + '</div>\n';
            html += '</div>\n';
        }
        
        if (planData.kpis) {
            html += '<div class="subsection">\n';
            html += '<div class="subsection-title">Performance Indicators (KPIs)</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.kpis) + '</div>\n';
            html += '</div>\n';
        }
        
        if (planData.strategyMap) {
            html += '<div class="subsection">\n';
            html += '<div class="subsection-title">Strategy Map</div>\n';
            html += '<div class="content">' + formatTextForWord(planData.strategyMap) + '</div>\n';
            html += '</div>\n';
        }
        
        html += '</div>\n';
    }
    
    // Review & Monitoring
    html += '<div class="section">\n';
    html += '<div class="section-title">REVIEW & MONITORING</div>\n';
    
    html += '<div class="subsection">\n';
    html += '<div class="subsection-title">Review Frequency</div>\n';
    html += '<div class="content">' + escapeHtml(planData.reviewFrequency || 'Not specified') + '</div>\n';
    html += '</div>\n';
    
    if (planData.successCriteria) {
        html += '<div class="subsection">\n';
        html += '<div class="subsection-title">Success Criteria</div>\n';
        html += '<div class="content">' + formatTextForWord(planData.successCriteria) + '</div>\n';
        html += '</div>\n';
    }
    
    if (planData.notes) {
        html += '<div class="subsection">\n';
        html += '<div class="subsection-title">Additional Notes</div>\n';
        html += '<div class="content">' + formatTextForWord(planData.notes) + '</div>\n';
        html += '</div>\n';
    }
    
    html += '</div>\n';
    
    html += '</body>\n';
    html += '</html>\n';
    
    return html;
}

// Format text for Word document (preserve line breaks, escape HTML)
function formatTextForWord(text) {
    if (!text) return '';
    var escaped = escapeHtml(text);
    // Convert line breaks to <br> tags
    escaped = escaped.replace(/\n/g, '<br>');
    // Convert double line breaks to paragraphs
    escaped = escaped.replace(/(<br>\s*){2,}/g, '</p><p>');
    return '<p>' + escaped + '</p>';
}

// Generate Excel document (HTML table format for Excel)
function generateExcelDocument() {
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var businessName = planData.businessName || 'Your Business';
    var userName = planData.userName || 'Strategic Planning Team';
    
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n';
    html += '<head>\n';
    html += '<meta charset="utf-8">\n';
    html += '<!--[if gte mso 9]><xml>\n';
    html += '<x:ExcelWorkbook>\n';
    html += '<x:ExcelWorksheets>\n';
    html += '<x:ExcelWorksheet>\n';
    html += '<x:Name>Strategic Plan</x:Name>\n';
    html += '<x:WorksheetOptions>\n';
    html += '<x:PrintGridlines/>\n';
    html += '<x:FitToPage/>\n';
    html += '<x:FitWidth>1</x:FitWidth>\n';
    html += '<x:FitHeight>1</x:FitHeight>\n';
    html += '</x:WorksheetOptions>\n';
    html += '</x:ExcelWorksheet>\n';
    html += '</x:ExcelWorksheets>\n';
    html += '</x:ExcelWorkbook>\n';
    html += '</xml><![endif]-->\n';
    html += '<style>\n';
    html += 'td { font-family: Calibri, Arial, sans-serif; font-size: 11pt; padding: 8px; vertical-align: top; }\n';
        html += '.header-cell { background-color: #0f4c75; color: white; font-weight: bold; font-size: 14pt; text-align: center; padding: 15px; }\n';
    html += '.section-header { background-color: #764ba2; color: white; font-weight: bold; font-size: 12pt; padding: 12px; }\n';
    html += '.subsection-header { background-color: #9b7bb8; color: white; font-weight: bold; font-size: 11pt; padding: 10px; }\n';
    html += '.label-cell { background-color: #f0f0f0; font-weight: bold; width: 200px; border-right: 2px solid #ddd; }\n';
    html += '.data-cell { background-color: #ffffff; border-left: 1px solid #e0e0e0; }\n';
    html += '.swot-strengths { background-color: #e8f5e9; border-left: 4px solid #4caf50; }\n';
    html += '.swot-weaknesses { background-color: #fff3e0; border-left: 4px solid #ff9800; }\n';
    html += '.swot-opportunities { background-color: #e3f2fd; border-left: 4px solid #2196f3; }\n';
    html += '.swot-threats { background-color: #fce4ec; border-left: 4px solid #e91e63; }\n';
        html += '.goal-row { background-color: #f8f9fa; border-left: 4px solid #0f4c75; }\n';
        html += '.proponent-row { background-color: #f8f9fa; border-left: 4px solid #0f4c75; }\n';
    html += 'table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }\n';
    html += 'td { border: 1px solid #ddd; }\n';
    html += '.meta-row { background-color: #f5f5f5; font-size: 9pt; color: #666; }\n';
    html += '</style>\n';
    html += '</head>\n';
    html += '<body>\n';
    html += '<table>\n';
    
    // Header Row
    html += '<tr>\n';
    html += '<td colspan="2" class="header-cell">STRATEGIC PLAN</td>\n';
    html += '</tr>\n';
    html += '<tr>\n';
    html += '<td colspan="2" style="text-align: center; padding: 10px; background-color: #f8f9fa; font-size: 12pt; font-weight: bold;">' + escapeHtml(businessName) + '</td>\n';
    html += '</tr>\n';
    html += '<tr class="meta-row">\n';
    html += '<td colspan="2" style="text-align: center; padding: 5px;">Prepared by: ' + escapeHtml(userName) + ' | Generated: ' + date + '</td>\n';
    html += '</tr>\n';
    html += '<tr><td colspan="2" style="height: 10px; border: none;"></td></tr>\n';
    
    // Purpose Section
    html += '<tr>\n';
    html += '<td colspan="2" class="section-header">PURPOSE</td>\n';
    html += '</tr>\n';
    
    if (planData.vision) {
        html += '<tr>\n';
        html += '<td class="label-cell">Vision Statement</td>\n';
        html += '<td class="data-cell">' + formatTextForExcel(planData.vision) + '</td>\n';
        html += '</tr>\n';
    }
    
    if (planData.values) {
        html += '<tr>\n';
        html += '<td class="label-cell">Core Values</td>\n';
        html += '<td class="data-cell">' + formatTextForExcel(planData.values) + '</td>\n';
        html += '</tr>\n';
    }
    
    if (planData.mission) {
        html += '<tr>\n';
        html += '<td class="label-cell">Mission Statement</td>\n';
        html += '<td class="data-cell">' + formatTextForExcel(planData.mission) + '</td>\n';
        html += '</tr>\n';
    }
    
    html += '<tr><td colspan="2" style="height: 15px; border: none;"></td></tr>\n';
    
    // Mind Map Section
    if (planData.marketing || planData.sales || planData.operations || planData.administration) {
        html += '<tr>\n';
        html += '<td colspan="2" class="section-header">BUSINESS MIND MAP</td>\n';
        html += '</tr>\n';
        
        if (planData.marketing) {
            html += '<tr class="proponent-row">\n';
            html += '<td class="label-cell" style="font-weight: bold; color: #667eea;">Marketing</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.marketing) + '</td>\n';
            html += '</tr>\n';
        }
        
        if (planData.sales) {
            html += '<tr class="proponent-row">\n';
            html += '<td class="label-cell" style="font-weight: bold; color: #667eea;">Sales</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.sales) + '</td>\n';
            html += '</tr>\n';
        }
        
        if (planData.operations) {
            html += '<tr class="proponent-row">\n';
            html += '<td class="label-cell" style="font-weight: bold; color: #667eea;">Operations</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.operations) + '</td>\n';
            html += '</tr>\n';
        }
        
        if (planData.administration) {
            html += '<tr class="proponent-row">\n';
            html += '<td class="label-cell" style="font-weight: bold; color: #667eea;">Administration</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.administration) + '</td>\n';
            html += '</tr>\n';
        }
        
        html += '<tr><td colspan="2" style="height: 15px; border: none;"></td></tr>\n';
    }
    
    // SWOT Analysis Section
    if (planData.strengths || planData.weaknesses || planData.opportunities || planData.threats) {
        html += '<tr>\n';
        html += '<td colspan="2" class="section-header">SWOT ANALYSIS</td>\n';
        html += '</tr>\n';
        html += '<tr>\n';
        
        // Strengths and Weaknesses
        html += '<td class="swot-strengths" style="width: 50%;">\n';
        html += '<table style="width: 100%; border: none;">\n';
        html += '<tr><td style="font-weight: bold; font-size: 12pt; padding-bottom: 8px; border: none;">Strengths</td></tr>\n';
        html += '<tr><td style="border: none; padding: 0;">' + formatTextForExcel(planData.strengths || 'Not specified') + '</td></tr>\n';
        html += '</table>\n';
        html += '</td>\n';
        
        html += '<td class="swot-weaknesses" style="width: 50%;">\n';
        html += '<table style="width: 100%; border: none;">\n';
        html += '<tr><td style="font-weight: bold; font-size: 12pt; padding-bottom: 8px; border: none;">Weaknesses</td></tr>\n';
        html += '<tr><td style="border: none; padding: 0;">' + formatTextForExcel(planData.weaknesses || 'Not specified') + '</td></tr>\n';
        html += '</table>\n';
        html += '</td>\n';
        html += '</tr>\n';
        
        html += '<tr>\n';
        // Opportunities and Threats
        html += '<td class="swot-opportunities" style="width: 50%;">\n';
        html += '<table style="width: 100%; border: none;">\n';
        html += '<tr><td style="font-weight: bold; font-size: 12pt; padding-bottom: 8px; border: none;">Opportunities</td></tr>\n';
        html += '<tr><td style="border: none; padding: 0;">' + formatTextForExcel(planData.opportunities || 'Not specified') + '</td></tr>\n';
        html += '</table>\n';
        html += '</td>\n';
        
        html += '<td class="swot-threats" style="width: 50%;">\n';
        html += '<table style="width: 100%; border: none;">\n';
        html += '<tr><td style="font-weight: bold; font-size: 12pt; padding-bottom: 8px; border: none;">Threats</td></tr>\n';
        html += '<tr><td style="border: none; padding: 0;">' + formatTextForExcel(planData.threats || 'Not specified') + '</td></tr>\n';
        html += '</table>\n';
        html += '</td>\n';
        html += '</tr>\n';
        
        html += '<tr><td colspan="2" style="height: 15px; border: none;"></td></tr>\n';
    }
    
    // Strategy - Goals Section
    if (planData.goals && planData.goals.length > 0) {
        html += '<tr>\n';
        html += '<td colspan="2" class="section-header">STRATEGY - GOALS</td>\n';
        html += '</tr>\n';
        
        for (var i = 0; i < planData.goals.length; i++) {
            var goal = planData.goals[i];
            html += '<tr class="goal-row">\n';
            html += '<td colspan="2" style="font-weight: bold; color: #667eea; font-size: 12pt; padding: 10px;">Goal ' + (i + 1) + ': ' + escapeHtml(goal.title) + '</td>\n';
            html += '</tr>\n';
            
            if (goal.timeline) {
                html += '<tr class="goal-row">\n';
                html += '<td class="label-cell">Time Horizon</td>\n';
                html += '<td class="data-cell">' + escapeHtml(goal.timeline) + '</td>\n';
                html += '</tr>\n';
            }
            
            if (goal.strategicIntent) {
                html += '<tr class="goal-row">\n';
                html += '<td class="label-cell">Strategic Intent</td>\n';
                html += '<td class="data-cell">' + formatTextForExcel(goal.strategicIntent) + '</td>\n';
                html += '</tr>\n';
            }
            
            if (goal.drivers) {
                html += '<tr class="goal-row">\n';
                html += '<td class="label-cell">Drivers (Elephant Projects)</td>\n';
                html += '<td class="data-cell">' + formatTextForExcel(goal.drivers) + '</td>\n';
                html += '</tr>\n';
            }
            
            if (goal.enablers) {
                html += '<tr class="goal-row">\n';
                html += '<td class="label-cell">Enablers</td>\n';
                html += '<td class="data-cell">' + formatTextForExcel(goal.enablers) + '</td>\n';
                html += '</tr>\n';
            }
            
            html += '<tr><td colspan="2" style="height: 10px; border: none;"></td></tr>\n';
        }
        
        html += '<tr><td colspan="2" style="height: 15px; border: none;"></td></tr>\n';
    }
    
    // Execution Section
    if (planData.targetsInitiatives || planData.kpis || planData.strategyMap) {
        html += '<tr>\n';
        html += '<td colspan="2" class="section-header">EXECUTION</td>\n';
        html += '</tr>\n';
        
        if (planData.targetsInitiatives) {
            html += '<tr>\n';
            html += '<td class="label-cell">Targets & Initiatives</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.targetsInitiatives) + '</td>\n';
            html += '</tr>\n';
        }
        
        if (planData.kpis) {
            html += '<tr>\n';
            html += '<td class="label-cell">Performance Indicators (KPIs)</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.kpis) + '</td>\n';
            html += '</tr>\n';
        }
        
        if (planData.strategyMap) {
            html += '<tr>\n';
            html += '<td class="label-cell">Strategy Map</td>\n';
            html += '<td class="data-cell">' + formatTextForExcel(planData.strategyMap) + '</td>\n';
            html += '</tr>\n';
        }
        
        html += '<tr><td colspan="2" style="height: 15px; border: none;"></td></tr>\n';
    }
    
    // Review & Monitoring Section
    html += '<tr>\n';
    html += '<td colspan="2" class="section-header">REVIEW & MONITORING</td>\n';
    html += '</tr>\n';
    
    html += '<tr>\n';
    html += '<td class="label-cell">Review Frequency</td>\n';
    html += '<td class="data-cell">' + escapeHtml(planData.reviewFrequency || 'Not specified') + '</td>\n';
    html += '</tr>\n';
    
    if (planData.successCriteria) {
        html += '<tr>\n';
        html += '<td class="label-cell">Success Criteria</td>\n';
        html += '<td class="data-cell">' + formatTextForExcel(planData.successCriteria) + '</td>\n';
        html += '</tr>\n';
    }
    
    if (planData.notes) {
        html += '<tr>\n';
        html += '<td class="label-cell">Additional Notes</td>\n';
        html += '<td class="data-cell">' + formatTextForExcel(planData.notes) + '</td>\n';
        html += '</tr>\n';
    }
    
    html += '</table>\n';
    html += '</body>\n';
    html += '</html>\n';
    
    return html;
}

// Format text for Excel (preserve line breaks)
function formatTextForExcel(text) {
    if (!text) return '';
    var escaped = escapeHtml(text);
    // Convert line breaks to Excel line breaks (Alt+Enter)
    escaped = escaped.replace(/\n/g, '&#10;');
    return escaped;
}

// Load sample data for testing/demonstration
function loadSampleData() {
    // Save current user data before loading sample data
    saveData(); // Ensure current data is saved
    userDataBackup = JSON.parse(JSON.stringify(planData)); // Deep copy current data
    
    // Step 1: Purpose
    planData.businessName = 'TechFlow Solutions';
    planData.userName = 'Sarah Chen, CEO';
    planData.vision = 'To become the leading provider of digital transformation consulting services in the Pacific Northwest, recognized for innovative solutions that help mid-market companies scale efficiently and compete in the digital economy. By 2030, we aim to serve 500+ clients and achieve $50M in annual revenue.';
    planData.values = 'Innovation\nIntegrity\nClient Success\nContinuous Learning\nWork-Life Balance\nDiversity & Inclusion';
    planData.mission = 'TechFlow Solutions exists to empower mid-market businesses with cutting-edge technology solutions and strategic guidance. We bridge the gap between complex technology and business outcomes, helping our clients achieve sustainable growth through digital transformation, cloud migration, and data-driven decision making.';
    
    // Step 3: Mind Map (Business Proponents)
    planData.marketing = 'Target Market: Mid-market companies (50-500 employees) in manufacturing, healthcare, and professional services.\n\nChannels: LinkedIn advertising, industry conferences, content marketing (blog, whitepapers), referral partnerships with accounting firms and business consultants.\n\nStrategy: Thought leadership positioning, case studies, webinars, and free technology assessments.\n\nResponsible: Jennifer Martinez, Marketing Director\n\nGoal: Generate 50 qualified leads per month, maintain 8+ touchpoints with prospects before sales handoff.';
    planData.sales = 'Process: Inbound lead qualification → Discovery call → Technical assessment → Proposal → Negotiation → Close\n\nApproach: Consultative selling focused on ROI and business outcomes, not just technology features. Average sales cycle: 60-90 days.\n\nResponsible: Michael Thompson, VP of Sales\n\nTeam: 3 account executives, 1 sales engineer\n\nTarget: $2M ARR by end of year, 30% close rate on qualified opportunities.';
    planData.operations = 'Service Delivery: Agile project management, 2-week sprints, dedicated project managers for each engagement\n\nCore Services: Cloud migration (AWS/Azure), custom software development, data analytics implementation, cybersecurity assessments\n\nQuality Assurance: Code reviews, automated testing, client feedback loops, quarterly service reviews\n\nResponsible: David Kim, Director of Operations\n\nTeam: 12 developers, 4 project managers, 2 DevOps engineers\n\nOutsourcing: UI/UX design, specialized security audits, content writing.';
    planData.administration = 'Finance: QuickBooks Online, monthly P&L reviews, quarterly board meetings, annual budget planning\n\nHR: BambooHR for payroll and benefits, 401(k) matching, professional development budget ($2K per employee annually)\n\nIT Infrastructure: Microsoft 365, Slack, Jira, GitHub Enterprise, AWS for hosting\n\nLegal: Outside counsel for contracts, annual compliance review\n\nResponsible: Operations team with CEO oversight\n\nSystems: All processes documented in Notion, can operate 2+ weeks without CEO presence, scalable to 50 employees without major restructuring.';
    
    // Step 4: SWOT Analysis
    planData.strengths = '• Deep technical expertise in cloud architecture and modern development practices\n• Strong client relationships with 95% retention rate\n• Agile, adaptable team culture that responds quickly to market changes\n• Proven track record: 50+ successful implementations in past 3 years\n• Strong brand reputation in local market\n• Diverse skill set across team (full-stack, DevOps, data, security)';
    planData.weaknesses = '• Limited brand recognition outside Pacific Northwest\n• Heavy reliance on key personnel (3 senior engineers handle 60% of complex projects)\n• Limited marketing budget compared to larger competitors\n• No dedicated sales team until recently (CEO was primary salesperson)\n• Limited experience with enterprise clients (500+ employees)\n• Cash flow challenges during slow months (seasonal business)';
    planData.opportunities = '• Growing demand for digital transformation post-COVID\n• Partnership opportunities with Microsoft and AWS (can become certified partner)\n• Emerging AI/ML market - clients asking about implementation\n• Remote work trend allows us to serve clients nationwide\n• Government contracts (small business set-asides)\n• Acquisition of smaller consulting firms in adjacent markets\n• Industry-specific solutions (healthcare compliance, manufacturing automation)';
    planData.threats = '• Large consulting firms (Deloitte, Accenture) entering mid-market space with lower prices\n• Economic downturn could reduce client IT budgets\n• Talent shortage in tech industry - difficult to hire senior engineers\n• Rapid technology changes require constant training investment\n• Client concentration risk (top 3 clients = 40% of revenue)\n• Cybersecurity threats to our own infrastructure and client systems';
    
    // Step 5: Strategy - Goals
    planData.goals = [
        {
            title: 'Achieve $5M Annual Recurring Revenue',
            timeline: '3-year',
            strategicIntent: 'Leverage our strengths in cloud migration and client relationships while addressing weaknesses in sales capacity and geographic reach. Focus on expanding service offerings (AI/ML, cybersecurity) and building strategic partnerships to access new markets.',
            drivers: '1. Hire 2 additional senior sales executives\n2. Launch AI/ML consulting practice\n3. Establish AWS and Microsoft partner status\n4. Develop 3 industry-specific solution packages\n5. Expand marketing budget by 150%',
            enablers: '• Salesforce CRM implementation\n• Marketing automation platform (HubSpot)\n• Enhanced project management tools\n• Employee training program for AI/ML\n• Strategic partnership framework\n• $2M working capital line of credit'
        },
        {
            title: 'Build Scalable Operations Infrastructure',
            timeline: '1-year',
            strategicIntent: 'Address operational weaknesses by creating systems and processes that reduce dependency on key personnel. Implement standardized methodologies, knowledge management systems, and cross-training programs.',
            drivers: '1. Document all service delivery processes\n2. Implement knowledge base and internal wiki\n3. Cross-train team members on critical skills\n4. Establish quality assurance checkpoints\n5. Create client onboarding playbook',
            enablers: '• Notion for documentation\n• Standardized project templates\n• Weekly team training sessions\n• Quality metrics dashboard\n• Client feedback system'
        },
        {
            title: 'Expand Geographic Reach',
            timeline: '2-year',
            strategicIntent: 'Capitalize on remote work trend and partnership opportunities to serve clients beyond Pacific Northwest. Use virtual delivery model and strategic partnerships to enter new markets without physical presence.',
            drivers: '1. Develop remote delivery capabilities\n2. Partner with regional business consultants\n3. Create virtual workshop and assessment offerings\n4. Target 3 new geographic markets\n5. Build case studies from remote engagements',
            enablers: '• Video conferencing infrastructure\n• Remote collaboration tools\n• Partnership agreement templates\n• Marketing materials for new markets\n• Virtual delivery methodology'
        }
    ];
    
    // Step 6: Execution
    planData.targetsInitiatives = 'Q1 Targets:\n• Hire 1 senior sales executive\n• Complete AWS partner application\n• Launch 2 new service offerings (AI assessment, security audit)\n• Achieve $400K quarterly revenue\n• Onboard 8 new clients\n\nQ2 Targets:\n• Hire second sales executive\n• Complete Microsoft partner application\n• Develop healthcare industry solution package\n• Achieve $500K quarterly revenue\n• Implement Salesforce CRM\n\nQ3-Q4 Targets:\n• Launch AI/ML consulting practice\n• Establish 2 strategic partnerships\n• Enter 1 new geographic market\n• Achieve $600K+ quarterly revenue\n• Reduce client concentration risk (top 3 clients < 30% of revenue)';
    planData.kpis = 'Revenue Metrics:\n• Monthly Recurring Revenue (MRR)\n• Annual Recurring Revenue (ARR)\n• Revenue per client\n• Revenue growth rate (target: 40% YoY)\n\nSales Metrics:\n• Lead conversion rate (target: 30%)\n• Average sales cycle length (target: 60 days)\n• Sales pipeline value\n• New client acquisition rate (target: 8-10 per quarter)\n\nOperational Metrics:\n• Project delivery on-time rate (target: 90%)\n• Client satisfaction score (target: 4.5/5)\n• Employee utilization rate (target: 75%)\n• Billable hours per employee\n\nFinancial Metrics:\n• Gross margin (target: 65%)\n• Operating margin (target: 20%)\n• Cash runway (target: 6+ months)\n• Days sales outstanding (target: < 45 days)';
    planData.strategyMap = 'Communication Strategy:\n• Monthly all-hands meeting to review progress on strategic goals\n• Quarterly board meetings with key stakeholders\n• Weekly leadership team check-ins\n• Client quarterly business reviews\n• Annual strategic planning retreat\n\nTesting & Validation:\n• Monthly KPI dashboard review\n• Quarterly strategy review and adjustment\n• Annual comprehensive strategic plan update\n• Client feedback surveys (quarterly)\n• Employee engagement surveys (biannually)\n• Competitive analysis (quarterly)\n\nSuccess Metrics:\n• Track progress against KPIs monthly\n• Review goal achievement quarterly\n• Adjust tactics based on market feedback\n• Celebrate wins and learn from failures';
    
    // Step 7: Review & Monitoring
    planData.reviewFrequency = 'quarterly';
    planData.successCriteria = 'Year 1 Success Criteria:\n• Achieve $2M ARR\n• Maintain 95%+ client retention\n• Hire 5 new team members\n• Launch 2 new service offerings\n• Establish 1 strategic partnership\n• Achieve 4.5+ client satisfaction score\n\nYear 2-3 Success Criteria:\n• Achieve $5M ARR\n• Serve 100+ active clients\n• Expand to 2 new geographic markets\n• Build team to 30+ employees\n• Achieve 20%+ operating margin\n• Establish thought leadership in 2 industry verticals';
    planData.notes = 'Key Considerations:\n• Monitor economic indicators closely - be prepared to pivot if recession impacts client budgets\n• Invest in employee retention - competitive salaries and strong culture are critical in tight labor market\n• Maintain focus on quality over quantity - better to have fewer high-value clients than many low-margin ones\n• Build cash reserves during strong quarters to weather slow periods\n• Stay current on technology trends - allocate 10% of time to learning and experimentation\n• Consider acquisition opportunities if they accelerate strategic goals\n\nRisk Mitigation:\n• Diversify client base to reduce concentration risk\n• Build bench strength to reduce key person dependency\n• Maintain strong banking relationships for working capital access\n• Invest in cybersecurity to protect client data and our reputation';
    
    // Populate the form
    populateForm();
    
    // Update UI
    updateStepCompletion();
    updateProgress();
    setupCharacterCounts();
    
    // Show "Your data" button and hide "Load Sample Data" button
    var sampleDataBtn = document.querySelector('button[onclick="loadSampleData()"]');
    var yourDataBtnContainer = document.getElementById('yourDataButtonContainer');
    
    if (sampleDataBtn) {
        sampleDataBtn.style.display = 'none';
    }
    
    if (!yourDataBtnContainer) {
        // Create the "Your data" button container if it doesn't exist
        var buttonDiv = document.querySelector('div[style*="text-align: center"]');
        if (buttonDiv) {
            var yourDataDiv = document.createElement('div');
            yourDataDiv.id = 'yourDataButtonContainer';
            yourDataDiv.style.cssText = 'text-align: center; margin-top: 15px;';
            yourDataDiv.innerHTML = '<button onclick="restoreUserData()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: all 0.3s ease;">Your Data</button>';
            buttonDiv.appendChild(yourDataDiv);
        }
    } else {
        yourDataBtnContainer.style.display = 'block';
    }
    
    // Show confirmation
    alert('Sample data loaded! This demonstrates a complete strategic plan for TechFlow Solutions, a tech consulting business.');
}

// Restore user's original data
function restoreUserData() {
    if (!userDataBackup) {
        // No backup means user hasn't entered anything, so clear the form
        clearForm();
    } else {
        // Restore the user's data
        planData = JSON.parse(JSON.stringify(userDataBackup)); // Deep copy backup
        userDataBackup = null; // Clear backup
        
        // Populate the form with user's data
        populateForm();
    }
    
    // Update UI
    updateStepCompletion();
    updateProgress();
    setupCharacterCounts();
    
    // Hide "Your data" button and show "Load Sample Data" button
    var sampleDataBtn = document.querySelector('button[onclick="loadSampleData()"]');
    var yourDataBtnContainer = document.getElementById('yourDataButtonContainer');
    
    if (sampleDataBtn) {
        sampleDataBtn.style.display = 'inline-block';
    }
    
    if (yourDataBtnContainer) {
        yourDataBtnContainer.style.display = 'none';
    }
    
    // Save restored/cleared data
    saveData();
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
