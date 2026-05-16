/**
 * Profile Modal Injector - Adds the profile settings modal to any page.
 */

const ProfileModal = {
    inject() {
        if (document.getElementById('profile-settings-modal')) return;

        const modalHtml = `
            <div id="profile-settings-modal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 class="text-xl font-bold text-slate-800">Profile Settings</h2>
                        <button id="close-profile-modal" class="text-slate-400 hover:text-slate-600 transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="flex flex-col items-center">
                            <div id="modal-avatar-preview" class="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md mb-4 overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400">
                                <!-- Preview here -->
                            </div>
                            <label class="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 transition-colors">
                                <span>Change Image</span>
                                <input type="file" id="profile-upload-input" class="hidden" accept="image/*">
                            </label>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-semibold text-slate-700">Full Name</label>
                            <input type="text" id="profile-name-input" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Enter your name">
                        </div>
                    </div>
                    <div class="p-6 bg-slate-50 flex gap-3">
                        <button id="cancel-profile-btn" class="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                        <button id="save-profile-btn" class="flex-1 px-4 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.setupListeners();
    },

    setupListeners() {
        const modal = document.getElementById('profile-settings-modal');
        const closeBtn = document.getElementById('close-profile-modal');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const fileInput = document.getElementById('profile-upload-input');
        const nameInput = document.getElementById('profile-name-input');
        const preview = document.getElementById('modal-avatar-preview');

        const close = () => modal.classList.add('hidden');

        closeBtn.onclick = close;
        cancelBtn.onclick = close;

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show local preview
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('avatar', file);
            
            try {
                const resp = await fetch('/api/profile/upload-avatar', {
                    method: 'POST',
                    body: formData
                });
                if (resp.ok) {
                    const data = await resp.json();
                    window.ProfileManager.state.user.avatarUrl = data.avatarUrl;
                }
            } catch (err) {
                console.error("Upload failed:", err);
            }
        };

        saveBtn.onclick = async () => {
            const name = nameInput.value.trim();
            if (name) {
                await window.ProfileManager.updateProfile(name, window.ProfileManager.state.user.avatarUrl);
                close();
            }
        };
    },

    open() {
        this.inject();
        const modal = document.getElementById('profile-settings-modal');
        const nameInput = document.getElementById('profile-name-input');
        const preview = document.getElementById('modal-avatar-preview');
        
        const user = window.ProfileManager.state.user;
        nameInput.value = user.name || '';
        window.ProfileManager.renderAvatar(preview);
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.ProfileModal = ProfileModal;
