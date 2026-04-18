import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, getDoc, query, orderBy, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { runMigration } from './lib/migration.js';

const ADMIN_EMAIL = 'taniloy334@gmail.com';

const withTimeout = (promise, ms, errorMessage) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
    ]);
};

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
            fetchBlogs();
            fetchTestimonials();
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
    if (!file) return null;
    const storageRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
    
    // Add a 15-second timeout. Firebase Storage SDK will hang indefinitely on invalid buckets.
    const snapshot = await withTimeout(
        uploadBytes(storageRef, file), 
        15000, 
        "Image Upload Timeout. Please check your Firebase Storage rules and Environment Variables (.env) on Vercel."
    );
    return await getDownloadURL(snapshot.ref);
}

// ------------- Settings Logic -------------
async function fetchSettings() {
    const docRef = doc(db, "website_settings", "global");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const d = docSnap.data();
        document.getElementById('setting-hero-title').value = d.hero_title || '';
        document.getElementById('setting-hero-subtitle').value = d.hero_subtitle || '';
        document.getElementById('setting-hero-image-url').value = d.hero_image_url || '';
        // Social Media
        if(d.social) {
            document.getElementById('setting-social-facebook').value = d.social.facebook || '';
            document.getElementById('setting-social-tiktok').value = d.social.tiktok || '';
            document.getElementById('setting-social-youtube').value = d.social.youtube || '';
            document.getElementById('setting-social-linkedin').value = d.social.linkedin || '';
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
        const imgUrl = document.getElementById('setting-hero-image-url').value;
        const socialFb = document.getElementById('setting-social-facebook').value;
        const socialTk = document.getElementById('setting-social-tiktok').value;
        const socialYt = document.getElementById('setting-social-youtube').value;
        const socialLi = document.getElementById('setting-social-linkedin').value;
        
        let updateData = { 
            hero_title: title, 
            hero_subtitle: sub,
            hero_image_url: imgUrl,
            social: {
                facebook: socialFb,
                tiktok: socialTk,
                youtube: socialYt,
                linkedin: socialLi
            }
        };

        await withTimeout(
            setDoc(doc(db, "website_settings", "global"), updateData, { merge: true }),
            10000,
            "Database Timeout: Could not connect to Firebase Firestore. Check permissions and Vercel Environment Variables."
        );
        alert("Settings Saved!");
    } catch(err) { 
        console.error(err); 
        alert("Upload Error: " + (err.message || "Unknown error occurred."));
    }
    
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

        document.getElementById('course-image-url').value = course.image_url || '';

        if(course.modules) {
            course.modules.forEach(m => addModuleRow(m.title, m.description, m.videos.join('\n')));
        }
    } else {
        document.getElementById('modal-title').textContent = "নতুন কোর্স";
        document.getElementById('course-form').reset();
        document.getElementById('course-id').value = '';
        document.getElementById('course-image-url').value = '';
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

        const imgUrl = document.getElementById('course-image-url').value;
        if(imgUrl) updateData.image_url = imgUrl;

        await withTimeout(
            setDoc(doc(db, "courses", docId), updateData, { merge: true }),
            10000,
            "Database Timeout: Could not connect to Firebase Firestore."
        );
        
        closeCourseModal();
        fetchCourses();
    } catch(err) { 
        console.error(err); 
        alert("Error saving course: " + (err.message || "Unknown error")); 
    }
    
    btn.textContent = "সেভ করুন"; btn.disabled = false;
}

// -------------------------------------------------------------------------------------------------
// 5. TESTIMONIALS MANAGEMENT
// -------------------------------------------------------------------------------------------------

window.openTestimonialModal = (docId = null) => {
    document.getElementById('testimonial-form').reset();
    document.getElementById('testimonial-id').value = docId || '';
    document.getElementById('testimonial-modal-title').textContent = docId ? 'এডিট মতামত' : 'নতুন মতামত';
    
    if (docId) {
        // Fetch specific testimonial
        getDoc(doc(db, "testimonials", docId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                document.getElementById('testi-name').value = data.name || '';
                document.getElementById('testi-role').value = data.role || '';
                document.getElementById('testi-order').value = data.order || 1;
                document.getElementById('testi-review').value = data.review || '';
                document.getElementById('testi-image-url').value = data.image_url || '';
            }
        }).catch(err => console.error("Error fetching testimonial:", err));
    }

    document.getElementById('testimonial-modal').classList.remove('hidden');
};

window.closeTestimonialModal = () => {
    document.getElementById('testimonial-modal').classList.add('hidden');
};

document.getElementById('close-testimonial-modal-btn')?.addEventListener('click', closeTestimonialModal);

document.getElementById('testimonial-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('testimonial-save-btn');
    btn.textContent = "Saving..."; btn.disabled = true;

    try {
        const idInput = document.getElementById('testimonial-id').value;
        const docId = idInput || (Date.now().toString()); // Simple unique ID
        
        const data = {
            name: document.getElementById('testi-name').value,
            role: document.getElementById('testi-role').value,
            order: parseInt(document.getElementById('testi-order').value) || 1,
            review: document.getElementById('testi-review').value,
        };

        const imgUrl = document.getElementById('testi-image-url').value;
        if(imgUrl) data.image_url = imgUrl;

        await withTimeout(
            setDoc(doc(db, "testimonials", docId), data, { merge: true }),
            10000,
            "Database Timeout: Could not connect to Firebase Firestore."
        );
        
        closeTestimonialModal();
        fetchTestimonials();
    } catch(err) {
        console.error(err);
        alert("Error saving testimonial: " + (err.message || "Unknown error"));
    }
    
    btn.textContent = "সেভ করুন"; btn.disabled = false;
});

window.deleteTestimonial = async (docId) => {
    if(!confirm('আপনি কি নিশ্চিত যে এই মতামতটি মুছে ফেলতে চান?')) return;
    try {
        await withTimeout(
            deleteDoc(doc(db, "testimonials", docId)),
            10000,
            "Database Timeout"
        );
        fetchTestimonials();
    } catch(err) {
        console.error("Error deleting testimonial:", err);
        alert("Error deleting testimonial: " + err.message);
    }
}

async function fetchTestimonials() {
    try {
        const container = document.getElementById('admin-testimonials-container');
        if(!container) return; // Wait in case admin.html isn't fully loaded

        const q = query(collection(db, "testimonials"), orderBy("order", "asc"));
        
        const snap = await withTimeout(getDocs(q), 10000, "Database Timeout: fetchTestimonials");
        
        container.innerHTML = '';

        if(snap.empty) {
            container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">কোনো মতামত পাওয়া যায়নি।</td></tr>`;
            return;
        }

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-4 align-top">
                    <img src="\${data.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name)}" alt="\${data.name}" class="w-10 h-10 rounded-full object-cover border border-outline-variant/30">
                </td>
                <td class="p-4 align-top">
                    <p class="font-bold">\${data.name}</p>
                    <p class="text-xs text-on-surface-variant">\${data.role || '-'}</p>
                </td>
                <td class="p-4 align-top max-w-[300px]">
                    <p class="text-xs italic line-clamp-2 text-on-surface-variant whitespace-normal">"\${data.review}"</p>
                </td>
                <td class="p-4 align-top font-mono text-sm">\${data.order || 0}</td>
                <td class="p-4 align-top text-right space-x-2">
                    <button onclick="openTestimonialModal('\${id}')" class="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded">Edit</button>
                    <button onclick="deleteTestimonial('\${id}')" class="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 px-3 py-1 rounded">Delete</button>
                </td>
            `;
            container.appendChild(tr);
        });
    } catch(err) {
        console.error("Error fetching testimonials:", err);
    }
}

// -------------------------------------------------------------------------------------------------
// 6. BLOGS MANAGEMENT
// -------------------------------------------------------------------------------------------------

window.openBlogModal = (docId = null) => {
    document.getElementById('blog-form').reset();
    document.getElementById('blog-id').value = docId || '';
    document.getElementById('blog-modal-title').textContent = docId ? 'এডিট ব্লগ' : 'নতুন ব্লগ';
    
    if (docId) {
        getDoc(doc(db, "blogs", docId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                document.getElementById('blog-title').value = data.title || '';
                document.getElementById('blog-excerpt').value = data.excerpt || '';
                document.getElementById('blog-link').value = data.link || '';
                document.getElementById('blog-image-url').value = data.image_url || '';
            }
        }).catch(err => console.error("Error fetching blog:", err));
    }

    document.getElementById('blog-modal').classList.remove('hidden');
};

window.closeBlogModal = () => {
    document.getElementById('blog-modal').classList.add('hidden');
};

document.getElementById('blog-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('blog-save-btn');
    btn.textContent = "Saving..."; btn.disabled = true;

    try {
        const idInput = document.getElementById('blog-id').value;
        const docId = idInput || `blog_${Date.now()}`;
        
        const data = {
            title: document.getElementById('blog-title').value,
            excerpt: document.getElementById('blog-excerpt').value,
            link: document.getElementById('blog-link').value,
            createdAt: serverTimestamp() // We leave this even for update, or just use new Date if we want simpler
        };
        
        // Only set createdAt if new
        if(!idInput) {
            data.createdAt = new Date();
        } else {
            delete data.createdAt; // Don't overwrite existing
        }

        const imgUrl = document.getElementById('blog-image-url').value;
        if(imgUrl) data.image_url = imgUrl;

        await withTimeout(
            setDoc(doc(db, "blogs", docId), data, { merge: true }),
            10000,
            "Database Timeout: Could not connect to Firebase Firestore."
        );
        
        closeBlogModal();
        fetchBlogs();
    } catch(err) {
        console.error(err);
        alert("Error saving blog: " + (err.message || "Unknown error"));
    }
    
    btn.textContent = "সেভ করুন"; btn.disabled = false;
});

window.deleteBlog = async (docId) => {
    if(!confirm('আপনি কি নিশ্চিত যে এই ব্লগটি মুছে ফেলতে চান?')) return;
    try {
        await withTimeout(
            deleteDoc(doc(db, "blogs", docId)),
            10000,
            "Database Timeout"
        );
        fetchBlogs();
    } catch(err) {
        console.error("Error deleting blog:", err);
        alert("Error deleting blog: " + err.message);
    }
}

async function fetchBlogs() {
    try {
        const container = document.getElementById('admin-blogs-container');
        if(!container) return;

        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snap = await withTimeout(getDocs(q), 10000, "Database Timeout: fetchBlogs");
        
        container.innerHTML = '';

        if(snap.empty) {
            container.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">কোনো ব্লগ পাওয়া যায়নি।</td></tr>`;
            return;
        }

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const dateStr = data.createdAt && data.createdAt.toMillis ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'N/A';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-4 align-top">
                    <img src="${data.image_url || 'https://via.placeholder.com/150'}" alt="${data.title}" class="w-16 h-10 rounded object-cover border border-outline-variant/30">
                </td>
                <td class="p-4 align-top w-1/3">
                    <p class="font-bold line-clamp-2">${data.title}</p>
                </td>
                <td class="p-4 align-top text-sm">
                    ${dateStr}
                </td>
                <td class="p-4 align-top text-right space-x-2">
                    <button onclick="openBlogModal('${id}')" class="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded">Edit</button>
                    <button onclick="deleteBlog('${id}')" class="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 px-3 py-1 rounded">Delete</button>
                </td>
            `;
            container.appendChild(tr);
        });
    } catch(err) {
        console.error("Error fetching blogs:", err);
    }
}
