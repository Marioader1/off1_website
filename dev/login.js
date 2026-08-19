const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : ((window.location.hostname.endsWith('github.io') || window.location.hostname.endsWith('vercel.app'))
        ? 'https://miasmatical-kellie-quartan.ngrok-free.dev'
        : window.location.origin);


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

            if (data.status === 'banned' || data.is_banned) {
                // Allow banned user to log in and see the dedicated Vanguard Ban Lockout Screen
                localStorage.setItem('off1_token', data.token || 'banned_session');
                localStorage.setItem('off1_username', data.username || username);
                localStorage.setItem('off1_is_banned', 'true');
                localStorage.setItem('off1_ban_reason', data.ban_reason || 'Enforced by Vanguard Defense Matrix');
                localStorage.setItem('off1_ban_duration', data.ban_duration || 'Active Enforcement');
                localStorage.setItem('off1_email', data.contact_email || '');
                localStorage.setItem('off1_is_admin', 'false');
                localStorage.setItem('off1_is_owner', 'false');
                localStorage.setItem('off1_role_rank', '0');
                window.location.href = window.location.pathname.includes('/dev/') ? '../index.html' : 'index.html';
                return;
            }

            if (response.ok && (data.status === 'success' || data.status === 'verification_required')) {
                if (isLogin) {
                    // Success Login
                    localStorage.setItem('off1_token', data.token);
                    localStorage.setItem('off1_username', username);
                    localStorage.setItem('off1_is_admin', data.is_admin);
                    localStorage.setItem('off1_is_owner', data.is_owner || false);
                    localStorage.setItem('off1_role_rank', data.role_rank || 0);
                    localStorage.setItem('off1_email', data.email || '');
                    localStorage.setItem('off1_pwned_count', data.pwned_count || 0);
                    localStorage.removeItem('off1_is_banned');
                    localStorage.removeItem('off1_ban_reason');
                    localStorage.removeItem('off1_ban_duration');
                    window.location.href = window.location.pathname.includes('/dev/') ? '../index.html' : 'index.html';
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

    function updateFormState() {
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

        // If error mentions ban from Vanguard Defense Matrix, auto-show the Ban Appeal form!
        const appealContainer = document.getElementById('ban-appeal-container');
        const appealReasonText = document.getElementById('appeal-ban-reason-text');
        if (msg && (msg.toLowerCase().includes('banned') || msg.toLowerCase().includes('vanguard') || msg.toLowerCase().includes('locked'))) {
            if (appealContainer) {
                appealContainer.classList.remove('d-none');
                if (appealReasonText) {
                    appealReasonText.innerHTML = `<strong>Active Enforcement:</strong> ${escapeHTML(msg)}<br><span style="color:#94a3b8; font-size:0.75rem;">Submit an appeal directly to the system owner with your explanation.</span>`;
                }
                const unameVal = usernameInput.value.trim();
                const emailInputElem = document.getElementById('appeal-contact-email');
                if (emailInputElem && !emailInputElem.value && emailInput && emailInput.value) {
                    emailInputElem.value = emailInput.value;
                }
            }
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Ban Appeal Submit Handler
    const btnSubmitAppeal = document.getElementById('btn-submit-appeal');
    if (btnSubmitAppeal) {
        btnSubmitAppeal.addEventListener('click', async () => {
            const statement = document.getElementById('appeal-statement').value.trim();
            const contactEmail = document.getElementById('appeal-contact-email').value.trim();
            const username = usernameInput.value.trim();
            const feedback = document.getElementById('appeal-feedback');

            if (!statement) {
                alert("Please enter a statement explaining why your ban should be reviewed.");
                return;
            }

            btnSubmitAppeal.disabled = true;
            btnSubmitAppeal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transmitting Appeal...';

            try {
                const res = await fetch(`${API_BASE_URL}/api/appeal/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({
                        entity_type: username ? 'account' : 'ip',
                        entity_id: username,
                        contact_email: contactEmail,
                        user_statement: statement
                    })
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    feedback.style.display = 'block';
                    feedback.style.color = '#10b981';
                    feedback.innerHTML = `✅ <strong>Appeal #${data.appeal_id || ''} Transmitted!</strong><br>The system owner has received your appeal along with your recent account action log.`;
                    btnSubmitAppeal.style.display = 'none';
                    document.getElementById('appeal-statement').disabled = true;
                } else {
                    feedback.style.display = 'block';
                    feedback.style.color = '#ef4444';
                    feedback.textContent = `❌ ${data.message || 'Failed to submit appeal.'}`;
                    btnSubmitAppeal.disabled = false;
                    btnSubmitAppeal.innerHTML = '<i class="fas fa-paper-plane"></i> Retry Appeal';
                }
            } catch (err) {
                feedback.style.display = 'block';
                feedback.style.color = '#ef4444';
                feedback.textContent = "❌ Connection failed. Could not transmit appeal.";
                btnSubmitAppeal.disabled = false;
                btnSubmitAppeal.innerHTML = '<i class="fas fa-paper-plane"></i> Retry Appeal';
            }
        });
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
