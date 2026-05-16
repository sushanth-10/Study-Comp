/**
 * Profile Manager - Handles user profile display and updates across all pages.
 */

const ProfileManager = {
    state: {
        user: null
    },

    async init() {
        await this.fetchProfile();
        this.renderAll();
        this.setupListeners();
    },

    async fetchProfile() {
        try {
            const resp = await fetch('/api/session');
            if (resp.ok) {
                const data = await resp.json();
                this.state.user = data.user;
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        }
    },

    async updateProfile(name, avatarUrl) {
        try {
            const resp = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatarUrl })
            });
            if (resp.ok) {
                const data = await resp.json();
                this.state.user = { ...this.state.user, ...data.user };
                this.renderAll();
                return true;
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
        return false;
    },

    renderAll() {
        if (!this.state.user) return;

        // Update name displays
        document.querySelectorAll('[data-profile="name"]').forEach(el => {
            el.textContent = this.state.user.name;
        });

        // Update avatar displays
        document.querySelectorAll('[data-profile="avatar"]').forEach(el => {
            this.renderAvatar(el);
        });
    },

    renderAvatar(container) {
        const user = this.state.user;
        if (!user) return;

        container.innerHTML = '';
        container.className = (container.className || '') + ' relative overflow-hidden flex items-center justify-center';

        if (user.avatarUrl) {
            const img = document.createElement('img');
            img.src = user.avatarUrl;
            img.className = 'w-full h-full object-cover';
            img.onerror = () => {
                user.avatarUrl = ''; // Fallback to initial
                this.renderAvatar(container);
            };
            container.appendChild(img);
        } else {
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'S';
            const colors = [
                'bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 
                'bg-rose-600', 'bg-amber-600', 'bg-purple-600'
            ];
            // Simple hash for consistent color
            const colorIdx = (user.name || '').length % colors.length;
            
            container.classList.add(colors[colorIdx], 'text-white', 'font-bold', 'text-lg');
            container.textContent = initial;
        }
    },

    setupListeners() {
        // Add listeners for profile-related triggers if any
        document.querySelectorAll('[data-action="open-profile"]').forEach(el => {
            el.onclick = () => this.openProfileModal();
        });
    },

    openProfileModal() {
        if (window.ProfileModal) {
            window.ProfileModal.open();
        } else {
            // Fallback to prompt if modal script not loaded
            const newName = prompt("Enter your name:", this.state.user.name);
            if (newName !== null) {
                this.updateProfile(newName, this.state.user.avatarUrl);
            }
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ProfileManager.init());
window.ProfileManager = ProfileManager;
