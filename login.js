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

    let isLogin = true;

    // Redirect if already logged in
    if (localStorage.getItem('off1_token')) {
        window.location.href = 'index.html';
    }

    toggleLink.addEventListener('click', () => {
        isLogin = !isLogin;
        errorMsg.classList.add('d-none');
        forgotPwContainer.classList.add('d-none');
        loginForm.classList.remove('d-none');

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
        
        if (!username || !password) return;

        submitBtn.disabled = true;
        submitBtn.textContent = isLogin ? 'Logging in...' : 'Registering...';
        errorMsg.classList.add('d-none');

        const endpoint = isLogin ? '/api/login' : '/api/register';
        const payload = { username, password };
        if (!isLogin) payload.email = emailInput.value.trim();

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

            if (response.ok && data.status === 'success') {
                if (isLogin) {
                    // Success Login
                    localStorage.setItem('off1_token', data.token);
                    localStorage.setItem('off1_username', username);
                    localStorage.setItem('off1_is_admin', data.is_admin);
                    localStorage.setItem('off1_is_owner', data.is_owner || false);
                    localStorage.setItem('off1_role_rank', data.role_rank || 0);
                    localStorage.setItem('off1_email', data.email || '');
                    window.location.href = 'index.html';
                } else {
                    // Success Register -> Switch to login
                    isLogin = true;
                    submitBtn.textContent = 'Login';
                    toggleText.textContent = "Don't have an account? ";
                    toggleLink.textContent = 'Register';
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
            if (submitBtn.textContent !== 'Login' && isLogin) submitBtn.textContent = 'Login';
            if (submitBtn.textContent !== 'Register' && !isLogin) submitBtn.textContent = 'Register';
        }
    });

    function showError(msg) {
        errorMsg.textContent = `❌ ${msg}`;
        errorMsg.classList.remove('d-none');
    }
});
