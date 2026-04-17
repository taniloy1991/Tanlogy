import { auth } from './firebase.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    const loginBtns = document.querySelectorAll('#auth-login-btn');
    const userProfiles = document.querySelectorAll('#auth-user-profile');
    const userNames = document.querySelectorAll('#auth-user-name');
    const userAvatars = document.querySelectorAll('#auth-user-avatar');
    const userFallbacks = document.querySelectorAll('#auth-user-fallback');
    const logoutBtns = document.querySelectorAll('#auth-logout-btn');

    // Handle Login
    loginBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Error during login:", error);
            }
        });
    });

    // Handle Logout
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Error during logout:", error);
            }
        });
    });

    // Listen to Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            loginBtns.forEach(btn => btn.classList.add('hidden'));
            userProfiles.forEach(profile => {
                profile.classList.remove('hidden');
                profile.classList.add('flex');
                
                // Add Admin link if email matches
                if (user.email === 'taniloy334@gmail.com') {
                    // Prevent duplicate injections
                    if (!profile.querySelector('.admin-link')) {
                        const dropdown = profile.querySelector('.absolute');
                        const adminBtn = document.createElement('a');
                        adminBtn.href = '/admin.html';
                        adminBtn.className = 'admin-link block w-full text-left px-4 py-3 text-sm font-bold text-primary hover:bg-primary-container/20 transition-colors flex items-center gap-2 justify-end border-b border-outline-variant/20';
                        adminBtn.innerHTML = `
                            অ্যাডমিন প্যানেল
                            <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        `;
                        // Insert before the logout button
                        dropdown.insertBefore(adminBtn, dropdown.querySelector('#auth-logout-btn'));
                    }
                }
            });
            
            // Set User Info
            const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
            
            userNames.forEach(nameEl => nameEl.textContent = `স্বাগতম, ${firstName}`);
            
            userAvatars.forEach((avatarEl, idx) => {
                if (user.photoURL) {
                    avatarEl.src = user.photoURL;
                    avatarEl.classList.remove('hidden');
                    userFallbacks[idx].classList.add('hidden');
                } else {
                    avatarEl.classList.add('hidden');
                    userFallbacks[idx].classList.remove('hidden');
                }
            });
        } else {
            // User is signed out
            loginBtns.forEach(btn => {
                btn.classList.remove('hidden');
                btn.classList.add('flex');
            });
            userProfiles.forEach(profile => {
                profile.classList.add('hidden');
                profile.classList.remove('flex');
            });
        }
    });
});
