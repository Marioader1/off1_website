document.addEventListener('DOMContentLoaded', () => {
    // 🌐 Configuration: Change this to your ngrok URL for external testing
    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : ((window.location.hostname.endsWith('github.io') || window.location.hostname.endsWith('vercel.app'))
            ? 'https://miasmatical-kellie-quartan.ngrok-free.dev'
            : window.location.origin);



    let selectedFiles = [];

    // Auth Check
    let token = localStorage.getItem('off1_token');
    let currentUser = localStorage.getItem('off1_username');
    if (!token || !currentUser) {
        localStorage.setItem('off1_username', 'Guest');
        localStorage.setItem('off1_token', 'guest_session');
        localStorage.setItem('off1_role_rank', '0');
        localStorage.setItem('off1_is_admin', 'false');
        localStorage.setItem('off1_is_owner', 'false');
        token = 'guest_session';
        currentUser = 'Guest';
    }

    // UI Elements (Declared at top to avoid hoisting / Temporal Dead Zone ReferenceErrors)
    const displayUsername = document.getElementById('display-username');
    const userInitial = document.getElementById('user-initials');
    const emailStatus = document.getElementById('email-status');
    const logoutBtn = document.getElementById('logout-btn');

    function updateUserHeader() {
        const currentU = localStorage.getItem('off1_username') || 'Guest';
        if (displayUsername && currentU) {
            if (userInitial) userInitial.textContent = currentU.charAt(0).toUpperCase();
            
            const userEmail = localStorage.getItem('off1_email');
            const roleRank = parseInt(localStorage.getItem('off1_role_rank') || '0');

            if (currentU === 'Guest') {
                displayUsername.textContent = 'Guest';
                if (emailStatus) emailStatus.textContent = '';
            } else {
                if (roleRank === 2) {
                    displayUsername.innerHTML = `${currentU} <span class="owner-badge">OWNER ⭐</span>`;
                } else if (roleRank === 1) {
                    displayUsername.innerHTML = `${currentU} <span class="admin-badge">ADMIN 👑</span>`;
                } else {
                    displayUsername.textContent = currentU;
                }

                if (!userEmail || userEmail === '') {
                    if (emailStatus) {
                        emailStatus.innerHTML = '<span class="email-warning" id="setup-email-btn">Set up email</span>';
                        const setupBtn = document.getElementById('setup-email-btn');
                        if (setupBtn) {
                            setupBtn.addEventListener('click', () => {
                                const newEmail = prompt('Please enter your email to secure your account and allow password resets:');
                                if (newEmail && newEmail.includes('@')) {
                                    updateUserEmail(newEmail);
                                }
                            });
                        }
                    }
                } else {
                    if (emailStatus) {
                        emailStatus.textContent = 'Email Verified ✓';
                        emailStatus.style.color = '#10b981';
                    }
                }
            }
        }
    }
    updateUserHeader();

    // New v0.8.0 Elements
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const attachmentBtn = document.getElementById('attachment-btn');
    const fileUploadInput = document.getElementById('file-upload-input');
    const micBtn = document.getElementById('mic-btn');
    const btnChangelog = document.getElementById('btn-changelog');
    const changelogModal = document.getElementById('changelog-modal');
    const btnCloseChangelog = document.getElementById('btn-close-changelog');
    const privacyModal = document.getElementById('privacy-modal');
    const btnAcceptPrivacy = document.getElementById('btn-accept-privacy');

    // Policy Check
    const POLICY_VERSION = "1.0";
    if (localStorage.getItem('off1_policy_version') !== POLICY_VERSION) {
        if (privacyModal) privacyModal.classList.remove('hidden');
    }

    // Theme Load
    if (localStorage.getItem('off1_light_mode') === 'true') {
        document.body.classList.add('light-mode');
    }

    // Apple iOS Standalone PWA Promotion Banner
    const iosInstallBanner = document.getElementById('ios-install-banner');
    const closeIosInstallBtn = document.getElementById('close-ios-install');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isIosDismissed = localStorage.getItem('off1_ios_pwa_dismissed') === 'true';

    if (isIOS && !isStandalone && !isIosDismissed && iosInstallBanner) {
        setTimeout(() => {
            iosInstallBanner.classList.remove('hidden');
        }, 2500);
    }

    if (closeIosInstallBtn && iosInstallBanner) {
        closeIosInstallBtn.onclick = () => {
            iosInstallBanner.classList.add('hidden');
            localStorage.setItem('off1_ios_pwa_dismissed', 'true');
        };
    }

    const btnAdmin = document.getElementById('btn-admin');
    const adminModal = document.getElementById('admin-modal');
    const closeAdminBtn = document.getElementById('close-admin-btn');

    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsForm = document.getElementById('settings-form');

    const btnHistory = document.getElementById('btn-history');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historySessionList = document.getElementById('history-session-list');

    const busyModal = document.getElementById('busy-modal-overlay');
    const busyWatchAdBtn = document.getElementById('busy-watch-ad');
    const busyCloseBtn = document.getElementById('busy-close');

    const runClientTestBtn = document.getElementById('run-client-test-btn');
    const clientTestStatus = document.getElementById('client-test-status');
    const clientTestResults = document.getElementById('client-test-results');

    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatHistory = document.getElementById('chat-history');


    function checkAndShowPwnedWarning() {
        const container = document.getElementById('pwned-warning-container');
        if (!container) return;
        
        const username = localStorage.getItem('off1_username');
        if (username === 'Guest') {
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }

        const count = parseInt(localStorage.getItem('off1_pwned_count') || '0');
        if (count > 0) {
            container.innerHTML = `
                <div class="pwned-warning-banner">
                    <div class="pwned-warning-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>This password has been seen ${count} times before in data breaches!</span>
                    </div>
                    <div class="pwned-warning-body">This password has previously appeared in a data breach and should never be used. If you've ever used it anywhere before, change it immediately!</div>
                </div>
            `;
            container.classList.remove('hidden');
        } else {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
    }

    // Role Sync: Check server for latest admin/owner status in background
    async function syncUserRole() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ username: currentUser, token: token, auto_sync: true }) 
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.setItem('off1_username', 'Guest');
                localStorage.setItem('off1_token', 'guest_session');
                localStorage.setItem('off1_role_rank', '0');
                localStorage.setItem('off1_is_admin', 'false');
                localStorage.setItem('off1_is_owner', 'false');
                localStorage.setItem('off1_pwned_count', '0');
                localStorage.removeItem('off1_email');
                currentUser = 'Guest';
                token = 'guest_session';
                
                if (window.location.pathname.includes('/dev/')) {
                    alert("Your access has been invalidated or expired. Redirecting to login...");
                    window.location.href = '../login.html';
                    return;
                }
                
                if (btnSettings) btnSettings.style.display = 'none';
                if (btnHistory) btnHistory.style.display = 'none';
                if (btnAdmin) btnAdmin.style.display = 'none';
                if (logoutBtn) {
                    logoutBtn.querySelector('span').textContent = 'Login';
                    logoutBtn.classList.remove('text-danger');
                }
                updateUserHeader();
                checkAndShowPwnedWarning();
                return;
            }
            const data = await res.json();
            if (data.status === 'success') {
                const oldRank = localStorage.getItem('off1_role_rank');
                
                localStorage.setItem('off1_is_admin', data.is_admin);
                localStorage.setItem('off1_is_owner', data.is_owner || false);
                localStorage.setItem('off1_role_rank', data.role_rank || 0);
                localStorage.setItem('off1_email', data.email || '');
                localStorage.setItem('off1_pwned_count', data.pwned_count || 0);

                checkAndShowPwnedWarning();

                // If rank changed, reload to unlock the UI
                if (String(data.role_rank) !== oldRank) {
                    window.location.reload();
                }
            }
        } catch (e) { console.warn("Role sync failed", e); }
    }
    if (currentUser !== 'Guest') {
        syncUserRole(); // Run silently in background
    }

    // Update Notification & Version Logic
    const LATEST_VERSION = '0.8.1'; 
    const storedVersion = localStorage.getItem('off1_version');
    const updateBanner = document.getElementById('update-banner');
    const versionDisplay = document.getElementById('platform-version');

    if (versionDisplay) versionDisplay.textContent = LATEST_VERSION;

    if (storedVersion && storedVersion !== LATEST_VERSION) {
        if (updateBanner) updateBanner.classList.remove('hidden');
    } else {
        // If versions match or it's first time, ensure banner is hidden
        if (updateBanner) updateBanner.classList.add('hidden');
    }
    
    // Always update to latest to prevent repeated banners
    localStorage.setItem('off1_version', LATEST_VERSION);



    // Display username in UI if possible (optional)
    console.log(`Logged in as: ${currentUser}`);

    function updateGuestUI() {
        const currentU = localStorage.getItem('off1_username') || 'Guest';
        if (currentU === 'Guest') {
            if (btnSettings) btnSettings.style.display = 'none';
            if (btnHistory) btnHistory.style.display = 'none';
            if (btnAdmin) btnAdmin.style.display = 'none';
            if (logoutBtn) {
                logoutBtn.querySelector('span').textContent = 'Login';
                logoutBtn.classList.remove('text-danger');
                logoutBtn.classList.add('text-success');
            }
        } else {
            if (btnSettings) btnSettings.style.display = '';
            if (btnHistory) btnHistory.style.display = '';
            const roleRank = parseInt(localStorage.getItem('off1_role_rank') || '0');
            if (roleRank >= 1 && btnAdmin) {
                btnAdmin.style.display = '';
                btnAdmin.classList.remove('d-none');
                btnAdmin.classList.remove('hidden');
            } else {
                if (btnAdmin) btnAdmin.style.display = 'none';
            }
            if (logoutBtn) {
                logoutBtn.querySelector('span').textContent = 'Logout';
                logoutBtn.classList.add('text-danger');
                logoutBtn.classList.remove('text-success');
            }
        }
    }
    updateGuestUI();
    checkAndShowPwnedWarning();

    // Logout/Login functionality

    function performLogout(silent = false) {
        // Revert back to Guest mode without losing chat context
        localStorage.setItem('off1_username', 'Guest');
        localStorage.setItem('off1_token', 'guest_session');
        localStorage.setItem('off1_role_rank', '0');
        localStorage.setItem('off1_is_admin', 'false');
        localStorage.setItem('off1_is_owner', 'false');
        localStorage.setItem('off1_pwned_count', '0');
        localStorage.removeItem('off1_email');
        currentUser = 'Guest';
        token = 'guest_session';
        
        // Hide modals
        if (settingsModal) settingsModal.classList.add('hidden');
        if (adminModal) adminModal.classList.add('hidden');
        if (historyModal) historyModal.classList.add('hidden');
        
        if (window.location.pathname.includes('/dev/')) {
            if (!silent) {
                alert("You have successfully logged out. Redirecting to login...");
            }
            window.location.href = '../login.html';
        } else {
            updateGuestUI();
            checkAndShowPwnedWarning();
            updateUserHeader();
            
            if (!silent) {
                alert("You have successfully logged out. Back in Guest mode!");
            }
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const currentU = localStorage.getItem('off1_username') || 'Guest';
            if (currentU === 'Guest') {
                // Redirect to login page
                window.location.href = window.location.pathname.includes('/dev/') ? '../login.html' : 'login.html';
            } else {
                performLogout();
            }
        });
    }

    // Account Deletion Flow
    const btnDeleteAccount = document.getElementById('btn-delete-account');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const deleteTitle = document.getElementById('delete-warning-title');
    const deleteText = document.getElementById('delete-warning-text');
    const deleteYesBtn = document.getElementById('delete-yes');
    const deleteNoBtn = document.getElementById('delete-no');
    const deleteActions = document.getElementById('delete-modal-actions');

    let deleteStep = 0;

    if (btnDeleteAccount) {
        btnDeleteAccount.addEventListener('click', () => {
            deleteStep = 1;
            settingsModal.classList.add('hidden');
            deleteModal.classList.remove('hidden');
            updateDeleteModal();
        });
    }

    if (deleteNoBtn) {
        deleteNoBtn.addEventListener('click', () => {
            if (deleteModal) deleteModal.classList.add('hidden');
            deleteStep = 0;
        });
    }

    if (deleteYesBtn) {
        deleteYesBtn.addEventListener('click', async () => {
            if (deleteStep < 3) {
                deleteStep++;
                updateDeleteModal();
            } else {
                // Final Step - Perform Deletion
                deleteYesBtn.disabled = true;
                deleteYesBtn.textContent = 'Deleting...';
                try {
                    const response = await fetch(`${API_BASE_URL}/api/delete_account`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                        body: JSON.stringify({ username: currentUser })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Your account has been deleted.');
                        performLogout(true);
                    } else {
                        alert('Error: ' + data.message);
                        if (deleteModal) deleteModal.classList.add('hidden');
                    }
                } catch (e) {
                    alert('Connection failed.');
                    if (deleteModal) deleteModal.classList.add('hidden');
                } finally {
                    deleteYesBtn.disabled = false;
                }
            }
        });
    }

    function updateDeleteModal() {
        // Reset button order to default first
        deleteActions.style.flexDirection = 'row';
        deleteNoBtn.style.order = '1';
        deleteYesBtn.style.order = '2';

        if (deleteStep === 1) {
            deleteTitle.textContent = 'Wait!';
            deleteTitle.style.color = '#fbbf24'; // Yellow
            deleteText.textContent = 'Are you absolutely sure you want to delete your account? This cannot be undone.';
            deleteYesBtn.textContent = 'Yes, I am sure';
            deleteNoBtn.textContent = 'No, take me back';
        } else if (deleteStep === 2) {
            deleteTitle.textContent = 'CRITICAL WARNING';
            deleteTitle.style.color = '#f87171'; // Lighter Red
            deleteText.textContent = 'ALL your chat history, settings, and personal memory will be WIPED FOREVER. Continue?';
            deleteYesBtn.textContent = 'I understand, continue';
            deleteNoBtn.textContent = 'Stop! Keep my data';
        } else if (deleteStep === 3) {
            deleteTitle.textContent = 'FINAL CONFIRMATION';
            deleteTitle.style.color = '#ef4444'; // Pure Red
            deleteText.textContent = 'Last chance. To confirm you REALLY want to do this, we moved the button. Click the left button to delete.';
            deleteYesBtn.textContent = 'PERMANENTLY DELETE';
            deleteNoBtn.textContent = 'CANCEL';
            
            // SWAP POSITIONS: Yes on Left, No on Right
            deleteYesBtn.style.order = '1';
            deleteNoBtn.style.order = '2';
        }
    }

    function updateUserHeader() {
        const currentU = localStorage.getItem('off1_username') || 'Guest';
        if (displayUsername && currentU) {
            userInitial.textContent = currentU.charAt(0).toUpperCase();
            
            const userEmail = localStorage.getItem('off1_email');
            const roleRank = parseInt(localStorage.getItem('off1_role_rank') || '0');

            if (currentU === 'Guest') {
                displayUsername.textContent = 'Guest';
                emailStatus.textContent = '';
            } else {
                if (roleRank === 2) {
                    displayUsername.innerHTML = `${currentU} <span class="owner-badge">OWNER ⭐</span>`;
                } else if (roleRank === 1) {
                    displayUsername.innerHTML = `${currentU} <span class="admin-badge">ADMIN 👑</span>`;
                } else {
                    displayUsername.textContent = currentU;
                }

                if (!userEmail || userEmail === '') {
                    emailStatus.innerHTML = '<span class="email-warning" id="setup-email-btn">Set up email</span>';
                    const setupBtn = document.getElementById('setup-email-btn');
                    if (setupBtn) {
                        setupBtn.addEventListener('click', () => {
                            const newEmail = prompt('Please enter your email to secure your account and allow password resets:');
                            if (newEmail && newEmail.includes('@')) {
                                updateUserEmail(newEmail);
                            }
                        });
                    }
                } else {
                    emailStatus.textContent = 'Email Verified ✓';
                    emailStatus.style.color = '#10b981';
                }
            }
        }
    }
    updateUserHeader();


    async function updateUserEmail(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/update_user_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ username: currentUser, email: email })
            });
            if (response.ok) {
                localStorage.setItem('off1_email', email);
                emailStatus.textContent = 'Email Verified ✓';
                emailStatus.style.color = '#10b981';
            } else {
                alert('Failed to update email. Please try again.');
            }
        } catch (e) {
            console.error('Email update error:', e);
        }
    }

    // Focus input on load
    userInput.focus();

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Desktop Sidebar Toggle
    const desktopToggleBtn = document.getElementById('sidebar-toggle-desktop');
    if (desktopToggleBtn && sidebar) {
        desktopToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Save state
            localStorage.setItem('off1_sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });

        // Restore state
        if (localStorage.getItem('off1_sidebar_collapsed') === 'true' && window.innerWidth > 768) {
            sidebar.classList.add('collapsed');
        }
    }

    // Safety Keywords Filter
    const SENSITIVE_KEYWORDS = [
        'dangerous', 'illegal', 'hack', 'steal', 'rob', 'kill', 'weapon', 'drug', 'bomb', 
        'exploit', 'malware', 'false', 'lie', 'fake', 'scam', 'darkweb', 'tor', 'violence',
        'harmful', 'illegal', 'fraud', 'phishing',
        "can't help you", "cannot help you", "assist you with that"
    ];

    function checkSafety(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        return SENSITIVE_KEYWORDS.some(word => lower.includes(word));
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const message = userInput.value.trim();
        const hasFile = selectedFiles && selectedFiles.length > 0;
        
        if (!message && !hasFile) return;

        let messageWithFile = message;
        if (hasFile) {
            selectedFiles.forEach(file => {
                messageWithFile += (messageWithFile ? '\n' : '') + `[User uploaded a file: ${file.name}]`;
            });
        }

        // 1. Add user message to UI
        appendMessage('user', messageWithFile);

        // Clear input & reset height
        userInput.value = '';
        userInput.style.height = 'auto';

        // 2. Fetch real AI response
        fetchAIResponse(message);
    });

    // Global helpers for copy button & image lightbox
    window.copyCodeFromBtn = function(btn) {
        const code = decodeURIComponent(btn.getAttribute('data-code') || '');
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            btn.classList.add('copied');
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        }).catch(err => {
            console.error("Clipboard copy failed", err);
        });
    };

    window.openImageLightbox = function(src) {
        const lightboxModal = document.getElementById('image-lightbox-modal');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
        const lightboxCopyBtn = document.getElementById('lightbox-copy-btn');
        if (!lightboxModal || !lightboxImg) return;

        lightboxImg.src = src;
        if (lightboxDownloadBtn) lightboxDownloadBtn.href = src;
        if (lightboxCopyBtn) {
            lightboxCopyBtn.onclick = () => {
                const fullUrl = src.startsWith('http') ? src : (window.location.origin + src);
                navigator.clipboard.writeText(fullUrl).then(() => {
                    lightboxCopyBtn.innerHTML = '<i class="fas fa-check"></i> Copied Link!';
                    setTimeout(() => {
                        lightboxCopyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Image Link';
                    }, 2000);
                });
            };
        }
        lightboxModal.classList.remove('hidden');
    };

    function formatMessageContent(rawText) {
        if (!rawText) return '';

        let formatted = rawText;

        // 1. Process Completed Thinking / Reasoning blocks <think>...</think>
        formatted = formatted.replace(/<think>([\s\S]*?)<\/think>/gi, (match, thought) => {
            const trimmedThought = thought.trim();
            if (!trimmedThought) return '';
            return `
                <details class="thought-accordion">
                    <summary class="thought-summary">
                        <span>💭 Thinking Process</span>
                        <i class="fas fa-chevron-down" style="font-size:0.75rem;"></i>
                    </summary>
                    <div class="thought-content">${escapeHTML(trimmedThought)}</div>
                </details>
            `;
        });

        // 1b. Handle In-Flight / Active Streaming <think> tag (not yet closed)
        if (formatted.includes('<think>') && !formatted.includes('</think>')) {
            const thinkIndex = formatted.indexOf('<think>');
            const beforeThink = formatted.substring(0, thinkIndex);
            const liveThought = formatted.substring(thinkIndex + 7).trim();
            formatted = beforeThink + `
                <details class="thought-accordion" open>
                    <summary class="thought-summary">
                        <span>💭 Thinking in progress...</span>
                        <i class="fas fa-spinner fa-spin" style="font-size:0.75rem;"></i>
                    </summary>
                    <div class="thought-content">${escapeHTML(liveThought)}</div>
                </details>
            `;
        }

        // 2. Handle In-Flight / Streaming unclosed code fence
        const codeFenceCount = (formatted.match(/```/g) || []).length;
        if (codeFenceCount % 2 === 1) {
            formatted += '\n```';
        }

        // 2b. Process Code Blocks ```lang ... ```
        formatted = formatted.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang.trim() || 'code';
            const cleanCode = code.replace(/\n$/, '');
            const encodedCode = encodeURIComponent(cleanCode);
            return `
                <div class="code-block-wrapper">
                    <div class="code-header">
                        <span>${escapeHTML(language)}</span>
                        <button type="button" class="copy-code-btn" data-code="${encodedCode}" onclick="copyCodeFromBtn(this)">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre><code>${escapeHTML(cleanCode)}</code></pre>
                </div>
            `;
        });

        // 3. Process Markdown Images ![alt](url)
        formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
            const cleanUrl = url.trim();
            const cleanAlt = escapeHTML(alt.trim() || 'AI Generated Image');
            return `<img src="${cleanUrl}" alt="${cleanAlt}" class="chat-gen-img" loading="lazy" onclick="openImageLightbox('${cleanUrl}')" />`;
        });

        // 4. Process Inline Code `code`
        formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
            return `<code style="background:rgba(255,255,255,0.1); padding:0.15rem 0.4rem; border-radius:4px; font-family:monospace; font-size:0.9em;">${escapeHTML(code)}</code>`;
        });

        // 5. Bold & Italic
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // 6. Markdown Links [text](url)
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            const cleanUrl = url.trim();
            if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('/')) {
                return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-color); text-decoration:underline;">${escapeHTML(text)}</a>`;
            }
            return escapeHTML(match);
        });

        // 7. Split by blocks so we convert plain text newlines to <br> without breaking code blocks or accordions
        const parts = formatted.split(/(<div class="code-block-wrapper">[\s\S]*?<\/div>|<details class="thought-accordion">[\s\S]*?<\/details>|<img[^>]+>)/g);
        for (let i = 0; i < parts.length; i++) {
            if (!parts[i].startsWith('<div class="code-block-wrapper">') && 
                !parts[i].startsWith('<details class="thought-accordion">') &&
                !parts[i].startsWith('<img')) {
                parts[i] = parts[i].replace(/\n/g, '<br>');
            }
        }
        return parts.join('');
    }

    function appendMessage(sender, text, forceWarning = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        let cleanedText = text || '';
        let filenames = [];

        // Pattern 1: [User uploaded a file: filename] (global)
        const uploadRegex = /\[User uploaded a file:\s*([^\]]+)\]/gi;
        let match;
        while ((match = uploadRegex.exec(cleanedText)) !== null) {
            filenames.push(match[1].trim());
        }
        cleanedText = cleanedText.replace(uploadRegex, '').trim();

        // Pattern 2: | Attached: filename or Attached: filename
        const attachRegex = /(?:^|\n)(?:\|\s*)?Attached:\s*([^\n]+)/gi;
        while ((match = attachRegex.exec(cleanedText)) !== null) {
            filenames.push(match[1].trim());
        }
        cleanedText = cleanedText.replace(attachRegex, '').trim();

        if (sender === 'user') {
            messageDiv.classList.add('user-message');
            messageDiv.innerHTML = `
                <div class="avatar">U</div>
                <div class="content">${escapeHTML(cleanedText).replace(/\n/g, '<br>')}</div>
            `;
        } else {
            messageDiv.classList.add('ai-message');
            
            // Check for safety warning trigger (or if forced from prompt)
            const needsWarning = forceWarning || checkSafety(cleanedText);
            let warningHtml = '';
            
            if (needsWarning) {
                warningHtml = `
                    <div class="safety-warning">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
                            <path d="M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z" fill="#ef4444"/>
                            <path d="M12 8V13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                            <circle cx="12" cy="16.5" r="1.2" fill="white"/>
                        </svg>
                        <div>
                            <b>Safety Warning</b>
                            Be careful with this response. It might mention things that are false, dangerous, or illegal. Check in with a trusted adult if you have questions.
                        </div>
                    </div>
                `;
            }

            messageDiv.innerHTML = `
                <div class="avatar">O</div>
                <div class="content">
                    ${warningHtml}
                    ${formatMessageContent(cleanedText)}
                </div>
            `;
        }

        // If filenames are extracted, create beautiful responsive wrapping grid
        if (filenames.length > 0) {
            const contentDiv = messageDiv.querySelector('.content');
            if (contentDiv) {
                const gridContainer = document.createElement('div');
                gridContainer.className = 'bubble-attachments-container';
                gridContainer.style.display = 'flex';
                gridContainer.style.flexWrap = 'wrap';
                gridContainer.style.gap = '0.75rem';
                gridContainer.style.marginTop = cleanedText ? '0.75rem' : '0';

                filenames.forEach(filename => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);
                    const ext = filename.split('.').pop().toLowerCase();
                    
                    let faIcon = 'fa-file';
                    let iconClass = 'default';
                    
                    if (['xlsx', 'xls', 'csv'].includes(ext)) {
                        faIcon = 'fa-file-excel';
                        iconClass = 'excel';
                    } else if (ext === 'pdf') {
                        faIcon = 'fa-file-pdf';
                        iconClass = 'pdf';
                    } else if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
                        faIcon = 'fa-file-word';
                        iconClass = 'word';
                    } else if (['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(ext)) {
                        faIcon = 'fa-file-audio';
                        iconClass = 'audio';
                    } else if (['pptx', 'ppt'].includes(ext)) {
                        faIcon = 'fa-file-powerpoint';
                        iconClass = 'document';
                    }

                    const cardUrl = `${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}`;
                    const card = document.createElement('div');
                    card.className = `attachment-card ${isImage ? 'image-card' : 'file-card'}`;
                    card.style.flex = '1 1 calc(50% - 0.375rem)';
                    card.style.minWidth = '150px';
                    card.style.maxWidth = '250px';
                    
                    if (isImage) {
                        card.style.backgroundImage = `url('${cardUrl}')`;
                        card.innerHTML = `<div class="file-name">${escapeHTML(filename)}</div>`;
                    } else {
                        card.innerHTML = `
                            <i class="fas ${faIcon} file-icon ${iconClass}"></i>
                            <div class="file-name">${escapeHTML(filename)}</div>
                        `;
                    }
                    
                    card.onclick = () => window.open(cardUrl, '_blank');
                    gridContainer.appendChild(card);
                });

                contentDiv.appendChild(gridContainer);
            }
        }

        chatHistory.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    async function fetchAIResponse(userMessage) {
        const loadingId = 'loading-' + Date.now();
        // 1. Check if the user's prompt itself is sensitive to show warning early
        const userPromptSensitive = checkSafety(userMessage);
        let earlyWarningHtml = '';
        if (userPromptSensitive) {
            earlyWarningHtml = `
                <div class="safety-warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
                        <path d="M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z" fill="#ef4444"/>
                        <path d="M12 8V13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="12" cy="16.5" r="1.2" fill="white"/>
                    </svg>
                    <div>
                        <b>Safety Warning</b>
                        Be careful with this response. It might mention things that are false, dangerous, or illegal. Check in with a trusted adult if you have questions.
                    </div>
                </div>
            `;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'ai-message');
        messageDiv.id = loadingId;
        messageDiv.innerHTML = `
            <div class="avatar">O</div>
            <div class="content">
                ${earlyWarningHtml}
                <span class="glow-text">Thinking...</span>
            </div>
        `;
        chatHistory.appendChild(messageDiv);
        scrollToBottom();

        // 180 second timeout for fetch (giving AI more time to think)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        try {
            const formData = new FormData();
            formData.append('text', userMessage);
            formData.append('user_name', currentUser);
            formData.append('token', localStorage.getItem('off1_token') || 'guest_session');
            formData.append('language', 'English');
            
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                formData.append('model', modelSelect.value);
            }
            
            if (selectedFiles && selectedFiles.length > 0) {
                selectedFiles.forEach(file => {
                    formData.append('file', file);
                });
            }

            formData.append('stream', 'true');

            // Visually clear immediately so it feels fast
            clearAttachment();

            // Pillar 2/3: Route standard prompts to dedicated SSE streaming pipe, fallback to /api/chat for file uploads
            const hasFiles = fileUploadInput && fileUploadInput.files && fileUploadInput.files.length > 0;
            const chatEndpoint = hasFiles ? `${API_BASE_URL}/api/chat` : `${API_BASE_URL}/api/chat/sse`;

            const response = await fetch(chatEndpoint, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                },
                body: formData,
                signal: controller.signal
            });
            
            if (response.status === 403) {
                let banReason = "Access Denied: You have been blocked by Vanguard Defense Matrix.";
                try {
                    const errData = await response.clone().json();
                    if (errData.message || errData.reason) {
                        banReason = errData.message || errData.reason;
                    }
                } catch(e) {}
                alert(`🛡️ VANGUARD DEFENSE MATRIX ENFORCEMENT\n\n${banReason}`);
                return;
            }

            if (response.status === 401) {
                if (window.location.pathname.includes('/dev/')) {
                    alert("Your session has expired. Redirecting to login...");
                    localStorage.setItem('off1_username', 'Guest');
                    localStorage.setItem('off1_token', 'guest_session');
                    localStorage.setItem('off1_role_rank', '0');
                    localStorage.setItem('off1_is_admin', 'false');
                    localStorage.setItem('off1_is_owner', 'false');
                    localStorage.removeItem('off1_email');
                    window.location.href = '../login.html';
                    return;
                }
                alert("Your session has expired. Transitioning to Guest mode.");
                localStorage.setItem('off1_username', 'Guest');
                localStorage.setItem('off1_token', 'guest_session');
                localStorage.setItem('off1_role_rank', '0');
                localStorage.setItem('off1_is_admin', 'false');
                localStorage.setItem('off1_is_owner', 'false');
                localStorage.removeItem('off1_email');
                currentUser = 'Guest';
                token = 'guest_session';
                
                if (btnSettings) btnSettings.style.display = 'none';
                if (btnHistory) btnHistory.style.display = 'none';
                if (btnAdmin) btnAdmin.style.display = 'none';
                if (logoutBtn) {
                    logoutBtn.querySelector('span').textContent = 'Login';
                    logoutBtn.classList.remove('text-danger');
                }
                updateUserHeader();
                
                // Re-send or handle the message under Guest username
                // Or just return so user can try sending again as Guest.
                const loadingBubble = document.getElementById(loadingId);
                if (loadingBubble) loadingBubble.remove();
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let accumulated = "";
            let done = false;
            let initialized = false;
            let aiMessageDiv = null;
            let loadingBubble = document.getElementById(loadingId);
            let buffer = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    buffer += decoder.decode(value, { stream: !done });
                    const lines = buffer.split("\n");
                    buffer = lines.pop();

                    for (const line of lines) {
                        let cleanLine = line.trim();
                        if (cleanLine.startsWith("data: ")) {
                            cleanLine = cleanLine.substring(6).trim();
                        }
                        if (cleanLine && cleanLine !== "[DONE]") {
                            try {
                                const chunk = JSON.parse(cleanLine);

                                if (chunk.status === 'error' || chunk.status === 'drain') {
                                    if (loadingBubble) { loadingBubble.remove(); loadingBubble = null; }
                                    appendMessage('ai', "⚠️ Server Notification: " + (chunk.error || "Server in maintenance drain state."));
                                    return;
                                }

                                if (chunk.status === 'busy') {
                                    busyModal.classList.remove('hidden');
                                    if (loadingBubble) loadingBubble.remove();
                                    appendMessage('ai', chunk.response);
                                    return;
                                }

                                if (chunk.status === 'searching') {
                                    const loadingMsg = document.querySelector(`#${loadingId} .content`);
                                    if (loadingMsg) loadingMsg.innerHTML = chunk.response; 
                                    streamResults(currentUser, loadingId);
                                    return;
                                }

                                if (chunk.status === 'queued') {
                                    const loadingMsg = document.querySelector(`#${loadingId} .content`);
                                    if (loadingMsg) {
                                        const modelDisplayNames = {
                                            "gemma4-e2b": "⚡ Fast / Thinking Mode (E2B)",
                                            "gemma4-e4b": "🧠 Pro Mode (E4B)",
                                            "gemma3-1b": "🚀 Turbo Mode (1B)"
                                        };
                                        const cleanModel = chunk.model.includes("e2b") ? "gemma4-e2b" : (chunk.model.includes("e4b") ? "gemma4-e4b" : "gemma3-1b");
                                        const curLabel = modelDisplayNames[cleanModel] || chunk.model;
                                        const estMin = Math.round((chunk.estimated_wait_sec || 0) / 60);
                                        const estStr = estMin > 0 ? `~${estMin}m` : `~${chunk.estimated_wait_sec || 0}s`;
                                        let text = `⏳ All inference slots full for <strong>${curLabel}</strong>. You are <strong>Position #${chunk.position || 1}</strong> in queue (depth: ${chunk.queue_length || 1}). Est. Wait: <strong style="color: #60a5fa;">${estStr}</strong>.`;
                                        
                                        // Suggest alternatives if another model queue is shorter
                                        if (chunk.alternatives && Object.keys(chunk.alternatives).length > 0) {
                                            text += `<div style="margin-top: 0.6rem; padding: 0.6rem; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 0.8rem; border: 1px solid var(--glass-border);">`;
                                            text += `<div style="color: #fbbf24; font-weight: 600; margin-bottom: 0.3rem;"><i class="fas fa-info-circle"></i> Shorter queue detected! Switch to skip the line:</div>`;
                                            text += `<div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">`;
                                            for (const [altModel, altLen] of Object.entries(chunk.alternatives)) {
                                                const label = modelDisplayNames[altModel] || altModel;
                                                text += `<button class="btn btn-secondary" onclick="transferQueueRequest('${chunk.req_id}', '${altModel}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: rgba(96,165,250,0.4);"><i class="fas fa-random"></i> Switch to ${label} (Queue: ${altLen})</button>`;
                                            }
                                            text += `</div></div>`;
                                        }
                                        loadingMsg.innerHTML = text;
                                    }
                                    continue;
                                }

                                if (chunk.status === 'handoff') {
                                    const loadingMsg = document.querySelector(`#${loadingId} .content`);
                                    if (loadingMsg) loadingMsg.innerHTML = `⚡ <strong>Slot Open! Zero-Delay Handoff executed.</strong> Receiving tokens...`;
                                    continue;
                                }

                                if (chunk.status === 'completed') {
                                    done = true;
                                    break;
                                }

                                const tokenChunk = chunk.token !== undefined ? chunk.token : (chunk.response || "");
                                if (!tokenChunk && chunk.status !== 'streaming' && !chunk.done) continue;

                                accumulated += tokenChunk;

                                if (!initialized) {
                                    if (loadingBubble) {
                                        loadingBubble.remove();
                                        loadingBubble = null;
                                    }
                                    initialized = true;
                                    aiMessageDiv = appendMessage('ai', accumulated, userPromptSensitive);
                                } else {
                                    if (aiMessageDiv) {
                                        const contentNode = aiMessageDiv.querySelector('.content');
                                        if (contentNode) {
                                            const warningNode = contentNode.querySelector('.safety-warning');
                                            let warningHtml = "";
                                            if (warningNode) {
                                                warningHtml = warningNode.outerHTML;
                                            }
                                            contentNode.innerHTML = warningHtml + formatMessageContent(accumulated);
                                        }
                                    }
                                    scrollToBottom();
                                }
                            } catch (e) {
                                console.error("Error parsing JSON chunk:", e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Error communicating with server:", error);
            const loadingBubble = document.getElementById(loadingId);
            if (loadingBubble) loadingBubble.remove();
            
            if (error.name === 'AbortError') {
                appendMessage('ai', "❌ The request timed out. The server might be slow or offline.");
            } else {
                appendMessage('ai', "❌ Failed to connect to the server. Please ensure the backend is running on port 5000 and the ngrok URL is correct.");
            }
        }
    }

    async function streamResults(user_name, loadingId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/search_stream?user_name=${encodeURIComponent(user_name)}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE format (data: ...)
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6));

                        const loadingBubble = document.getElementById(loadingId);
                        if (!loadingBubble) return;
                        const contentDiv = loadingBubble.querySelector('.content');

                        if (data.status === 'ready') {
                            loadingBubble.remove();
                            let response_text = `found ${data.results.length} groups of items:\n`;
                            data.results.forEach(group => {
                                response_text += `\n📦 ${group.group_name}\n`;
                                const sorted = group.items.sort((a, b) => a.price - b.price);
                                const min_price = sorted[0].price;
                                sorted.forEach(i => {
                                    const star = i.price <= min_price ? " ⭐" : "";
                                    response_text += `   - ${i.store}: ${i.price} SAR${star}\n`;
                                });
                            });
                            appendMessage('ai', response_text);
                            return; // End stream
                        } else if (data.status === 'waiting') {
                            if (contentDiv) contentDiv.innerHTML = `Queued... Position #${data.position} ⏳`;
                        } else if (data.status === 'searching') {
                            if (contentDiv) contentDiv.innerHTML = `Searching the stores now... 🔎`;
                        } else if (data.status === 'error') {
                            loadingBubble.remove();
                            appendMessage('ai', `❌ Search Error: ${data.message}`);
                            return;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Streaming error:", e);
            // Fallback to single poll after error
            setTimeout(() => {
                const loadingBubble = document.getElementById(loadingId);
                if (loadingBubble) loadingBubble.remove();
            }, 1000);
        }
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // --- Ad Consent Logic (Session-based) ---
    const adModal = document.getElementById('ad-modal-overlay');
    const btnAccept = document.getElementById('ad-accept');
    const btnDecline = document.getElementById('ad-decline');

    // Interstitial Ad Elements
    const interstitialAd = document.getElementById('interstitial-ad');
    const adTimer = document.getElementById('ad-timer');
    const closeAdBtn = document.getElementById('close-ad-btn');

    function showInterstitialAd() {
        interstitialAd.classList.remove('hidden');
        closeAdBtn.classList.add('hidden');

        let timeLeft = 5;
        adTimer.textContent = `Ad finishes in ${timeLeft}s`;

        const interval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                adTimer.textContent = `Ad finishes in ${timeLeft}s`;
            } else {
                clearInterval(interval);
                adTimer.textContent = "Ad Finished";
                closeAdBtn.classList.remove('hidden');
            }
        }, 1000);

        closeAdBtn.onclick = () => {
            interstitialAd.classList.add('hidden');
        };
    }

    if (adModal && btnAccept && btnDecline && interstitialAd) {
        const modalContent = adModal.querySelector('.modal-content');

        function showMessageAndDismiss(messageHTML) {
            modalContent.innerHTML = messageHTML;
            setTimeout(() => {
                adModal.classList.add('hidden');
            }, 3000);
        }

        function checkAdBlockerAndHandle() {
            const adBait = document.createElement('div');
            adBait.className = 'adsbox ad-banner ad-container ad-slot';
            adBait.style.height = '10px';
            adBait.style.width = '10px';
            adBait.style.position = 'absolute';
            adBait.style.top = '-1000px';
            adBait.style.left = '-1000px';
            document.body.appendChild(adBait);

            setTimeout(() => {
                const isBlocked = adBait.offsetHeight === 0 || window.getComputedStyle(adBait).display === 'none';
                adBait.remove();

                if (isBlocked) {
                    sessionStorage.setItem('ad_consent_asked', 'true');
                    sessionStorage.setItem('ad_consent', 'false');
                    adModal.classList.remove('hidden');
                    showMessageAndDismiss(`
                        <h2 class="glow-text">Ad Blocker Detected</h2>
                        <p style="margin-top: 1rem;">Oh it looks like ad blocker is on don't worry use the internet as you please</p>
                    `);
                } else {
                    adModal.classList.remove('hidden');
                }
            }, 100);
        }

        if (!sessionStorage.getItem('ad_consent_asked')) {
            checkAdBlockerAndHandle();
        }

        btnAccept.addEventListener('click', () => {
            sessionStorage.setItem('ad_consent_asked', 'true');
            sessionStorage.setItem('ad_consent', 'true');
            adModal.classList.add('hidden');

            setTimeout(() => {
                showInterstitialAd();
            }, 500);
        });

        btnDecline.addEventListener('click', () => {
            sessionStorage.setItem('ad_consent_asked', 'true');
            sessionStorage.setItem('ad_consent', 'false');

            showMessageAndDismiss(`
                <h2 class="glow-text">No Problem!</h2>
                <p style="margin-top: 1rem; font-size: 1.1rem;">That's ok I hope you have a good day</p>
            `);
        });
    }

    const btnSupport = document.getElementById('btn-support');
    if (btnSupport && interstitialAd) {
        btnSupport.addEventListener('click', () => {
            showInterstitialAd();
        });
    }

    // --- Busy Modal Logic ---
    if (busyModal && busyWatchAdBtn && busyCloseBtn) {
        busyWatchAdBtn.addEventListener('click', () => {
            busyModal.classList.add('hidden');
            showInterstitialAd();
        });

        busyCloseBtn.addEventListener('click', () => {
            busyModal.classList.add('hidden');
        });
    }

    // --- Admin Panel Logic ---
    const roleRank = parseInt(localStorage.getItem('off1_role_rank') || '0');

    if (roleRank >= 1 && btnAdmin) {
        btnAdmin.classList.remove('d-none');
        btnAdmin.classList.remove('hidden');

        const btnRefreshAdmin = document.getElementById('btn-refresh-admin');
        const adminRefreshIcon = document.getElementById('admin-refresh-icon');

        async function fetchAdminStats() {
            try {
                // Fetch stats with session token (backend will verify if user is admin)
                const res = await fetch(`${API_BASE_URL}/api/dashboard?token=${localStorage.getItem('off1_token')}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (res.status === 401 || res.status === 403) {
                    console.warn("Dashboard Access Denied:", res.status);
                    localStorage.setItem('off1_username', 'Guest');
                    localStorage.setItem('off1_token', 'guest_session');
                    localStorage.setItem('off1_role_rank', '0');
                    localStorage.setItem('off1_is_admin', 'false');
                    localStorage.setItem('off1_is_owner', 'false');
                    localStorage.removeItem('off1_email');
                    currentUser = 'Guest';
                    token = 'guest_session';
                    
                    if (btnSettings) btnSettings.style.display = 'none';
                    if (btnHistory) btnHistory.style.display = 'none';
                    if (btnAdmin) btnAdmin.style.display = 'none';
                    if (logoutBtn) {
                        logoutBtn.querySelector('span').textContent = 'Login';
                        logoutBtn.classList.remove('text-danger');
                    }
                    if (adminModal) adminModal.classList.add('hidden');
                    updateUserHeader();
                    return;
                }
                const stats = await res.json();
                document.getElementById('stat-uptime').textContent = stats.uptime || 'N/A';
                document.getElementById('stat-requests').textContent = stats.requests || 0;
                document.getElementById('stat-cpu').textContent = (stats.cpu || 0) + '%';
                document.getElementById('stat-ram').textContent = (stats.ram || 0) + '%';
                document.getElementById('stat-gpu').textContent = stats.gpu || 'N/A';
                document.getElementById('stat-vram').textContent = stats.vram || 'N/A';
                const totalQ = stats.total_queue || 0;
                document.getElementById('stat-total-queue').textContent = totalQ + (totalQ >= 100 ? " ⚠️ (High Demand Mode Active)" : "");

                // Render Model Queues & Active Slots
                const queuesContainer = document.getElementById('admin-model-queues');
                if (queuesContainer && stats.queues && stats.active_slots_per_model) {
                    let html = '';
                    const modelDisplayNames = {
                        "gemma4-e2b": "⚡ Fast / Thinking (Gemma 4 E2B)",
                        "gemma4-e4b": "🧠 Pro Mode (Gemma 4 E4B)",
                        "gemma3-1b": "🚀 Turbo Mode (Gemma 3 1B)"
                    };
                    
                    for (const [key, qData] of Object.entries(stats.queues)) {
                        const qSize = qData.size || 0;
                        const waitSec = qData.total_wait_sec || 0;
                        const waitMin = Math.round(waitSec / 60);
                        const waitStr = waitMin > 0 ? `${waitMin}m` : `${waitSec}s`;
                        
                        const activeCount = stats.active_slots_per_model[key] || 0;
                        const label = modelDisplayNames[key] || key;
                        html += `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                <div>
                                    <strong style="color: #60a5fa;">${label}</strong>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.1rem;">
                                        Active Slots: <span style="color: ${activeCount >= 2 ? '#ef4444' : '#10b981'}; font-weight: bold;">${activeCount}/2</span>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem;">
                                    <span class="badge" style="background: ${qSize > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)'}; color: ${qSize > 0 ? '#f59e0b' : '#10b981'}; border: 1px solid ${qSize > 0 ? '#f59e0b' : '#10b981'}; border-radius: 6px; padding: 0.2rem 0.5rem; font-weight: 600;">
                                        Queue: ${qSize}
                                    </span>
                                    ${qSize > 0 ? `<span style="font-size: 0.75rem; color: #fbbf24; font-weight: 500;">~${waitStr} wait</span>` : ''}
                                </div>
                            </div>
                        `;
                    }
                    queuesContainer.innerHTML = html;
                }

                // Fetch Banned Entities Matrix & Appeals
                await fetchBannedThreats();
                await fetchBanAppeals();
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            }
        }

        async function fetchBannedThreats() {
            const tbody = document.getElementById('banned-threat-tbody');
            const badge = document.getElementById('stat-banned-badge');
            if (!tbody) return;

            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/banned`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    const list = data.banned_entities || [];
                    if (badge) badge.textContent = `Neutralized Entities: ${list.length}`;
                    
                    if (list.length === 0) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="5" style="text-align: center; color: #10b981; padding: 1.5rem; font-weight: 500;">
                                    <i class="fas fa-shield-alt"></i> Vanguard Defense Matrix Active: 0 Threats Detected. System Nominal.
                                </td>
                            </tr>
                        `;
                        return;
                    }

                    tbody.innerHTML = list.map(item => {
                        const isAccount = (item.entity_type === 'account') || (item.entity_id && !item.entity_id.includes('.') && !item.entity_id.includes(':'));
                        const isPerm = item.is_permanent || !item.expires_at;
                        const strikeBadge = isPerm 
                            ? `<span class="strike-pill permanent">⛔ PERM (${item.strikes || 1} Strikes)</span>`
                            : `<span class="strike-pill temporary">⚡ ${item.strikes || 1} Strike (Temp)</span>`;
                        
                        const safeId = escapeHTML(item.entity_id || item.ip_address || 'Unknown');
                        const safeReason = escapeHTML(item.reason || 'Abuse / Policy Violation');
                        const assocIp = escapeHTML(item.associated_ip || (isAccount ? 'N/A' : safeId));

                        const typePill = isAccount
                            ? `<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.72rem; font-weight: 600;"><i class="fas fa-user"></i> Account</span>`
                            : `<span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.72rem; font-weight: 600;"><i class="fas fa-globe"></i> IP Block</span>`;

                        const entityTypeStr = isAccount ? 'account' : 'ip';

                        return `
                            <tr>
                                <td>
                                    <span class="ip-terminal-badge" style="font-size: 0.85rem; color: ${isAccount ? '#93c5fd' : '#fca5a5'};">
                                        ${isAccount ? '<i class="fas fa-user-slash"></i> ' : '<i class="fas fa-ban"></i> '}${safeId}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                        ${typePill}
                                        <span style="font-size: 0.72rem; color: var(--text-secondary); font-family: monospace;">IP: ${assocIp}</span>
                                    </div>
                                </td>
                                <td>${strikeBadge}</td>
                                <td style="color: #fca5a5; font-size: 0.8rem; max-width: 250px;">${safeReason}</td>
                                <td>
                                    <button type="button" class="btn-unban-action" onclick="unbanThreatEntity('${entityTypeStr}', '${safeId}')">
                                        <i class="fas fa-unlock"></i> Unban
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            } catch (e) {
                console.error("Error fetching banned threats:", e);
            }
        }

        window.unbanThreatEntity = async function(entityType, entityId) {
            if (!confirm(`Are you sure you want to unban ${entityType.toUpperCase()} '${entityId}' and clear all strikes?`)) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/unban`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ entity_type: entityType, entity_id: entityId })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(`✅ ${entityType.toUpperCase()} '${entityId}' has been unbanned.`);
                    fetchBannedThreats();
                } else {
                    alert(`Error unbanning: ${data.message}`);
                }
            } catch (e) {
                alert(`Failed to unban: ${e.message}`);
            }
        };

        const btnExecuteBan = document.getElementById('btn-execute-ban');
        if (btnExecuteBan) {
            btnExecuteBan.onclick = async () => {
                const typeSelect = document.getElementById('manual-ban-type');
                const targetInput = document.getElementById('manual-ban-target') || document.getElementById('manual-ban-ip');
                const durSelect = document.getElementById('manual-ban-duration');
                const reasonInput = document.getElementById('manual-ban-reason');
                
                const entityType = typeSelect?.value || 'account';
                const entityId = (targetInput?.value || '').trim();
                const reason = (reasonInput?.value || 'Manual administrator enforcement').trim();
                const durVal = durSelect?.value || 'perm';
                const isPerm = durVal === 'perm';
                const durationMin = isPerm ? 0 : parseInt(durVal, 10);

                if (!entityId) {
                    alert(`Please enter a valid ${entityType === 'account' ? 'Username' : 'IP Address'} to ban.`);
                    return;
                }

                btnExecuteBan.disabled = true;
                btnExecuteBan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Banning...';

                try {
                    const res = await fetch(`${API_BASE_URL}/api/admin/ban`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                        body: JSON.stringify({
                            entity_type: entityType,
                            entity_id: entityId,
                            reason: reason,
                            permanent: isPerm,
                            duration_minutes: durationMin
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        alert(`🚫 ${entityType.toUpperCase()} '${entityId}' has been successfully banned!`);
                        if (targetInput) targetInput.value = '';
                        fetchBannedThreats();
                    } else {
                        alert(`Error banning: ${data.message}`);
                    }
                } catch (e) {
                    alert(`Failed to ban: ${e.message}`);
                } finally {
                    btnExecuteBan.disabled = false;
                    btnExecuteBan.innerHTML = '<i class="fas fa-skull"></i> <span>Execute Ban</span>';
                }
            };
        }

        async function fetchBanAppeals() {
            const container = document.getElementById('appeals-list-container');
            const badge = document.getElementById('appeals-count-badge');
            if (!container) return;

            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/appeals`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    const appeals = data.appeals || [];
                    const pending = appeals.filter(a => a.status === 'pending');
                    if (badge) badge.textContent = `${pending.length} Pending Appeal${pending.length === 1 ? '' : 's'}`;

                    if (appeals.length === 0) {
                        container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; padding: 0.8rem;">No ban appeals on record.</div>`;
                        return;
                    }

                    container.innerHTML = appeals.map(a => {
                        const isPending = a.status === 'pending';
                        const statusColor = isPending ? '#f59e0b' : (a.status === 'approved' ? '#10b981' : '#ef4444');
                        return `
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${statusColor}44; border-left: 3px solid ${statusColor}; border-radius: 6px; padding: 0.6rem; font-size: 0.78rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                                    <div>
                                        <strong style="color: var(--text-primary); font-size: 0.82rem;">${escapeHTML(a.entity_id)}</strong>
                                        <span style="color: var(--text-secondary); font-size: 0.72rem; margin-left: 0.4rem;">(${escapeHTML(a.entity_type)}) &bull; ${escapeHTML(a.contact_email || 'No email')}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                                        <span style="color: ${statusColor}; font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">${escapeHTML(a.status)}</span>
                                        ${isPending ? `
                                            <button onclick="resolveBanAppeal(${a.id}, 'approve')" style="background: #10b981; color: white; border: none; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.7rem; cursor: pointer; font-weight: 600;">Approve & Unban</button>
                                            <button onclick="resolveBanAppeal(${a.id}, 'deny')" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 0.2rem 0.5rem; font-size: 0.7rem; cursor: pointer; font-weight: 600;">Deny</button>
                                        ` : ''}
                                    </div>
                                </div>
                                <div style="color: #fca5a5; margin-bottom: 0.2rem;"><strong>Ban Reason:</strong> ${escapeHTML(a.ban_reason)}</div>
                                <div style="color: #93c5fd; margin-bottom: 0.2rem;"><strong>User Statement:</strong> "${escapeHTML(a.user_statement)}"</div>
                                <details style="margin-top: 0.3rem; color: var(--text-secondary); font-size: 0.72rem;">
                                    <summary style="cursor: pointer; color: #a78bfa;">View Recent Account Actions & Chat Log</summary>
                                    <pre style="background: rgba(0,0,0,0.5); padding: 0.4rem; border-radius: 4px; margin-top: 0.3rem; white-space: pre-wrap; font-family: monospace; font-size: 0.7rem; max-height: 100px; overflow-y: auto;">${escapeHTML(a.recent_activity_summary || 'None')}</pre>
                                </details>
                            </div>
                        `;
                    }).join('');
                }
            } catch (err) {
                console.error("Failed to fetch ban appeals:", err);
            }
        }

        window.resolveBanAppeal = async function(appealId, action) {
            if (!confirm(`Are you sure you want to ${action.toUpperCase()} Appeal #${appealId}?`)) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/appeals/resolve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ appeal_id: appealId, action: action })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    fetchBanAppeals();
                    fetchBannedThreats();
                } else {
                    alert(`Error: ${data.message}`);
                }
            } catch (e) {
                alert(`Action failed: ${e.message}`);
            }
        };

        if (btnRefreshAdmin) {
            btnRefreshAdmin.addEventListener('click', async () => {
                if (adminRefreshIcon) adminRefreshIcon.classList.add('fa-spin');
                btnRefreshAdmin.disabled = true;
                try {
                    await fetchAdminStats();
                } finally {
                    setTimeout(() => {
                        if (adminRefreshIcon) adminRefreshIcon.classList.remove('fa-spin');
                        btnRefreshAdmin.disabled = false;
                    }, 400);
                }
            });
        }

        btnAdmin.addEventListener('click', () => {
            adminModal.classList.remove('hidden');
            fetchAdminStats(); // Fetch on open
        });

        closeAdminBtn.addEventListener('click', () => {
            adminModal.classList.add('hidden');
        });

        const runSpeedtestBtn = document.getElementById('run-speedtest-btn');
        const stStatus = document.getElementById('speedtest-status');
        const stResults = document.getElementById('speedtest-results');
        if (runSpeedtestBtn) {
            runSpeedtestBtn.addEventListener('click', async () => {
                runSpeedtestBtn.disabled = true;
                runSpeedtestBtn.textContent = 'Testing...';
                stStatus.textContent = 'Running test (takes ~15s)...';
                stStatus.style.color = 'var(--primary-color)';
                stResults.classList.add('hidden');

                try {
                    const res = await fetch(`${API_BASE_URL}/api/speedtest`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    });
                    const data = await res.json();

                    if (data.status === 'success') {
                        document.getElementById('st-ping').textContent = `${data.ping} ms`;
                        document.getElementById('st-dl').textContent = `${data.download} Mbps`;
                        document.getElementById('st-ul').textContent = `${data.upload} Mbps`;
                        stResults.classList.remove('hidden');
                        stStatus.textContent = 'Test complete!';
                        stStatus.style.color = '#10b981';
                    } else {
                        stStatus.textContent = `Error: ${data.message}`;
                        stStatus.style.color = '#ef4444';
                    }
                } catch (e) {
                    console.error(e);
                    stStatus.textContent = 'Failed to reach server.';
                    stStatus.style.color = '#ef4444';
                } finally {
                    runSpeedtestBtn.disabled = false;
                    runSpeedtestBtn.textContent = 'Run Test';
                }
            });
        }

        // --- Client Speed Test Logic ---
        if (runClientTestBtn) {
            runClientTestBtn.addEventListener('click', async () => {
                const proceed = confirm("⚠️ Data Usage Warning: This speed test will download about 30MB of data to get a stable reading. Do you want to continue?");
                if (!proceed) return;

                runClientTestBtn.disabled = true;
                runClientTestBtn.textContent = 'Testing...';
                clientTestStatus.textContent = 'Measuring your internet speed (30MB test)...';
                clientTestResults.classList.add('hidden');

                try {
                    // 1. Measure Latency (to a fast global server)
                    const startPing = performance.now();
                    await fetch('https://1.1.1.1/cdn-cgi/trace', { mode: 'no-cors' });
                    const endPing = performance.now();
                    const latency = Math.round(endPing - startPing);
                    document.getElementById('ct-ping').textContent = `${latency} ms`;

                    // 2. Measure Download Speed (from a fast CDN)
                    // Using a 30MB file from Cloudflare's speed test infrastructure
                    const testFileUrl = 'https://speed.cloudflare.com/__down?bytes=31457280';
                    const startDl = performance.now();
                    const response = await fetch(testFileUrl);
                    const blob = await response.blob();
                    const endDl = performance.now();

                    const durationInSeconds = (endDl - startDl) / 1000;
                    const sizeInBits = blob.size * 8;
                    const speedMbps = (sizeInBits / durationInSeconds) / (1024 * 1024);

                    document.getElementById('ct-dl').textContent = `${speedMbps.toFixed(2)} Mbps`;
                    clientTestResults.classList.remove('hidden');
                    clientTestStatus.textContent = 'Internet test complete!';
                    clientTestStatus.style.color = '#10b981';

                } catch (e) {
                    console.error(e);
                    clientTestStatus.textContent = 'Test failed. Check your connection.';
                    clientTestStatus.style.color = '#ef4444';
                } finally {
                    runClientTestBtn.disabled = false;
                    runClientTestBtn.textContent = 'Test My Speed';
                }
            });
        }
    }

    // --- Settings Logic ---
    if (btnSettings && settingsModal) {
        const passkeyListContainer = document.getElementById('passkey-list-container');
        const pwChangeContainer = document.getElementById('password-change-container');
        const btnShowPwChange = document.getElementById('btn-show-pw-change');
        const btnConfirmPwChange = document.getElementById('btn-confirm-pw-change');
        const btnChangeEmail = document.getElementById('btn-change-email');

        async function refreshPasskeyList() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/passkey/list?username=${currentUser}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                const keys = await res.json();
                
                if (keys.length > 0) {
                    passkeyListContainer.classList.remove('hidden');
                    passkeyListContainer.innerHTML = keys.map(key => `
                        <div class="passkey-item">
                            <div class="passkey-item-info">
                                <strong>${key.name}</strong>
                                <span>Used on: ${key.transports.join(', ') || 'Any device'}</span>
                            </div>
                            <button type="button" class="btn-remove-passkey" onclick="removePasskey(${key.id})" title="Remove Passkey">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('');
                } else {
                    passkeyListContainer.classList.add('hidden');
                }
            } catch (e) { console.error("Failed to load passkeys", e); }
        }

        window.removePasskey = async (id) => {
            if (!confirm("Are you sure you want to remove this Passkey? You won't be able to log in with this device until you re-add it.")) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/passkey/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ id, username: currentUser })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    refreshPasskeyList();
                } else {
                    alert("Error: " + data.message);
                }
            } catch (e) { console.error(e); }
        };

        btnSettings.addEventListener('click', async () => {
            settingsModal.classList.remove('hidden');
            pwChangeContainer.classList.add('hidden'); // Hide password form by default
            
            try {
                const res = await fetch(`${API_BASE_URL}/api/settings?user_name=${currentUser}&token=${localStorage.getItem('off1_token')}`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                if (res.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                const data = await res.json();
                document.getElementById('setting-ai-name').value = data.ai_name || 'Off1';
                document.getElementById('setting-language').value = data.language || 'English';
                document.getElementById('setting-email').value = data.email || '';
                
                refreshPasskeyList();
            } catch (e) { console.error(e); }
        });

        const newPasswordInput = document.getElementById('new-password');
        const changeReqs = document.getElementById('change-password-requirements');
        const changeStrength = document.getElementById('change-strength-bar');
        const changeCriteria = {
            length: document.getElementById('change-req-length'),
            upper: document.getElementById('change-req-upper'),
            lower: document.getElementById('change-req-lower'),
            number: document.getElementById('change-req-number'),
            special: document.getElementById('change-req-special')
        };

        function checkChangePasswordStrength(val) {
            const checks = {
                length: val.length >= 8,
                upper: /[A-Z]/.test(val),
                lower: /[a-z]/.test(val),
                number: /[0-9]/.test(val),
                special: /[^a-zA-Z0-9]/.test(val)
            };

            let metCount = 0;
            for (const [key, met] of Object.entries(checks)) {
                const el = changeCriteria[key];
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

            if (changeStrength) {
                const pct = (metCount / 5) * 100;
                changeStrength.style.width = `${pct}%`;
                if (metCount <= 2) {
                    changeStrength.style.backgroundColor = '#ef4444';
                } else if (metCount <= 4) {
                    changeStrength.style.backgroundColor = '#fbbf24';
                } else {
                    changeStrength.style.backgroundColor = '#10b981';
                }
            }

            return metCount === 5;
        }

        if (newPasswordInput && changeReqs) {
            newPasswordInput.addEventListener('focus', () => {
                changeReqs.classList.add('visible');
                changeReqs.classList.remove('hidden');
            });

            newPasswordInput.addEventListener('blur', () => {
                if (newPasswordInput.value.length === 0) {
                    changeReqs.classList.remove('visible');
                    changeReqs.classList.add('hidden');
                }
            });

            newPasswordInput.addEventListener('input', () => {
                changeReqs.classList.add('visible');
                changeReqs.classList.remove('hidden');
                checkChangePasswordStrength(newPasswordInput.value);
            });
        }

        btnShowPwChange.addEventListener('click', () => {
            pwChangeContainer.classList.toggle('hidden');
        });

        btnConfirmPwChange.addEventListener('click', async () => {
            const old_password = document.getElementById('old-password').value;
            const new_password = newPasswordInput ? newPasswordInput.value : '';
            
            if (!old_password || !new_password) {
                alert("Please fill in both password fields.");
                return;
            }

            if (!checkChangePasswordStrength(new_password)) {
                alert("New password does not meet all strength requirements.");
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/settings/change_password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ username: currentUser, old_password, new_password })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    alert("Password updated successfully!");
                    localStorage.setItem('off1_pwned_count', '0');
                    checkAndShowPwnedWarning();
                    pwChangeContainer.classList.add('hidden');
                    document.getElementById('old-password').value = '';
                    if (newPasswordInput) newPasswordInput.value = '';
                    
                    // Reset requirements checklist UI
                    if (changeReqs) {
                        changeReqs.classList.remove('visible');
                        changeReqs.classList.add('hidden');
                    }
                    if (changeStrength) changeStrength.style.width = '0%';
                    for (const el of Object.values(changeCriteria)) {
                        if (el) {
                            el.classList.remove('met');
                            const icon = el.querySelector('i');
                            if (icon) icon.className = 'far fa-circle';
                        }
                    }
                } else {
                    alert("Error: " + data.message);
                }
            } catch (e) { alert("Failed to connect to server."); }
        });

        btnChangeEmail.addEventListener('click', async () => {
            const newEmail = prompt("Enter your new email address:");
            if (!newEmail || newEmail.trim() === "") return;

            try {
                const res = await fetch(`${API_BASE_URL}/api/settings/change_email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ username: currentUser, new_email: newEmail })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    document.getElementById('setting-email').value = newEmail;
                    alert("Email updated!");
                } else {
                    alert("Error: " + data.message);
                }
            } catch (e) { alert("Server error."); }
        });

        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ai_name = document.getElementById('setting-ai-name').value;
            const language = document.getElementById('setting-language').value;

            try {
                await fetch(`${API_BASE_URL}/api/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ user_name: currentUser, ai_name, language })
                });
                settingsModal.classList.add('hidden');
            } catch (e) { console.error(e); }
        });
    }

    // --- History Logic ---
    // --- History Logic ---
    let fullHistoryData = [];

    async function fetchAllHistory() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/history?user_name=${currentUser}&token=${localStorage.getItem('off1_token')}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (res.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            const data = await res.json();
            if (data.history) {
                fullHistoryData = data.history;
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    function groupHistoryByDate() {
        const groups = {};
        fullHistoryData.forEach(msg => {
            let dateStr = "Older Messages";
            if (msg.timestamp) {
                dateStr = new Date(msg.timestamp).toLocaleDateString();
            } else if (typeof msg === 'string') {
                dateStr = "Legacy Chats";
            }

            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(msg);
        });
        return groups;
    }

    function renderHistoryModal() {
        if (!historySessionList) return;
        historySessionList.innerHTML = '';
        const groups = groupHistoryByDate();

        const dates = Object.keys(groups).sort((a, b) => {
            if (a.includes("Legacy") || a.includes("Older")) return 1;
            if (b.includes("Legacy") || b.includes("Older")) return -1;
            return new Date(b) - new Date(a);
        });

        if (dates.length === 0) {
            historySessionList.innerHTML = '<p style="color: gray; text-align: center;">No chat history found.</p>';
            return;
        }

        dates.forEach(date => {
            const msgs = groups[date];
            const btn = document.createElement('button');
            btn.className = 'session-btn';

            let displayDate = date;
            if (date === new Date().toLocaleDateString()) displayDate = 'Today';
            else if (date === new Date(Date.now() - 86400000).toLocaleDateString()) displayDate = 'Yesterday';

            btn.innerHTML = `
                <span class="session-date">${displayDate}</span>
                <span class="session-count">${msgs.length} msgs</span>
            `;
            btn.onclick = () => {
                renderSpecificSession(msgs);
                historyModal.classList.add('hidden');
            };
            historySessionList.appendChild(btn);
        });
    }

    function renderSpecificSession(messages) {
        chatHistory.innerHTML = '';
        messages.forEach(msg => {
            if (typeof msg === 'string') {
                const split = msg.split(': ');
                if (split.length >= 2) {
                    appendMessage(split[0], split.slice(1).join(': '));
                }
            } else {
                appendMessage(msg.sender, msg.text);
            }
        });
    }

    // Load history automatically on start (load today's chat if it exists)
    (async function initHistory() {
        if (currentUser === 'Guest') return;
        await fetchAllHistory();
        const groups = groupHistoryByDate();
        const todayStr = new Date().toLocaleDateString();
        if (groups[todayStr]) {
            renderSpecificSession(groups[todayStr]);
        }
    })();

    if (btnHistory && historyModal) {
        btnHistory.addEventListener('click', async () => {
            await fetchAllHistory();
            renderHistoryModal();
            historyModal.classList.remove('hidden');
        });

        closeHistoryBtn.addEventListener('click', () => {
            historyModal.classList.add('hidden');
        });
    }

    // --- Passkey (WebAuthn) Implementation ---

    async function setupPasskey() {
        const username = localStorage.getItem('off1_username');
        if (!username) {
            alert("You must be logged in to setup a Passkey.");
            return;
        }

        const btn = document.getElementById('btn-setup-passkey');
        const badge = document.getElementById('passkey-status-badge');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            // 1. Get registration options from server
            const resp = await fetch(`${API_BASE_URL}/api/passkey/register/begin`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ username })
            });

            const options = await resp.json();
            if (options.status === 'error') throw new Error(options.message);

            // 2. Adjust options for navigator.credentials.create
            options.challenge = bufferFromBase64Url(options.challenge);
            options.user.id = bufferFromBase64Url(options.user.id);
            if (options.excludeCredentials) {
                options.excludeCredentials.forEach(cred => {
                    cred.id = bufferFromBase64Url(cred.id);
                });
            }

            // 3. Create credential
            const credential = await navigator.credentials.create({ publicKey: options });

            // 4. Send back to server
            const completeResp = await fetch(`${API_BASE_URL}/api/passkey/register/complete`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    username,
                    credential: {
                        id: credential.id,
                        rawId: base64UrlFromBuffer(credential.rawId),
                        response: {
                            attestationObject: base64UrlFromBuffer(credential.response.attestationObject),
                            clientDataJSON: base64UrlFromBuffer(credential.response.clientDataJSON),
                            transports: credential.response.getTransports ? credential.response.getTransports() : []
                        },
                        type: credential.type
                    }
                })
            });

            const result = await completeResp.json();
            if (result.status === 'success') {
                alert("Passkey registered successfully! You can now log in using your device biometrics.");
                // Trigger refresh if settings modal is open
                const list = document.getElementById('passkey-list-container');
                if (list) {
                    // Logic to refresh list
                    const res = await fetch(`${API_BASE_URL}/api/passkey/list?username=${username}`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                    });
                    const keys = await res.json();
                    list.classList.remove('hidden');
                    list.innerHTML = keys.map(key => `
                        <div class="passkey-item">
                            <div class="passkey-item-info">
                                <strong>${key.name}</strong>
                                <span>Used on: ${key.transports.join(', ') || 'Any device'}</span>
                            </div>
                            <button type="button" class="btn-remove-passkey" onclick="removePasskey(${key.id})" title="Remove Passkey">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('');
                }
            } else {
                throw new Error(result.message);
            }

        } catch (err) {
            console.error("Passkey Setup Error:", err);
            alert(err.message || "Failed to setup Passkey. Ensure your browser supports WebAuthn and you are using HTTPS.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

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

    const setupPasskeyBtn = document.getElementById('btn-setup-passkey');
    if (setupPasskeyBtn) {
        setupPasskeyBtn.onclick = setupPasskey;
    }

    // --- v0.8.0 Features Logic ---
    if (btnThemeToggle) {
        btnThemeToggle.onclick = () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('off1_light_mode', isLight);
        };
    }

    const previewArea = document.getElementById('attachment-preview-area');

    function updateAttachmentPreview() {
        if (!previewArea) return;
        previewArea.innerHTML = '';
        
        if (selectedFiles.length > 0) {
            previewArea.classList.remove('hidden');
            
            selectedFiles.forEach((file, index) => {
                const isImage = file.type.startsWith('image/');
                const ext = file.name.split('.').pop().toLowerCase();
                
                let faIcon = 'fa-file';
                let iconClass = 'default';
                if (['xlsx', 'xls', 'csv'].includes(ext)) {
                    faIcon = 'fa-file-excel';
                    iconClass = 'excel';
                } else if (ext === 'pdf') {
                    faIcon = 'fa-file-pdf';
                    iconClass = 'pdf';
                } else if (['docx', 'doc', 'txt', 'rtf'].includes(ext)) {
                    faIcon = 'fa-file-word';
                    iconClass = 'word';
                } else if (['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(ext)) {
                    faIcon = 'fa-file-audio';
                    iconClass = 'audio';
                } else if (['pptx', 'ppt'].includes(ext)) {
                    faIcon = 'fa-file-powerpoint';
                    iconClass = 'document';
                }

                const card = document.createElement('div');
                card.className = `attachment-card ${isImage ? 'image-card' : 'file-card'}`;
                
                if (isImage) {
                    const objectUrl = URL.createObjectURL(file);
                    card.style.backgroundImage = `url('${objectUrl}')`;
                    card.dataset.objectUrl = objectUrl;
                    card.innerHTML = `
                        <button type="button" class="delete-btn" title="Remove attachment">&times;</button>
                        <div class="file-name">${escapeHTML(file.name)}</div>
                    `;
                } else {
                    card.innerHTML = `
                        <button type="button" class="delete-btn" title="Remove attachment">&times;</button>
                        <i class="fas ${faIcon} file-icon ${iconClass}"></i>
                        <div class="file-name">${escapeHTML(file.name)}</div>
                    `;
                }
                
                const deleteBtn = card.querySelector('.delete-btn');
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeSelectedFile(index);
                };

                previewArea.appendChild(card);
            });
            
            if (attachmentBtn) attachmentBtn.style.color = 'var(--primary-color)';
            userInput.placeholder = "Press send to upload...";
        } else {
            previewArea.classList.add('hidden');
            if (attachmentBtn) attachmentBtn.style.color = 'var(--text-secondary)';
            userInput.placeholder = "Message Off1...";
        }
    }

    function removeSelectedFile(index) {
        if (previewArea) {
            const cards = previewArea.querySelectorAll('.attachment-card');
            if (cards[index] && cards[index].dataset.objectUrl) {
                URL.revokeObjectURL(cards[index].dataset.objectUrl);
            }
        }
        selectedFiles.splice(index, 1);
        updateAttachmentPreview();
    }

    function clearAttachment() {
        if (previewArea) {
            const cards = previewArea.querySelectorAll('.attachment-card');
            cards.forEach(card => {
                if (card.dataset.objectUrl) {
                    URL.revokeObjectURL(card.dataset.objectUrl);
                }
            });
        }
        selectedFiles = [];
        if (fileUploadInput) fileUploadInput.value = '';
        updateAttachmentPreview();
    }

    const attachmentMenu = document.getElementById('attachment-menu');
    const btnMenuUpload = document.getElementById('btn-menu-upload');
    const btnMenuGenerateImage = document.getElementById('btn-menu-generate-image');
    const modelSelect = document.getElementById('model-select');

    if (attachmentBtn && attachmentMenu) {
        attachmentBtn.onclick = (e) => {
            e.stopPropagation();
            attachmentMenu.classList.toggle('hidden');
        };

        if (btnMenuUpload && fileUploadInput) {
            btnMenuUpload.onclick = (e) => {
                e.stopPropagation();
                attachmentMenu.classList.add('hidden');
                fileUploadInput.click();
            };
        }

        if (btnMenuGenerateImage) {
            btnMenuGenerateImage.onclick = (e) => {
                e.stopPropagation();
                attachmentMenu.classList.add('hidden');
                if (modelSelect) {
                    modelSelect.value = 'sd3.5-medium';
                }
                if (userInput) {
                    if (!userInput.value.trim()) {
                        userInput.value = '/image ';
                    } else if (!userInput.value.trim().startsWith('/image')) {
                        userInput.value = '/image ' + userInput.value.trim();
                    }
                    userInput.focus();
                    userInput.setSelectionRange(userInput.value.length, userInput.value.length);
                }
            };
        }

        document.addEventListener('click', (e) => {
            if (!attachmentMenu.contains(e.target) && e.target !== attachmentBtn) {
                attachmentMenu.classList.add('hidden');
            }
        });

        if (fileUploadInput) {
            fileUploadInput.onchange = () => {
                const files = Array.from(fileUploadInput.files);
                if (selectedFiles.length + files.length > 10) {
                    alert("You can only upload up to 10 files in total.");
                    fileUploadInput.value = '';
                    return;
                }
                selectedFiles = selectedFiles.concat(files);
                updateAttachmentPreview();
                fileUploadInput.value = '';
            };
        }
    }

    if (micBtn) {
        let isRecording = false;
        let mediaRecorder;
        let audioChunks = [];

        micBtn.onclick = async () => {
            if (!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    isRecording = true;
                    micBtn.style.color = '#ef4444'; // Red for recording
                    micBtn.classList.add('recording-pulse');
                    userInput.placeholder = "Listening... Click mic to stop.";

                    mediaRecorder.ondataavailable = e => {
                        audioChunks.push(e.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        audioChunks = [];
                        const audioFile = new File([audioBlob], "voice_recording.webm", { type: "audio/webm" });
                        
                        if (selectedFiles.length + 1 > 10) {
                            alert("You can only upload up to 10 files in total.");
                            return;
                        }
                        selectedFiles.push(audioFile);
                        updateAttachmentPreview();
                        
                        micBtn.style.color = 'var(--text-secondary)';
                        micBtn.classList.remove('recording-pulse');
                    };
                } catch (err) {
                    console.error("Microphone access denied or error:", err);
                    alert("Microphone access is required for voice features.");
                }
            } else {
                if (mediaRecorder) mediaRecorder.stop();
                isRecording = false;
            }
        };
    }

    if (btnChangelog && changelogModal && btnCloseChangelog) {
        btnChangelog.onclick = () => changelogModal.classList.remove('hidden');
        btnCloseChangelog.onclick = () => changelogModal.classList.add('hidden');
    }

    if (btnAcceptPrivacy && privacyModal) {
        btnAcceptPrivacy.onclick = () => {
            localStorage.setItem('off1_policy_version', POLICY_VERSION);
            privacyModal.classList.add('hidden');
        };
    }

    // 🚀 Easter Egg Puzzle: Cipher Vault Terminal (SWIFT)
    const logoHeader = document.querySelector('.logo-container .logo');
    const modelSelect = document.getElementById('model-select');
    const secretVaultModal = document.getElementById('secret-vault-modal');
    const cipherCodeInput = document.getElementById('cipher-code-input');
    const cipherSubmitBtn = document.getElementById('cipher-submit-btn');
    const cipherCancelBtn = document.getElementById('cipher-cancel-btn');
    const cipherFeedback = document.getElementById('cipher-feedback');

    function checkSecretModelUnlock() {
        const isDevPortal = window.location.pathname.includes('/dev/');
        const isUnlocked = localStorage.getItem('off1_turbo_unlocked') === 'true' || isDevPortal;

        if (isUnlocked && modelSelect) {
            if (!modelSelect.querySelector('option[value="gemma3-1b-turbo"]')) {
                const turboOption = document.createElement('option');
                turboOption.value = 'gemma3-1b-turbo';
                turboOption.textContent = '🚀 Turbo Mode (Secret Unlocked)';
                turboOption.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
                turboOption.style.color = '#ffffff';
                turboOption.style.fontWeight = 'bold';
                modelSelect.appendChild(turboOption);
            }
        }
    }


    checkSecretModelUnlock();

    // Trigger Vault Terminal modal on clicking logo 3 times
    if (logoHeader && secretVaultModal) {
        let logoClickCount = 0;
        let logoClickTimer = null;

        logoHeader.style.cursor = 'pointer';
        logoHeader.title = 'Click 3 times to open the Secret Cipher Vault 🔐';

        logoHeader.addEventListener('click', () => {
            logoClickCount++;
            clearTimeout(logoClickTimer);
            logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1500);

            if (logoClickCount === 3) {
                logoClickCount = 0;
                secretVaultModal.classList.remove('hidden');
                if (cipherCodeInput) {
                    cipherCodeInput.value = '';
                    cipherCodeInput.focus();
                }
                if (cipherFeedback) cipherFeedback.textContent = '';
            }
        });
    }

    if (cipherCancelBtn && secretVaultModal) {
        cipherCancelBtn.onclick = () => secretVaultModal.classList.add('hidden');
    }

    // Interactive Clue Clicks
    document.querySelectorAll('.secret-clue').forEach(clue => {
        clue.addEventListener('click', (e) => {
            e.stopPropagation();
            const pos = clue.getAttribute('data-clue-pos');
            const letter = clue.textContent.trim();
            alert(`🔍 Secret Clue Found!\nPosition [${pos}] of the 5-letter cipher is: '${letter}'`);
        });
    });

    // Code Verification
    if (cipherSubmitBtn && cipherCodeInput && secretVaultModal) {
        cipherSubmitBtn.onclick = () => {
            const entered = cipherCodeInput.value.trim().toUpperCase();
            if (entered === 'SWIFT') {
                localStorage.setItem('off1_turbo_unlocked', 'true');
                checkSecretModelUnlock();
                if (modelSelect) modelSelect.value = 'gemma3-1b-turbo';
                
                if (cipherFeedback) {
                    cipherFeedback.style.color = '#10b981';
                    cipherFeedback.textContent = 'ACCESS GRANTED! Unlocking Turbo model...';
                }
                setTimeout(() => {
                    secretVaultModal.classList.add('hidden');
                    alert("🎉 CIPHER DECODED SUCCESSFULLY!\n\nYou unlocked '🚀 Turbo (Gemma 3 1B Secret)' model! It is now selectable in your model dropdown menu.");
                }, 800);
            } else {
                if (cipherFeedback) {
                    cipherFeedback.style.color = '#ef4444';
                    cipherFeedback.textContent = 'INVALID CIPHER CODE! Search the site clues...';
                }
                cipherCodeInput.style.borderColor = '#ef4444';
                setTimeout(() => {
                    cipherCodeInput.style.borderColor = 'var(--accent-color)';
                }, 1000);
            }
        };
    }

    // ==========================================
    // --- 6 ARCHITECTURAL PILLARS INTEGRATION ---
    // ==========================================
    let overrideTimerInterval = null;

    // Pillar 2: Bi-Directional WebSocket Control Pipe
    if (typeof io !== 'undefined') {
        const socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log("[Pillar 2 - WebSockets] Bi-directional control pipe connected:", socket.id);
        });

        // Pillar 6: Server State Synchronization & UI Locking / Unlocking
        let isServerCurrentlyLocked = false;

        socket.on('server_state', (data) => {
            console.log("[Pillar 6 - State Sync]", data);
            const chatForm = document.getElementById('chat-form');
            const chatInput = document.getElementById('user-input');
            const sendBtn = document.getElementById('send-btn');

            if (data.state === 'drain' || data.lock_ui) {
                if (chatForm) chatForm.classList.add('ui-locked-overlay');
                if (chatInput) { chatInput.disabled = true; chatInput.placeholder = "🔒 Server restarting for system maintenance... queue draining."; }
                if (sendBtn) sendBtn.disabled = true;
                if (!isServerCurrentlyLocked) {
                    showToast("⚠️ Maintenance Alert", data.message || "Server entering drain state before system reboot.", false);
                    isServerCurrentlyLocked = true;
                }
            } else if (data.state === 'online' || data.unlock_ui) {
                if (chatForm) chatForm.classList.remove('ui-locked-overlay');
                if (chatInput) { chatInput.disabled = false; chatInput.placeholder = "Type your message here..."; }
                if (sendBtn) sendBtn.disabled = false;
                
                // Only toast if transitioning from locked state or explicitly unlocking
                if (isServerCurrentlyLocked || data.unlock_ui) {
                    showToast("🟢 Server Online", data.message || "System reboot completed. All UI controls unlocked.", false);
                    isServerCurrentlyLocked = false;
                }
            }
        });

        // Pillar 5: Automated High-Demand Mitigation Alerts
        socket.on('status_change', (data) => {
            console.log("[Pillar 5 - Load Telemetry]", data);
            if (data.status === 'high_demand') {
                showToast("⚠️ High Server Traffic", `Queue depth at ${data.queue_length} users. System automatically switched to concise reply mode to accelerate queue processing.`, true, true);
            } else if (data.status === 'normal') {
                showToast("🟢 Traffic Normalized", "Server queue subsided. Normal verbose conversational mode restored.", true, false);
            }
        });

        // Pillar 4: Two-Tier Broadcast System Handler
        socket.on('broadcast', (data) => {
            console.log("[Pillar 4 - Broadcast Received]", data);
            if (data.type === 'critical_override') {
                const banner = document.getElementById('critical-override-banner');
                const title = document.getElementById('critical-title');
                const msg = document.getElementById('critical-msg');
                const timerSpan = document.getElementById('critical-timer');
                if (title && data.title) title.textContent = data.title + ":";
                if (msg) msg.textContent = data.message;
                if (banner) banner.classList.remove('hidden');

                if (overrideTimerInterval) clearInterval(overrideTimerInterval);
                if (data.target_utc_timestamp) {
                    const targetTime = new Date(data.target_utc_timestamp).getTime();
                    if (isNaN(targetTime) || data.target_utc_timestamp === "unlimited" || data.target_utc_timestamp === "-1") {
                        if (timerSpan) timerSpan.textContent = "∞";
                    } else {
                        const updateTimer = () => {
                            const now = new Date().getTime();
                            const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
                            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
                            const secs = (diff % 60).toString().padStart(2, '0');
                            if (timerSpan) timerSpan.textContent = `${mins}:${secs}`;
                            if (diff === 0 && overrideTimerInterval) {
                                clearInterval(overrideTimerInterval);
                            }
                        };
                        updateTimer(); // Tick immediately to avoid "00:00" freeze/lag
                        overrideTimerInterval = setInterval(updateTimer, 1000);
                    }
                }
            } else if (data.type === 'toast') {
                showToast(
                    "📢 System Announcement",
                    data.message,
                    data.dismissible !== false,
                    false,
                    data.action_text,
                    data.link
                );
            }
        });

        socket.on('broadcast_clear', (data) => {
            if (data && data.type === 'critical_override') {
                const banner = document.getElementById('critical-override-banner');
                if (banner) banner.classList.add('hidden');
                if (overrideTimerInterval) clearInterval(overrideTimerInterval);
            }
        });
    }

    // Helper: Toast Notification Generator
    function showToast(title, body, dismissible = true, isHighDemand = false, actionText = null, actionLink = null) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast-alert${isHighDemand ? ' high-demand' : ''}`;
        
        let html = `
            <div class="toast-header">
                <span>${escapeHTML(title)}</span>
                ${dismissible ? '<button class="toast-btn dismiss" style="padding:0.2rem 0.5rem;border:none;">&times;</button>' : ''}
            </div>
            <div class="toast-body">${escapeHTML(body)}</div>
        `;
        
        if (actionText && actionLink) {
            html += `
                <div class="toast-actions">
                    <a href="${actionLink}" target="_blank" rel="noopener noreferrer" class="toast-btn primary">${escapeHTML(actionText)} <i class="fas fa-external-link-alt"></i></a>
                </div>
            `;
        }
        
        toast.innerHTML = html;
        container.appendChild(toast);

        if (dismissible) {
            const btn = toast.querySelector('.dismiss');
            if (btn) btn.onclick = () => { toast.remove(); };
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 12000);
        }
    }

    // --- Pillar 4 & 6 Admin Dashboard Event Bindings ---
    const tierSelect = document.getElementById('broadcast-tier-select');
    const timerInput = document.getElementById('broadcast-timer-input');
    const toastFields = document.getElementById('toast-extra-fields');
    if (tierSelect) {
        tierSelect.addEventListener('change', () => {
            if (tierSelect.value === 'critical_override') {
                if (timerInput) timerInput.style.display = 'block';
                if (toastFields) toastFields.style.display = 'none';
            } else {
                if (timerInput) timerInput.style.display = 'none';
                if (toastFields) toastFields.style.display = 'flex';
            }
        });
        if (timerInput) timerInput.style.display = 'none';
    }

    const btnSendBroadcast = document.getElementById('btn-send-broadcast');
    if (btnSendBroadcast) {
        btnSendBroadcast.onclick = async () => {
            const tier = tierSelect ? tierSelect.value : 'toast';
            const msgInput = document.getElementById('broadcast-message-input');
            const message = msgInput ? msgInput.value.trim() : '';
            if (!message) { alert("Please enter a broadcast message!"); return; }

            let payload = { tier, message };
            if (tier === 'critical_override') {
                const mins = parseInt(timerInput ? timerInput.value : '10');
                if (mins === -1) {
                    payload.target_utc = "unlimited";
                } else {
                    const actualMins = isNaN(mins) ? 10 : mins;
                    const targetUtc = new Date(Date.now() + actualMins * 60000).toISOString();
                    payload.target_utc = targetUtc;
                }
            } else {
                const actionText = document.getElementById('toast-action-text')?.value || '';
                const linkUrl = document.getElementById('toast-link-url')?.value || '';
                if (actionText) payload.action_text = actionText;
                if (linkUrl) payload.link = linkUrl;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/broadcast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('off1_token')}` },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if (res.ok) {
                    alert(`✅ Broadcast emitted globally (${tier})!`);
                    if (msgInput) msgInput.value = '';
                } else {
                    alert("Error sending broadcast: " + (result.message || "Unauthorized"));
                }
            } catch (e) {
                alert("Failed to emit broadcast: " + e.message);
            }
        };
    }

    const btnClearOverride = document.getElementById('btn-clear-override');
    if (btnClearOverride) {
        btnClearOverride.onclick = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/clear_override`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('off1_token')}` }
                });
                if (res.ok) alert("🧹 Critical Override Banner cleared across all client devices!");
            } catch (e) {
                alert("Failed to clear override: " + e.message);
            }
        };
    }

    const btnTriggerReboot = document.getElementById('btn-trigger-reboot');
    if (btnTriggerReboot) {
        btnTriggerReboot.onclick = async () => {
            const seconds = parseInt(document.getElementById('reboot-countdown-sec')?.value || '60') || 60;
            const reason = document.getElementById('reboot-reason')?.value || 'System maintenance & driver restart';
            
            if (!confirm(`🚨 WARNING: Are you sure you want to schedule a full server queue drain and operating system reboot in ${seconds} seconds?`)) return;

            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/schedule_restart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('off1_token')}` },
                    body: JSON.stringify({ countdown_seconds: seconds, reason })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(`⚡ Reboot sequence scheduled! Server entering Drain mode in ${seconds}s.`);
                } else {
                    alert("Error scheduling reboot: " + data.message);
                }
            } catch (e) {
                alert("Failed to schedule reboot: " + e.message);
            }
        };
    }

    // Global Queue Transfer request handler (allows users to switch queues interactively)
    window.transferQueueRequest = async (reqId, newModel) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat/queue/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ req_id: reqId, new_model: newModel })
            });
            const result = await res.json();
            if (res.ok) {
                const loadingMsg = document.querySelector('.ai-message:last-child .content');
                if (loadingMsg) {
                    loadingMsg.innerHTML = `⚡ Transferring your prompt to the <strong>${newModel}</strong> queue...`;
                }
            } else {
                alert("Queue transfer failed: " + (result.error || "Unknown error"));
            }
    // --- Modern UX Upgrades: Textarea Auto-resize, Enter to Send, Drag-Drop, Clipboard Paste, Scroll-To-Bottom, Lightbox ---
    
    // 1. Textarea Auto-resize & Shift+Enter support
    if (userInput) {
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 140) + 'px';
        });

        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatForm) {
                    chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }
        });
    }

    // 2. Scroll to bottom button
    const scrollBottomBtn = document.getElementById('scroll-bottom-btn');
    if (chatHistory && scrollBottomBtn) {
        chatHistory.addEventListener('scroll', () => {
            const distFromBottom = chatHistory.scrollHeight - chatHistory.scrollTop - chatHistory.clientHeight;
            if (distFromBottom > 150) {
                scrollBottomBtn.classList.remove('hidden');
            } else {
                scrollBottomBtn.classList.add('hidden');
            }
        });

        scrollBottomBtn.onclick = () => {
            chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });
        };
    }

    // 3. Drag & Drop File Upload onto Chat Container
    const chatContainer = document.getElementById('chat-container');
    const dragDropOverlay = document.getElementById('drag-drop-overlay');

    if (chatContainer && dragDropOverlay) {
        ['dragenter', 'dragover'].forEach(eventName => {
            chatContainer.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropOverlay.classList.remove('hidden');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            chatContainer.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropOverlay.classList.add('hidden');
            });
        });

        chatContainer.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files || []);
            if (files.length > 0) {
                if (selectedFiles.length + files.length > 10) {
                    alert("You can only upload up to 10 files in total.");
                    return;
                }
                selectedFiles = selectedFiles.concat(files);
                updateAttachmentPreview();
            }
        });
    }

    // 4. Clipboard Screenshot / Image Pasting (Ctrl + V)
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || window.clipboardData)?.items;
        if (!items) return;
        const pastedFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const file = new File([blob], `screenshot_${Date.now()}.png`, { type: blob.type });
                    pastedFiles.push(file);
                }
            }
        }
        if (pastedFiles.length > 0) {
            if (selectedFiles.length + pastedFiles.length > 10) {
                alert("You can only upload up to 10 files in total.");
                return;
            }
            selectedFiles = selectedFiles.concat(pastedFiles);
            updateAttachmentPreview();
        }
    });

    // 5. Image Lightbox Modal Close Listener
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    if (lightboxModal && lightboxCloseBtn) {
        lightboxCloseBtn.onclick = () => lightboxModal.classList.add('hidden');
        lightboxModal.onclick = (e) => {
            if (e.target === lightboxModal) {
                lightboxModal.classList.add('hidden');
            }
        };
    }

});


