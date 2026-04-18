import { auth, db, storage } from './lib/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, getDoc, query, orderBy, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { runMigration } from './lib/migration.js';

const ADMIN_EMAIL = 'taniloy334@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Protection
    onAuthStateChanged(auth, async (user) => {
        if (!user || user.email !== ADMIN_EMAIL) {
            alert("Unauthorized access! Redirecting...");
            window.location.href = 'index.html';
        } else {
            // Run migration script dynamically initially
            await runMigration();
            
            // Initialization
            fetchEnrollments();
            fetchSettings();
            fetchCourses();
        }
    });

    const logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        });
    }

    // Modal Events
    document.getElementById('close-modal-btn')?.addEventListener('click', closeCourseModal);
    document.getElementById('add-course-btn')?.addEventListener('click', () => openCourseModal());
    document.getElementById('add-module-btn')?.addEventListener('click', addModuleRow);
    document.getElementById('course-form')?.addEventListener('submit', handleCourseSubmit);
    document.getElementById('settings-form')?.addEventListener('submit', handleSettingsSubmit);
});

// ------------- Tab Logic -------------
window.switchAdminTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.replace('block', 'hidden');
    });
    document.getElementById(`view-${tabId}`).classList.replace('hidden', 'block');
    
    // Highlight sidebar
    document.querySelectorAll('aside button').forEach(el => {
        el.classList.remove('bg-primary/10', 'text-primary');
        el.classList.add('text-on-surface-variant');
    });
    const activeTab = document.getElementById(`tab-${tabId}`);
    activeTab.classList.remove('text-on-surface-variant');
    activeTab.classList.add('bg-primary/10', 'text-primary');
};

// ------------- Enrollments Logic -------------
async function fetchEnrollments() {
    const tbody = document.getElementById('enrollments-table-body');
    if(!tbody) return;
    try {
        const q = query(collection(db, "enrollments"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        tbody.innerHTML = '';
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">কোনো ডাটা পাওয়া যায়নি।</td></tr>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            let statusBadge = '';
            let actionButtons = '';
            if (data.status === 'approved') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Approved</span>`;
                actionButtons = `<button disabled class="opacity-50 bg-gray-200 px-3 py-1 rounded font-bold text-xs">Done</button>`;
            } else if (data.status === 'rejected') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Rejected</span>`;
                actionButtons = `<button disabled class="opacity-50 bg-gray-200 px-3 py-1 rounded font-bold text-xs">Done</button>`;
            } else {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Pending</span>`;
                actionButtons = `
                    <button class="bg-primary hover:bg-emerald-700 text-white px-3 py-1 rounded font-bold text-xs btn-approve" data-id="${id}">Approve</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold text-xs ml-2 btn-reject" data-id="${id}">Reject</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold">${data.providedName || 'N/A'}</td>
                <td class="px-6 py-4">
                    <div class="text-sm border-b pb-1 mb-1">${data.providedEmail || 'N/A'}</div>
                    <div class="text-xs text-gray-500">স্টুডেন্ট: ${data.providedPhone || 'N/A'}</div>
                    ${data.senderPhone ? `<div class="text-xs text-primary font-bold mt-1">সেন্ডার: ${data.senderPhone}</div>` : ''}
                </td>
                <td class="px-6 py-4 font-medium text-primary">${data.courseName || 'N/A'}</td>
                <td class="px-6 py-4 font-mono text-xs">${data.transactionId || 'N/A'}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-approve').forEach(btn => btn.addEventListener('click', (e) => handleStatusChange(e.target.getAttribute('data-id'), 'approved', e.target)));
        document.querySelectorAll('.btn-reject').forEach(btn => btn.addEventListener('click', (e) => confirm("নিশ্চিত রিজেক্ট?") && handleStatusChange(e.target.getAttribute('data-id'), 'rejected', e.target)));
    } catch (error) { console.error(error); }
}

async function handleStatusChange(docId, newStatus, btn) {
    btn.textContent = "..."; btn.disabled = true;
    try {
        await updateDoc(doc(db, "enrollments", docId), { status: newStatus });
        fetchEnrollments();
    } catch (error) { alert("Error!"); btn.disabled = false; }
}

// ------------- File Upload General Function -------------
async function uploadImage(file, folderPath) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const storageRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null, (error) => reject(error), async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
        });
    });
}

// ------------- Settings Logic -------------
async function fetchSettings() {
    const docRef = doc(db, "website_settings", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const d = docSnap.data();
        document.getElementById('setting-hero-title').value = d.hero_title || '';
        document.getElementById('setting-hero-subtitle').value = d.hero_subtitle || '';
        if (d.hero_image_url) {
            const img = document.getElementById('setting-hero-preview');
            img.src = d.hero_image_url;
            img.classList.remove('hidden');
        }
    }
}

async function handleSettingsSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('settings-save-btn');
    btn.textContent = "Uploading...";
    btn.disabled = true;

    try {
        const title = document.getElementById('setting-hero-title').value;
        const sub = document.getElementById('setting-hero-subtitle').value;
        const fileInput = document.getElementById('setting-hero-image').files[0];
        
        let updateData = { hero_title: title, hero_subtitle: sub };
        
        if (fileInput) {
            const url = await uploadImage(fileInput, 'hero_images');
            updateData.hero_image_url = url;
            const img = document.getElementById('setting-hero-preview');
            img.src = url;
            img.classList.remove('hidden');
        }

        await updateDoc(doc(db, "website_settings", "global"), updateData);
        alert("Settings Saved!");
    } catch(err) { console.error(err); alert("Error saving settings."); }
    btn.textContent = "সেভ পরিবর্তন";
    btn.disabled = false;
}

// ------------- Courses Logic -------------
let currentCourses = [];

async function fetchCourses() {
    const grid = document.getElementById('admin-courses-grid');
    grid.innerHTML = '<div class="text-gray-500">লোডিং...</div>';
    try {
        const q = query(collection(db, "courses"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        currentCourses = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        grid.innerHTML = '';
        currentCourses.forEach(course => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 border border-gray-200 rounded-xl shadow-sm flex flex-col gap-4";
            card.innerHTML = `
                <div class="flex gap-4">
                    <img src="${course.image_url || 'https://via.placeholder.com/150'}" class="w-24 h-24 object-cover rounded-lg">
                    <div>
                        <h3 class="font-bold text-lg">${course.title}</h3>
                        <p class="text-sm text-gray-500 line-clamp-2">${course.subtitle}</p>
                        <span class="text-xs bg-gray-100 px-2 py-1 rounded font-mono mt-1 inline-block">Order: ${course.order}</span>
                    </div>
                </div>
                <div class="flex gap-2 mt-auto pt-4 border-t">
                    <button class="btn-edit-course flex-1 text-center py-2 bg-primary/10 text-primary rounded font-bold hover:bg-primary/20" data-id="${course.id}">Edit</button>
                    <button class="btn-delete-course flex-1 text-center py-2 bg-red-100 text-red-600 rounded font-bold hover:bg-red-200" data-id="${course.id}">Delete</button>
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-course').forEach(b => b.addEventListener('click', (e) => {
            const c = currentCourses.find(x => x.id === e.target.getAttribute('data-id'));
            openCourseModal(c);
        }));

        document.querySelectorAll('.btn-delete-course').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm("Are you sure you want to delete this course forever?")) {
                await deleteDoc(doc(db, "courses", e.target.getAttribute('data-id')));
                fetchCourses();
            }
        }));
    } catch(err) { console.error(err); }
}

function openCourseModal(course = null) {
    document.getElementById('course-modal').classList.remove('hidden');
    document.getElementById('modules-container').innerHTML = ''; // reset

    if(course) {
        document.getElementById('modal-title').textContent = "কোর্স সম্পাদনা";
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-title').value = course.title || '';
        document.getElementById('course-order').value = course.order || 1;
        document.getElementById('course-subtitle').value = course.subtitle || '';
        document.getElementById('course-btn-theme').value = course.button_theme || '';
        
        if (course.features) {
            document.getElementById('course-feat-1').value = course.features[0] || '';
            document.getElementById('course-feat-2').value = course.features[1] || '';
            document.getElementById('course-feat-3').value = course.features[2] || '';
        }

        if (course.image_url) {
            const pre = document.getElementById('course-image-preview');
            pre.src = course.image_url;
            pre.classList.remove('hidden');
        } else {
            document.getElementById('course-image-preview').classList.add('hidden');
        }

        if(course.modules) {
            course.modules.forEach(m => addModuleRow(m.title, m.description, m.videos.join('\n')));
        }
    } else {
        document.getElementById('modal-title').textContent = "নতুন কোর্স";
        document.getElementById('course-form').reset();
        document.getElementById('course-id').value = '';
        document.getElementById('course-image-preview').classList.add('hidden');
        addModuleRow(); // 1 empty module
    }
}

function closeCourseModal() {
    document.getElementById('course-modal').classList.add('hidden');
}

function addModuleRow(title = '', desc = '', videos = '') {
    const container = document.getElementById('modules-container');
    const div = document.createElement('div');
    div.className = "p-4 border border-gray-200 rounded-lg bg-gray-50 flex gap-4 module-row";
    div.innerHTML = `
        <div class="flex-1 space-y-3">
            <input type="text" class="mod-title w-full px-3 py-2 border rounded" placeholder="মডিউল টাইটেল (e.g. ১. বেসিক্স)" value="${title}">
            <input type="text" class="mod-desc w-full px-3 py-2 border rounded" placeholder="ডেসক্রিপশন" value="${desc}">
            <textarea class="mod-videos w-full px-3 py-2 border rounded text-sm" rows="3" placeholder="ভিডিও লিস্ট (প্রতি লাইনে একটি) \nভিডিও ১ \nভিডিও ২">${videos}</textarea>
        </div>
        <button type="button" class="text-red-500 hover:text-red-700" onclick="this.parentElement.remove()"><span class="material-symbols-outlined">delete</span></button>
    `;
    container.appendChild(div);
}

// Global for inline onclick
window.removeModuleRow = (btn) => btn.parentElement.remove();

async function handleCourseSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('save-course-btn');
    btn.textContent = "Saving..."; btn.disabled = true;

    try {
        const idInput = document.getElementById('course-id').value;
        const docId = idInput || `course_${Date.now()}`;
        
        const title = document.getElementById('course-title').value;
        const subtitle = document.getElementById('course-subtitle').value;
        const order = parseInt(document.getElementById('course-order').value) || 1;
        const btnTheme = document.getElementById('course-btn-theme').value;
        
        const features = [
            document.getElementById('course-feat-1').value,
            document.getElementById('course-feat-2').value,
            document.getElementById('course-feat-3').value
        ];

        // Modules
        const modules = [];
        document.querySelectorAll('.module-row').forEach(row => {
            const mt = row.querySelector('.mod-title').value;
            const md = row.querySelector('.mod-desc').value;
            const mv = row.querySelector('.mod-videos').value.split('\n').filter(x => x.trim().length > 0);
            if(mt) modules.push({ title: mt, description: md, videos: mv });
        });

        const updateData = {
            title, subtitle, order, button_theme: btnTheme, features, modules, status: "active"
        };
        // Add ID field inside document
        if(!idInput) updateData.id = docId; else updateData.id = idInput;

        const fileInput = document.getElementById('course-image').files[0];
        if (fileInput) {
            updateData.image_url = await uploadImage(fileInput, `course_images/${docId}`);
        }

        await setDoc(doc(db, "courses", docId), updateData, { merge: true });
        
        closeCourseModal();
        fetchCourses();
    } catch(err) { console.error(err); alert("Error saving course!"); }
    
    btn.textContent = "সেভ করুন"; btn.disabled = false;
}
