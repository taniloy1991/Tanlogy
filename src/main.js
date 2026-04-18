import { db } from './lib/firebase.js';
import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    await fetchWebsiteSettings();
    await fetchAndRenderCourses();
    await fetchAndRenderTestimonials();
});

// ------------- Settings -------------
async function fetchWebsiteSettings() {
    try {
        const docSnap = await getDoc(doc(db, "website_settings", "global"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Hero
            if(data.hero_title) {
                const titleEl = document.getElementById('hero-title');
                if(titleEl) titleEl.textContent = data.hero_title;
            }
            if(data.hero_subtitle) {
                const subEl = document.getElementById('hero-subtitle');
                if(subEl) subEl.textContent = data.hero_subtitle;
            }
            if(data.hero_image_url) {
                const imgEl = document.getElementById('hero-image');
                if(imgEl) imgEl.src = data.hero_image_url;
            }
        }
    } catch(err) {
        console.error("Failed to load settings:", err);
    }
}

// ------------- Courses & Curriculum -------------
async function fetchAndRenderCourses() {
    try {
        const q = query(collection(db, "courses"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        const courses = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        renderCourseCards(courses);
        renderCurriculum(courses);
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

        const isPopularBadge = course.isPopular ? `<div class="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest z-10">Popular</div>` : '';
        const imageHtml = course.image_url ? `<img src="${course.image_url}" class="w-full h-40 object-cover rounded-xl mb-4" alt="${course.title}">` : `<div class="w-full h-40 bg-gray-200 rounded-xl mb-4 animate-pulse flex items-center justify-center text-gray-500"><span class="material-symbols-outlined text-4xl">image</span></div>`;
        const themeStr = course.button_theme || 'bg-primary text-on-primary';

        const cardHtml = `
            <div class="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
                ${isPopularBadge}
                <div class="mb-6 flex-grow relative z-10">
                    ${imageHtml}
                    <h3 class="text-2xl font-bold mb-3 font-headline text-on-surface">${course.title}</h3>
                    <p class="text-on-surface-variant text-sm italic mb-8 border-l-2 border-primary pl-3">${course.subtitle || ''}</p>
                    <ul class="space-y-4 mb-8">
                        ${featuresHtml}
                    </ul>
                </div>
                <a href="checkout.html" onclick="localStorage.setItem('selectedCourse', '${course.title}')" class="w-full py-4 ${themeStr} rounded-xl font-bold text-center button-settle transition-all relative z-10 shadow-md hover:scale-[1.02]">Enroll Now</a>
            </div>
        `;
        
        grid.innerHTML += cardHtml;
    });
}

function renderCurriculum(courses) {
    const tabsContainer = document.getElementById('curriculum-tabs-container');
    const contentContainer = document.getElementById('curriculum-content-container');
    
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    courses.forEach((course, index) => {
        // Tab Button
        const isActive = index === 0;
        const btnClass = isActive 
            ? "flex-1 py-4 px-6 rounded-xl font-bold transition-all bg-primary text-white shadow-lg button-settle curr-tab-btn"
            : "flex-1 py-4 px-6 rounded-xl font-bold transition-all bg-surface-container-high text-on-surface hover:bg-surface-container-highest button-settle curr-tab-btn";
            
        const btnHtml = `<button onclick="window.switchCurrTab('${course.id}')" id="tab-curr-${course.id}" class="${btnClass}">${course.title}</button>`;
        tabsContainer.innerHTML += btnHtml;

        // Content
        const contentClass = isActive ? "space-y-4 curr-tab-content block" : "space-y-4 curr-tab-content hidden";
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

        const contentHtml = `<div id="content-curr-${course.id}" class="${contentClass}">${modulesHtml}</div>`;
        contentContainer.innerHTML += contentHtml;
    });

    // Make switchTab available globally
    window.switchCurrTab = (courseId) => {
        document.querySelectorAll('.curr-tab-content').forEach(el => {
            el.classList.replace('block', 'hidden');
        });
        document.getElementById(`content-curr-${courseId}`).classList.replace('hidden', 'block');

        document.querySelectorAll('.curr-tab-btn').forEach(btn => {
            btn.className = "flex-1 py-4 px-6 rounded-xl font-bold transition-all bg-surface-container-high text-on-surface hover:bg-surface-container-highest button-settle curr-tab-btn";
        });
        const activeBtn = document.getElementById(`tab-curr-${courseId}`);
        activeBtn.className = "flex-1 py-4 px-6 rounded-xl font-bold transition-all bg-primary text-white shadow-lg button-settle curr-tab-btn";
    };
}

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
            const stars = Array(5).fill('<span class="material-symbols-outlined" style="font-variation-settings: \\'FILL\\' 1;">star</span>').join('');
            
            // To prevent text from being cut off abruptly, we'll ensure word wrapping
            const html = \`
            <div class="min-w-[85vw] md:min-w-[400px] snap-center bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-outline-variant/10 shrink-0 flex flex-col hide-scrollbar" style="max-width: 450px; white-space: normal;">
                <div class="flex gap-1 text-amber-500 mb-6">
                    \${stars}
                </div>
                <p class="text-on-surface-variant mb-8 text-lg font-medium leading-relaxed italic break-words whitespace-normal">"\${data.review}"</p>
                <div class="flex items-center gap-4 mt-auto">
                    <div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container shadow-inner border border-outline-variant/20 shrink-0">
                        <img alt="\${data.name}" class="w-full h-full object-cover" src="\${data.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name)}"/>
                    </div>
                    <div class="overflow-hidden">
                        <p class="font-bold text-on-surface truncate">\${data.name}</p>
                        \${data.role ? \`<p class="text-sm text-on-surface-variant truncate">\${data.role}</p>\` : ''}
                    </div>
                </div>
            </div>\`;
            container.innerHTML += html;
        });
    } catch(err) {
        console.error("Failed to load testimonials:", err);
    }
}
