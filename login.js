const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://miasmatical-kellie-quartan.ngrok-free.dev';

document.addEventListener('DOMContentLoaded', () => {
    
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

    // Redirect if already logged in
    if (localStorage.getItem('off1_token')) {
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
        } else {
            submitBtn.textContent = 'Register';
            toggleText.textContent = "Already have an account? ";
            toggleLink.textContent = 'Login';
            formSubtitle.textContent = 'Join the Off1 ecosystem.';
            emailField.classList.remove('d-none');
            forgotPwLink.classList.add('d-none');
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
                alert("Reset code sent! Redirecting to reset page...");
                window.location.href = 'reset_password.html';
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
        } else {
            submitBtn.textContent = 'Register';
            toggleText.textContent = "Already have an account? ";
            toggleLink.textContent = 'Login';
            formSubtitle.textContent = 'Join the Off1 ecosystem.';
            emailField.classList.remove('d-none');
            forgotPwLink.classList.add('d-none');
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
            window.location.href = 'index.html';
        });
    }
});
