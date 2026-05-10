document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://miasmatical-kellie-quartan.ngrok-free.dev';
    
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
        sendResetBtn.textContent = 'Sending...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/forgot_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                forgotPwContainer.classList.add('d-none');
                loginForm.classList.remove('d-none');
            } else {
                showError(data.message);
            }
        } catch (e) {
            showError('Failed to contact server.');
        } finally {
            sendResetBtn.disabled = false;
            sendResetBtn.textContent = 'Send Reset Link';
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
