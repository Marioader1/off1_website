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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const currentU = localStorage.getItem('off1_username') || 'Guest';
            if (currentU === 'Guest') {
                // Redirect to login page
                window.location.href = 'login.html';
            } else {
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
                
                updateGuestUI();
                checkAndShowPwnedWarning();
                updateUserHeader();
                
                // Alert the user gently
                alert("You have successfully logged out. Back in Guest mode!");
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

    deleteNoBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        deleteStep = 0;
    });

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
                    performLogout();
                } else {
                    alert('Error: ' + data.message);
                    deleteModal.classList.add('hidden');
                }
            } catch (e) {
                alert('Connection failed.');
                deleteModal.classList.add('hidden');
            } finally {
                deleteYesBtn.disabled = false;
            }
        }
    });

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

        // Clear input
        userInput.value = '';

        // 2. Fetch real AI response
        fetchAIResponse(message);
    });

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
                    ${escapeHTML(cleanedText).replace(/\n/g, '<br>')}
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
            
            if (selectedFiles && selectedFiles.length > 0) {
                selectedFiles.forEach(file => {
                    formData.append('file', file);
                });
            }

            // Visually clear immediately so it feels fast
            clearAttachment();

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                },
                body: formData,
                signal: controller.signal
            });
            
            // Clear the file input after sending (backup safety)
            if (fileUploadInput) fileUploadInput.value = '';
            clearTimeout(timeoutId);

            if (response.status === 401 || response.status === 403) {
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

            const data = await response.json();

            // Handle Busy Status
            if (data.status === 'busy') {
                busyModal.classList.remove('hidden');
                const loadingBubble = document.getElementById(loadingId);
                if (loadingBubble) loadingBubble.remove();
                appendMessage('ai', data.response);
                return;
            }

            // Handle Queued/Searching Status (Async)
            if (data.status === 'queued' || data.status === 'searching') {
                // Keep the loading indicator and start streaming
                const loadingMsg = document.querySelector(`#${loadingId} .content`);
                if (loadingMsg) loadingMsg.innerHTML = data.response; 
                streamResults(currentUser, loadingId);
                return;
            }

            // Add real response
            const loadingBubble = document.getElementById(loadingId);
            if (loadingBubble) loadingBubble.remove();
            
            appendMessage('ai', data.response, userPromptSensitive);
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

        let adminRefreshInterval = null;

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
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            }
        }

        btnAdmin.addEventListener('click', () => {
            adminModal.classList.remove('hidden');
            fetchAdminStats(); // Initial fetch
            
            // Set up 15s refresh interval
            if (adminRefreshInterval) clearInterval(adminRefreshInterval);
            adminRefreshInterval = setInterval(fetchAdminStats, 15000);
        });

        closeAdminBtn.addEventListener('click', () => {
            adminModal.classList.add('hidden');
            if (adminRefreshInterval) {
                clearInterval(adminRefreshInterval);
                adminRefreshInterval = null;
            }
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

    if (attachmentBtn && fileUploadInput) {
        attachmentBtn.onclick = () => fileUploadInput.click();
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

});
