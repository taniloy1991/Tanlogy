import { db, auth } from './lib/firebase.js';
import { collection, getDocs, getDoc, doc, query, orderBy, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const adminRef = doc(db, 'admin_users', user.uid);
            const adminSnap = await getDoc(adminRef);
            if (!adminSnap.exists()) {
                // Not an admin, meaning it's a student
                const formSec = document.getElementById('testimonial-form-section');
                if(formSec) formSec.classList.remove('hidden');
                
                // Add submit event listener
                const testiForm = document.getElementById('student-testimonial-form');
                if (testiForm) {
                    testiForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const name = document.getElementById('testi-name').value;
                        const review = document.getElementById('testi-review').value;
                        const msg = document.getElementById('testi-msg');
                        const sBtn = testiForm.querySelector('button[type="submit"]');
                        
                        msg.textContent = "সাবমিট হচ্ছে...";
                        msg.className = "mt-4 text-sm font-bold text-amber-500";
                        sBtn.disabled = true;
                        
                        try {
                            await addDoc(collection(db, "testimonials"), {
                                name,
                                review,
                                role: 'Student',
                                image_url: '',
                                order: 99
                            });
                            msg.textContent = "ধন্যবাদ! আপনার মতামত সফলভাবে যুক্ত হয়েছে।";
                            msg.className = "mt-4 text-sm font-bold text-green-600";
                            testiForm.reset();
                            
                            // Immediately fetch to show new testimonial
                            setTimeout(() => { fetchAndRenderTestimonials(); }, 1000);
                        } catch (err) {
                            console.error(err);
                            msg.textContent = "মতামত সাবমিট করতে সমস্যা হয়েছে।";
                            msg.className = "mt-4 text-sm font-bold text-red-500";
                        } finally {
                            sBtn.disabled = false;
                        }
                    });
                }
            }
        }
    });

    await fetchWebsiteSettings();
    await fetchAndRenderCourses();
    await fetchAndRenderBlogs();
    await fetchAndRenderTestimonials();
});

// ------------- Settings -------------
const DEFAULT_HERO_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuC4JH_ver9ptFSw68kzmMS1CodJYn7hTf7bSFD8zur75n-jqgn4WkPT5a3SnPqIOst3JCjIPY7nngLT2XKMqigVWJYNJHb97fM6xjdWrGPrJwYgIil6g1CQXVtefXUAi6VrAg8_hq2A9G7Fm2UeXX8F0IhCJbrWrfC9RN3WZw6OSvRPhJhXjiMl_2JNkbizLzYEVbcVFvVpTE3Nr2NmgNwJaCbevfVqk7L8-tRGtIys2RsT2zlgoZgXCCkRDNvxgFhiWwobi5VlwFW2";

function applySettings(data) {
    if(data.hero_title) {
        const titleEl = document.getElementById('hero-title');
        if(titleEl) titleEl.textContent = data.hero_title;
    }
    if(data.hero_subtitle) {
        const subEl = document.getElementById('hero-subtitle');
        if(subEl) subEl.textContent = data.hero_subtitle;
    }
    
    // Image Handling
    const imgEl = document.getElementById('hero-image');
    if(imgEl) {
        const targetUrl = data.hero_image_url || DEFAULT_HERO_IMAGE;
        // Check if src is not already the targeturl or if it's the base64 transparent pixel
        if(imgEl.src !== targetUrl && targetUrl) {
            imgEl.src = targetUrl;
        }
    }

    // Social Area
    const socialContainer = document.getElementById('footer-social-links');
    if(data.social && socialContainer) {
        let sHtml = '';
        if(data.social.facebook) sHtml += `<a class="text-on-surface-variant hover:text-emerald-400 transition-colors" href="${data.social.facebook}" target="_blank"><svg class="w-7 h-7 fill-current hover:-translate-y-1 transition-transform" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>`;
        if(data.social.youtube) sHtml += `<a class="text-on-surface-variant hover:text-emerald-400 transition-colors" href="${data.social.youtube}" target="_blank"><svg class="w-8 h-8 fill-current hover:-translate-y-1 transition-transform" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>`;
        if(data.social.linkedin) sHtml += `<a class="text-on-surface-variant hover:text-emerald-400 transition-colors" href="${data.social.linkedin}" target="_blank"><svg class="w-7 h-7 fill-current hover:-translate-y-1 transition-transform" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>`;
        if(data.social.tiktok) sHtml += `<a class="text-on-surface-variant hover:text-emerald-400 transition-colors" href="${data.social.tiktok}" target="_blank"><svg class="w-7 h-7 fill-current hover:-translate-y-1 transition-transform" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.5-.39 3-1.13 4.25-1.57 2.66-4.66 4.1-7.73 3.82-3.14-.29-5.83-2.26-6.93-5.23-1.07-2.91-.44-6.22 1.68-8.52 1.39-1.51 3.32-2.45 5.38-2.65V11c-1.05.08-2.1.48-2.9 1.16-1.39 1.19-2.01 3.12-1.56 4.9.46 1.83 2.01 3.29 3.86 3.63 2.05.38 4.2-.7 5.09-2.58.53-1.11.75-2.36.75-3.6V.02z"/></svg></a>`;
        socialContainer.innerHTML = sHtml;
    }
}

async function fetchWebsiteSettings() {
    try {
        const cached = localStorage.getItem('tanlogy_settings');
        if(cached) {
            applySettings(JSON.parse(cached));
        }

        const docSnap = await getDoc(doc(db, "website_settings", "global"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            localStorage.setItem('tanlogy_settings', JSON.stringify(data));
            applySettings(data);
        } else {
            // Apply fallback if completely empty
            applySettings({ hero_image_url: DEFAULT_HERO_IMAGE });
        }
    } catch(err) {
        console.error("Failed to load settings:", err);
        // Apply fallback if error
        applySettings({ hero_image_url: DEFAULT_HERO_IMAGE });
    }
}

// ------------- Courses & Curriculum -------------
let allCoursesData = [];

async function fetchAndRenderCourses() {
    try {
        const q = query(collection(db, "courses"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        const courses = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        allCoursesData = courses;
        renderCourseCards(courses);
        
        // Populate navbar dropdown
        const navDropdown = document.getElementById('nav-courses-dropdown');
        if (navDropdown) {
            navDropdown.innerHTML = '';
            courses.forEach(course => {
                navDropdown.innerHTML += `
                    <a href="javascript:void(0)" onclick="openCurriculum('${course.id}')" class="px-5 py-3 hover:bg-surface-container transition flex items-center gap-2 font-bold text-sm text-on-surface">
                        <span class="material-symbols-outlined text-primary text-[18px]">play_lesson</span> ${course.title}
                    </a>
                `;
            });
        }
    } catch(err) {
        console.error("Failed to load courses:", err);
        document.getElementById('frontend-courses-grid').innerHTML = '<p class="text-red-500">Failed to load courses. Please try again later.</p>';
    }
}

function renderCourseCards(courses) {
    const grid = document.getElementById('frontend-courses-grid');
    grid.innerHTML = '';

    courses.forEach((course) => {
        // Build Features list
        let featuresHtml = '';
        if (course.features && Array.isArray(course.features)) {
            course.features.forEach(feat => {
                if(feat.trim() === '') return;
                featuresHtml += `
                    <li class="flex items-start gap-3 text-sm text-on-surface-variant">
                        <span class="material-symbols-outlined text-primary text-xl mt-0.5" style="font-variation-settings: 'FILL' 1;">verified</span>
                        <span>${feat}</span>
                    </li>`;
            });
        }

        const imageHtml = course.image_url ? `<img src="${course.image_url}" class="w-full h-40 object-cover rounded-xl mb-4" alt="${course.title}">` : `<div class="w-full h-40 bg-gray-200 rounded-xl mb-4 animate-pulse flex items-center justify-center text-gray-500"><span class="material-symbols-outlined text-4xl">image</span></div>`;

        const cardHtml = `
            <div onclick="openCurriculum('${course.id}')" class="cursor-pointer bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
                <div class="mb-6 flex-grow relative z-10">
                    ${imageHtml}
                    <h3 class="text-2xl font-bold mb-3 font-headline text-on-surface">${course.title}</h3>
                    <p class="text-on-surface-variant text-sm italic mb-8 border-l-2 border-primary pl-3">${course.subtitle || ''}</p>
                    <ul class="space-y-4 mb-8">
                        ${featuresHtml}
                    </ul>
                </div>
                <a href="checkout.html" onclick="event.stopPropagation(); localStorage.setItem('selectedCourse', '${course.title}')" class="w-full py-4 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-xl font-bold text-center button-settle transition-all relative z-10 shadow-sm hover:scale-[1.02]">Enroll Now</a>
            </div>
        `;
        
        grid.innerHTML += cardHtml;
    });
}

window.openCurriculum = (courseId) => {
    const course = allCoursesData.find(c => c.id === courseId);
    if (!course) return;

    const modal = document.getElementById('curriculum-modal');
    if (!modal) return;
    
    const titleEl = document.getElementById('curriculum-modal-title');
    const contentContainer = document.getElementById('curriculum-content-container');
    
    titleEl.textContent = course.title + ' - সিলেবাস';
    contentContainer.innerHTML = '';

    let modulesHtml = '';
    if(course.modules && Array.isArray(course.modules)) {
        course.modules.forEach((mod, mIndex) => {
            let videosHtml = '';
            if(mod.videos && Array.isArray(mod.videos)) {
                mod.videos.forEach(v => {
                    videosHtml += `<li class="flex gap-3 text-sm"><span class="material-symbols-outlined text-base text-primary">play_circle</span>${v}</li>`;
                });
            }

            modulesHtml += `
                <details class="group bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden" ${mIndex === 0 ? 'open' : ''}>
                    <summary class="flex justify-between items-center cursor-pointer p-6 list-none font-bold text-lg select-none">
                        <div class="flex items-center gap-4">
                            <span class="text-primary bg-primary/10 w-10 h-10 flex flex-col justify-center items-center rounded-lg">${mIndex + 1}</span>
                            <span>${mod.title}</span>
                        </div>
                        <span class="material-symbols-outlined transform group-open:rotate-180 transition-transform duration-300">expand_more</span>
                    </summary>
                    <div class="px-6 pb-6 pt-2 text-on-surface-variant border-t border-outline-variant/10 ml-[56px]">
                        ${mod.description ? `<p class="mb-3 text-sm italic text-primary-fixed-variant">${mod.description}</p>` : ''}
                        <ul class="space-y-3">
                            ${videosHtml}
                        </ul>
                    </div>
                </details>
            `;
        });
    } else {
        modulesHtml = `<p class="text-gray-500 text-center py-4">No modules found for this course.</p>`;
    }

    contentContainer.innerHTML = `<div class="space-y-4">${modulesHtml}</div>`;
    modal.classList.remove('hidden');
};

// ------------- Testimonials -------------
async function fetchAndRenderTestimonials() {
    try {
        const q = query(collection(db, "testimonials"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        const container = document.getElementById('frontend-testimonials-container');
        if(!container) return;

        container.innerHTML = '';
        
        if (snap.empty) {
            container.innerHTML = '<p class="text-center w-full text-gray-500 py-8">কোনো মতামত পাওয়া যায়নি।</p>';
            return;
        }

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const stars = Array(5).fill('<span class="material-symbols-outlined" style="font-variation-settings: &apos;FILL&apos; 1;">star</span>').join('');
            
            // To prevent text from being cut off abruptly, we'll ensure word wrapping
            const html = `
            <div class="min-w-[85vw] md:min-w-[400px] snap-center bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-outline-variant/10 shrink-0 flex flex-col hide-scrollbar" style="max-width: 450px; white-space: normal;">
                <div class="flex gap-1 text-amber-500 mb-6">
                    ${stars}
                </div>
                <p class="text-on-surface-variant mb-8 text-lg font-medium leading-relaxed italic break-words whitespace-normal">"${data.review}"</p>
                <div class="flex items-center gap-4 mt-auto">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container shadow-inner border border-outline-variant/20 shrink-0">
                        <img alt="${data.name}" class="w-full h-full object-cover" src="${data.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name)}"/>
                    </div>
                    <div class="overflow-hidden">
                        <p class="font-bold text-on-surface truncate">${data.name}</p>
                        ${data.role ? `<p class="text-sm text-on-surface-variant truncate">${data.role}</p>` : ''}
                    </div>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    } catch(err) {
        console.error("Failed to load testimonials:", err);
    }
}

// ------------- Blogs -------------
async function fetchAndRenderBlogs() {
    try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const container = document.getElementById('frontend-blogs-container');
        if(!container) return;

        container.innerHTML = '';
        
        if (snap.empty) {
            container.innerHTML = '<p class="text-center w-full text-gray-500 py-8">কোনো ব্লগ পাওয়া যায়নি।</p>';
            return;
        }

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
            
            const html = `
            <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group border border-outline-variant/20">
                <div class="relative h-48 overflow-hidden">
                    <img src="${data.image_url || 'https://via.placeholder.com/600x400'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${data.title}">
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <span class="text-xs font-bold text-primary mb-3 block">${dateStr}</span>
                    <h3 class="text-xl font-bold mb-3 font-headline text-on-surface line-clamp-2">${data.title}</h3>
                    <p class="text-on-surface-variant text-sm mb-6 line-clamp-3">${data.excerpt || ''}</p>
                    <a href="${data.link || '#'}" class="mt-auto text-primary font-bold text-sm hover:text-emerald-700 flex items-center gap-1 transition-colors w-fit">
                        বিস্তারিত পড়ুন <span class="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    } catch(err) {
        console.error("Failed to load blogs:", err);
    }
}
