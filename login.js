const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : (window.location.hostname.endsWith('github.io')
        ? 'https://miasmatical-kellie-quartan.ngrok-free.dev'
        : window.location.origin);

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 🛠️ SYSTEM MAINTENANCE MODE CONTROLLER & INTERCEPTOR
    // =========================================================================
    // Dynamic styles for animations
    if (!document.getElementById('maintenance-styles')) {
        const style = document.createElement('style');
        style.id = 'maintenance-styles';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.03); opacity: 1; filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.6)); }
                100% { transform: scale(1); opacity: 0.9; }
            }
            @keyframes glow {
                0% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4), inset 0 0 4px rgba(245, 158, 11, 0.2); }
                50% { box-shadow: 0 0 16px rgba(245, 158, 11, 0.7), inset 0 0 8px rgba(245, 158, 11, 0.3); border-color: rgba(245, 158, 11, 0.8); }
                100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4), inset 0 0 4px rgba(245, 158, 11, 0.2); }
            }
        `;
        document.head.appendChild(style);
    }

    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 100000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 24px;
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #fff;
            border-radius: 8px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            border: 1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'};
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        toast.innerHTML = `${type === 'success' ? '🟢' : type === 'error' ? '🔴' : 'ℹ️'} ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    function showMaintenanceOverlay() {
        if (document.getElementById('maintenance-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'maintenance-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(10, 10, 10, 0.75); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
            z-index: 99999; display: flex; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif; color: #fff; text-align: center;
            opacity: 0; transition: opacity 0.5s ease;
        `;
        overlay.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12); padding: 40px; border-radius: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.65); max-width: 500px; width: 90%; transform: translateY(20px); transition: all 0.5s ease;">
                <div style="font-size: 72px; margin-bottom: 24px; animation: pulse 2s infinite; display: inline-block;">🛠️</div>
                <h1 style="font-size: 30px; font-weight: 700; margin-top: 0; margin-bottom: 16px; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">System Under Maintenance</h1>
                <p style="font-size: 15px; color: rgba(255, 255, 255, 0.65); line-height: 1.6; margin-bottom: 30px;">
                    We are currently executing essential backend maintenance. Standard operations have been temporarily suspended to ensure data consistency and system integrity.
                </p>
                <div style="font-size: 13px; color: rgba(255, 255, 255, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
                    Authorized team member? <a href="#" onclick="hideMaintenanceOverlay(); return false;" style="color: #f59e0b; text-decoration: none; font-weight: 600; border-bottom: 1px solid transparent; transition: all 0.2s;" onmouseover="this.style.borderBottom='1px solid #f59e0b'" onmouseout="this.style.borderBottom='1px solid transparent'">Go to Login Form</a>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.querySelector('div').style.transform = 'translateY(0)';
        }, 50);
    }

    window.hideMaintenanceOverlay = function() {
        const overlay = document.getElementById('maintenance-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.querySelector('div').style.transform = 'translateY(20px)';
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 500);
        }
    };

    function showAdminMaintenanceBadge() {
        if (document.getElementById('maintenance-badge')) return;
        const badge = document.createElement('div');
        badge.id = 'maintenance-badge';
        badge.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; z-index: 9999;
            background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            color: #f59e0b; padding: 10px 18px; border-radius: 50px;
            font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
            display: flex; align-items: center; gap: 8px;
            animation: glow 2s infinite; cursor: help;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            transition: all 0.3s ease;
        `;
        badge.title = "You are currently accessing the platform under Maintenance Mode Bypass. Some live changes might be in progress.";
        badge.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%; box-shadow: 0 0 8px #f59e0b;"></span>
            🛠️ Admin: Maintenance Bypass
        `;
        document.body.appendChild(badge);
    }

    function hideAdminMaintenanceBadge() {
        const badge = document.getElementById('maintenance-badge');
        if (badge) badge.remove();
    }

    // Intercept all fetch requests globally
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch(...args);
            if (response.status === 503) {
                const clone = response.clone();
                try {
                    const data = await clone.json();
                    if (data && data.error_type === 'maintenance') {
                        const is_admin = localStorage.getItem('off1_is_admin') === 'true';
                        const is_owner = localStorage.getItem('off1_is_owner') === 'true';
                        const role_rank = parseInt(localStorage.getItem('off1_role_rank') || '0', 10);
                        if (!(is_admin || is_owner || role_rank >= 1)) {
                            showMaintenanceOverlay();
                        }
                    }
                } catch(e) {}
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    // Sequential keyboard shortcut tracker for Ctrl + Shift + M, A, T
    let shortcutSequence = [];
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            const key = e.key.toLowerCase();
            if (key === 'm' || key === 'a' || key === 't') {
                if (key === 'm') {
                    shortcutSequence = ['m'];
                } else if (key === 'a' && shortcutSequence[0] === 'm' && shortcutSequence.length === 1) {
                    shortcutSequence.push('a');
                } else if (key === 't' && shortcutSequence[0] === 'm' && shortcutSequence[1] === 'a' && shortcutSequence.length === 2) {
                    shortcutSequence = [];
                    toggleMaintenanceMode();
                } else {
                    shortcutSequence = [];
                }
            } else {
                shortcutSequence = [];
            }
        } else {
            shortcutSequence = [];
        }
    });

    async function toggleMaintenanceMode() {
        const token = localStorage.getItem('off1_token');
        try {
            const res = await originalFetch(`${API_BASE_URL}/api/toggle_maintenance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token || ''
                },
                body: JSON.stringify({ token: token || '' })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                showToast(`System Maintenance: ${data.maintenance_mode ? 'ENABLED' : 'DISABLED'}`, 'success');
                checkMaintenanceStatus();
            } else {
                showToast(data.message || 'Failed to toggle maintenance mode.', 'error');
            }
        } catch (err) {
            console.error('Error toggling maintenance mode:', err);
            showToast('Network error while toggling maintenance mode.', 'error');
        }
    }

    async function checkMaintenanceStatus() {
        try {
            const res = await originalFetch(`${API_BASE_URL}/api/status`);
            if (!res.ok) {
                showMaintenanceOverlay();
                hideAdminMaintenanceBadge();
                return;
            }
            const data = await res.json();
            if (data.maintenance_mode) {
                const is_admin = localStorage.getItem('off1_is_admin') === 'true';
                const is_owner = localStorage.getItem('off1_is_owner') === 'true';
                const role_rank = parseInt(localStorage.getItem('off1_role_rank') || '0', 10);
                
                if (is_admin || is_owner || role_rank >= 1) {
                    showAdminMaintenanceBadge();
                    hideMaintenanceOverlay();
                } else {
                    showMaintenanceOverlay();
                    hideAdminMaintenanceBadge();
                }
            } else {
                hideMaintenanceOverlay();
                hideAdminMaintenanceBadge();
            }
        } catch (err) {
            console.error('Error checking maintenance status:', err);
            showMaintenanceOverlay();
            hideAdminMaintenanceBadge();
        }
    }

    // Initial check and periodic poll (every 15s)
    checkMaintenanceStatus();
    setInterval(checkMaintenanceStatus, 15000);

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-text');
    const formSubtitle = document.getElementById('form-subtitle');
    const emailField = document.getElementById('email-field');
    const emailInput = document.getElementById('email');
    const forgotPwLink = document.getElementById('forgot-password-link');
    const btnForgotPw = document.getElementById('btn-forgot-pw');
    const forgotPwContainer = document.getElementById('forgot-pw-container');
    const forgotEmailInput = document.getElementById('forgot-email');
    const sendResetBtn = document.getElementById('send-reset-btn');
    const backToLogin = document.getElementById('back-to-login');
    const errorMsg = document.getElementById('error-message');
    const verificationField = document.getElementById('verification-field');
    const verificationCodeInput = document.getElementById('verification-code');
    const verifyBtn = document.getElementById('verify-btn');
    const resendCodeBtn = document.getElementById('resend-code');
    const verifyEmailInfo = document.getElementById('verify-email-info');

    let isLogin = true;
    let isVerifying = false;

    // Password Requirements references
    const registerReqs = document.getElementById('register-password-requirements');
    const registerStrength = document.getElementById('register-strength-bar');
    const registerCriteria = {
        length: document.getElementById('req-length'),
        upper: document.getElementById('req-upper'),
        lower: document.getElementById('req-lower'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special')
    };

    function checkPasswordStrength(val) {
        const checks = {
            length: val.length >= 8,
            upper: /[A-Z]/.test(val),
            lower: /[a-z]/.test(val),
            number: /[0-9]/.test(val),
            special: /[^a-zA-Z0-9]/.test(val)
        };

        let metCount = 0;
        for (const [key, met] of Object.entries(checks)) {
            const el = registerCriteria[key];
            if (el) {
                const icon = el.querySelector('i');
                if (met) {
                    el.classList.add('met');
                    if (icon) icon.className = 'fas fa-check-circle';
                    metCount++;
                } else {
                    el.classList.remove('met');
                    if (icon) icon.className = 'far fa-circle';
                }
            }
        }

        if (registerStrength) {
            const pct = (metCount / 5) * 100;
            registerStrength.style.width = `${pct}%`;
            if (metCount <= 2) {
                registerStrength.style.backgroundColor = '#ef4444';
            } else if (metCount <= 4) {
                registerStrength.style.backgroundColor = '#fbbf24';
            } else {
                registerStrength.style.backgroundColor = '#10b981';
            }
        }

        return metCount === 5;
    }

    passwordInput.addEventListener('focus', () => {
        if (!isLogin && !isVerifying) {
            registerReqs.classList.add('visible');
            registerReqs.classList.remove('hidden');
        }
    });

    passwordInput.addEventListener('blur', () => {
        if (passwordInput.value.length === 0) {
            registerReqs.classList.remove('visible');
            registerReqs.classList.add('hidden');
        }
    });

    passwordInput.addEventListener('input', () => {
        if (!isLogin && !isVerifying) {
            registerReqs.classList.add('visible');
            registerReqs.classList.remove('hidden');
            checkPasswordStrength(passwordInput.value);
        }
    });

    // Redirect if already logged in (and not a Guest)
    const token = localStorage.getItem('off1_token');
    const username = localStorage.getItem('off1_username');
    if (token && username && username !== 'Guest') {
        window.location.href = 'index.html';
    }

    toggleLink.addEventListener('click', () => {
        isLogin = !isLogin;
        isVerifying = false;
        errorMsg.classList.add('d-none');
        forgotPwContainer.classList.add('d-none');
        verificationField.classList.add('d-none');
        loginForm.classList.remove('d-none');
        
        // Reset inputs visibility
        usernameInput.parentElement.classList.remove('d-none');
        passwordInput.parentElement.classList.remove('d-none');
        emailInput.parentElement.classList.remove('d-none');

        if (isLogin) {
            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account? ";
            toggleLink.textContent = 'Register';
            formSubtitle.textContent = 'Welcome back, system online.';
            emailField.classList.add('d-none');
            forgotPwLink.classList.remove('d-none');
            
            // Hide requirements on login mode
            registerReqs.classList.remove('visible');
            registerReqs.classList.add('hidden');
        } else {
            submitBtn.textContent = 'Register';
            toggleText.textContent = "Already have an account? ";
            toggleLink.textContent = 'Login';
            formSubtitle.textContent = 'Join the Off1 ecosystem.';
            emailField.classList.remove('d-none');
            forgotPwLink.classList.add('d-none');
            
            // Show requirements on registration mode if focused or typed
            if (passwordInput.value.length > 0) {
                registerReqs.classList.add('visible');
                registerReqs.classList.remove('hidden');
                checkPasswordStrength(passwordInput.value);
            }
        }
    });

    btnForgotPw.addEventListener('click', () => {
        loginForm.classList.add('d-none');
        forgotPwContainer.classList.remove('d-none');
    });

    backToLogin.addEventListener('click', () => {
        forgotPwContainer.classList.add('d-none');
        loginForm.classList.remove('d-none');
    });

    sendResetBtn.addEventListener('click', async () => {
        const email = forgotEmailInput.value.trim();
        if (!email) return;

        sendResetBtn.disabled = true;
        sendResetBtn.textContent = 'Sending Code...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/forgot_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                alert("A secure password reset link has been sent to your email. Please check your inbox and click the link to reset your password.");
                forgotPwContainer.classList.add('d-none');
                loginForm.classList.remove('d-none');
            } else {
                showError(data.message);
            }
        } catch (e) {
            showError('Failed to contact server.');
        } finally {
            sendResetBtn.disabled = false;
            sendResetBtn.textContent = 'Send Reset Code';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!username || !password) return;

        if (!isLogin) {
            if (!checkPasswordStrength(password)) {
                showError("Password does not meet all strength requirements.");
                return;
            }
        }

        // If we are in verifying mode, handle verification instead
        if (isVerifying) {
            handleVerification(username);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isLogin ? 'Logging in...' : 'Registering...';
        errorMsg.classList.add('d-none');

        const endpoint = isLogin ? '/api/login' : '/api/register';
        const payload = { username, password };
        if (!isLogin) payload.email = email;

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && (data.status === 'success' || data.status === 'verification_required')) {
                if (isLogin) {
                    // Success Login
                    // Success Login
                    localStorage.setItem('off1_token', data.token);
                    localStorage.setItem('off1_username', username);
                    localStorage.setItem('off1_is_admin', data.is_admin);
                    localStorage.setItem('off1_is_owner', data.is_owner || false);
                    localStorage.setItem('off1_role_rank', data.role_rank || 0);
                    localStorage.setItem('off1_email', data.email || '');
                    localStorage.setItem('off1_pwned_count', data.pwned_count || 0);
                    window.location.href = 'index.html';
                } else if (data.status === 'verification_required') {
                    // Enter Verification State
                    isVerifying = true;
                    verificationField.classList.remove('d-none');
                    verifyEmailInfo.textContent = `Code sent to: ${email}`;
                    submitBtn.textContent = 'Verify Account';
                    formSubtitle.textContent = 'Please verify your email to continue.';
                    
                    // Optional: Hide username/password/email fields to focus on code
                    // usernameInput.parentElement.classList.add('d-none');
                    // passwordInput.parentElement.classList.add('d-none');
                    // emailInput.parentElement.classList.add('d-none');
                } else {
                    // Success Register -> Switch to login (Legacy fallback)
                    isLogin = true;
                    isVerifying = false;
                    updateToggleUI();
                    formSubtitle.textContent = 'Account created! Please login.';
                    formSubtitle.style.color = '#10b981';
                    passwordInput.value = '';
                }
            } else {
                showError(data.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            showError('Server connection failed. Check your backend.');
        } finally {
            submitBtn.disabled = false;
            if (!isVerifying) {
                if (submitBtn.textContent !== 'Login' && isLogin) submitBtn.textContent = 'Login';
                if (submitBtn.textContent !== 'Register' && !isLogin) submitBtn.textContent = 'Register';
            }
        }
    });

    async function handleVerification(username) {
        const code = verificationCodeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            showError('Please enter the 6-character code.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/verify_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ username, code })
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                isLogin = true;
                isVerifying = false;
                verificationField.classList.add('d-none');
                updateToggleUI();
                formSubtitle.textContent = 'Verification successful! Please login.';
                formSubtitle.style.color = '#10b981';
                alert('Account verified successfully! You can now login.');
            } else {
                showError(data.message || 'Invalid code. Please try again.');
            }
        } catch (e) {
            showError('Connection error during verification.');
        } finally {
            submitBtn.disabled = false;
            if (isVerifying) submitBtn.textContent = 'Verify Account';
        }
    }

    resendCodeBtn.addEventListener('click', async () => {
        // Just trigger register again (it will generate a new code and send email)
        isVerifying = false;
        loginForm.dispatchEvent(new Event('submit'));
    });

    function updateToggleUI() {
        if (isLogin) {
            submitBtn.textContent = 'Login';
            toggleText.textContent = "Don't have an account? ";
            toggleLink.textContent = 'Register';
            formSubtitle.textContent = 'Welcome back, system online.';
            emailField.classList.add('d-none');
            forgotPwLink.classList.remove('d-none');
            
            // Hide requirements on login mode
            registerReqs.classList.remove('visible');
            registerReqs.classList.add('hidden');
        } else {
            submitBtn.textContent = 'Register';
            toggleText.textContent = "Already have an account? ";
            toggleLink.textContent = 'Login';
            formSubtitle.textContent = 'Join the Off1 ecosystem.';
            emailField.classList.remove('d-none');
            forgotPwLink.classList.add('d-none');
            
            // Show requirements on registration mode if focused or typed
            if (passwordInput.value.length > 0) {
                registerReqs.classList.add('visible');
                registerReqs.classList.remove('hidden');
                checkPasswordStrength(passwordInput.value);
            }
        }
    }

    function showError(msg) {
        errorMsg.textContent = `❌ ${msg}`;
        errorMsg.classList.remove('d-none');
    }

});

// --- Passkey (WebAuthn) Login Implementation ---

async function loginWithPasskey() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    
    if (!username) {
        const errorMsg = document.getElementById('error-message');
        errorMsg.textContent = "❌ Please enter your username first to use a Passkey.";
        errorMsg.classList.remove('d-none');
        usernameInput.focus();
        return;
    }

    const btn = document.getElementById('btn-passkey-login');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        // 1. Get authentication options from server
        const resp = await fetch(`${API_BASE_URL}/api/passkey/login/begin`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ username })
        });

        const options = await resp.json();
        if (options.status === 'error') throw new Error(options.message);

        // 2. Adjust options for navigator.credentials.get
        options.challenge = bufferFromBase64Url(options.challenge);
        if (options.allowCredentials) {
            options.allowCredentials.forEach(cred => {
                cred.id = bufferFromBase64Url(cred.id);
            });
        }

        // 3. Get assertion
        const assertion = await navigator.credentials.get({ publicKey: options });

        // 4. Send back to server
        const completeResp = await fetch(`${API_BASE_URL}/api/passkey/login/complete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                username,
                credential: {
                    id: assertion.id,
                    rawId: base64UrlFromBuffer(assertion.rawId),
                    response: {
                        authenticatorData: base64UrlFromBuffer(assertion.response.authenticatorData),
                        clientDataJSON: base64UrlFromBuffer(assertion.response.clientDataJSON),
                        signature: base64UrlFromBuffer(assertion.response.signature),
                        userHandle: assertion.response.userHandle ? base64UrlFromBuffer(assertion.response.userHandle) : null
                    },
                    type: assertion.type
                }
            })
        });

        const result = await completeResp.json();
        if (result.status === 'success') {
            // Success! Store user info and redirect
            localStorage.setItem('off1_username', username);
            localStorage.setItem('off1_token', result.token);
            localStorage.setItem('off1_is_admin', result.is_admin);
            localStorage.setItem('off1_is_owner', result.is_owner);
            localStorage.setItem('off1_role_rank', result.role_rank);
            localStorage.setItem('off1_email', result.email);
            localStorage.setItem('off1_pwned_count', result.pwned_count || 0);
            
            window.location.href = 'index.html';
        } else {
            throw new Error(result.message);
        }

    } catch (err) {
        console.error("Passkey Login Error:", err);
        const errorMsg = document.getElementById('error-message');
        errorMsg.textContent = `❌ ${err.message || "Passkey authentication failed."}`;
        errorMsg.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Reuse base64 helpers
function base64UrlFromBuffer(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function bufferFromBase64Url(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
}

document.addEventListener('DOMContentLoaded', () => {
    const passkeyBtn = document.getElementById('btn-passkey-login');
    if (passkeyBtn) {
        passkeyBtn.addEventListener('click', loginWithPasskey);
    }
    
    const guestBtn = document.getElementById('btn-guest-login');
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            localStorage.setItem('off1_username', 'Guest');
            localStorage.setItem('off1_token', 'guest_session');
            localStorage.setItem('off1_role_rank', '0');
            localStorage.setItem('off1_is_admin', 'false');
            localStorage.setItem('off1_is_owner', 'false');
            localStorage.setItem('off1_pwned_count', '0');
            window.location.href = 'index.html';
        });
    }
});
