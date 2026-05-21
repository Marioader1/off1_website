import os
import shutil
import re

# Resolve paths relative to this script
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DEV_DIR = os.path.join(ROOT_DIR, "dev")

# Files that should be copied from root to dev to inherit stable updates
FILES_TO_SYNC = [
    "login.html",
    "login.js",
    "main.js",
    "reset_password.html",
    "style.css",
    "favicon.png"
]

def sync_assets():
    print("--- Synchronizing Root (Main) changes to Dev folder ---")
    
    # 1. Sync standard assets
    for filename in FILES_TO_SYNC:
        src = os.path.join(ROOT_DIR, filename)
        dst = os.path.join(DEV_DIR, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Synced: {filename} -> dev/{filename}")
        else:
            print(f"Source file not found: {filename}")

    # 2. Sync index.html and dynamically inject the Dev Security Shield
    src_index = os.path.join(ROOT_DIR, "index.html")
    dst_index = os.path.join(DEV_DIR, "index.html")

    if os.path.exists(src_index):
        with open(src_index, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Dev Security Shield script block
        shield_script = """    <script>
        (function() {
            // Apply immediate CSS hide to prevent UI flashing
            const style = document.createElement('style');
            style.innerHTML = 'body { display: none !important; }';
            document.head.appendChild(style);

            // Simple resolver for API_BASE_URL (matching main.js)
            const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:5000'
                : ((window.location.hostname.endsWith('github.io') || window.location.hostname.endsWith('vercel.app'))
                    ? 'https://miasmatical-kellie-quartan.ngrok-free.dev'
                    : window.location.origin);

            const username = localStorage.getItem('off1_username');
            const token = localStorage.getItem('off1_token');

            if (!username || !token || username === 'Guest') {
                alert("Access Denied: You must be logged in to access the development website.");
                window.location.href = "../login.html";
                return;
            }

            // Verify with the stable backend
            fetch(API_BASE_URL + '/api/verify_admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ username: username, token: token })
            })
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                }
                throw new Error('Unauthorized');
            })
            .then(data => {
                if (data.authorized) {
                    // Update role info to stay synced
                    localStorage.setItem('off1_is_admin', data.is_admin ? 'true' : 'false');
                    localStorage.setItem('off1_is_owner', data.is_owner ? 'true' : 'false');
                    localStorage.setItem('off1_role_rank', data.role_rank.toString());
                    
                    // Show the body!
                    style.remove();
                } else {
                    throw new Error('Unauthorized');
                }
            })
            .catch(error => {
                alert("Access Denied: The development website is restricted to Administrators and Owners only.");
                window.location.href = "../login.html";
            });
        })();
    </script>"""
        
        # Inject shield script right after the charset tag
        if '<meta charset="UTF-8">' in content:
            content = content.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + shield_script)
        elif '<head>' in content:
            content = content.replace('<head>', '<head>\n' + shield_script)
            
        with open(dst_index, "w", encoding="utf-8") as f:
            f.write(content)
        print("Synced: index.html -> dev/index.html (Dev Security Shield Injected)")
    else:
        print("index.html not found in root directory.")

    print("Synchronization Complete! Changes in main are now inside dev.")

if __name__ == "__main__":
    sync_assets()
