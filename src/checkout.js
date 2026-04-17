import { auth, db } from './lib/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('checkout-submit-btn');
    const btnText = document.getElementById('checkout-btn-text');
    const spinner = document.getElementById('checkout-spinner');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                alert("অনুগ্রহ করে পেমেন্ট করার আগে লগইন করুন।");
                return;
            }

            const name = document.getElementById('checkout-name').value;
            const email = document.getElementById('checkout-email').value;
            const phone = document.getElementById('checkout-phone').value;
            const trxId = document.getElementById('checkout-trx').value;
            
            // Basic Validation
            if (!name || !email || !phone || !trxId) {
                alert("অনুগ্রহ করে সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন।");
                return;
            }

            // Show loading state
            btnText.textContent = "অপেক্ষা করুন...";
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;

            try {
                // Determine course name (hardcoded or extracted from DOM, using hardcoded for now)
                const courseNameElement = document.querySelector('h4.font-bold.text-on-surface');
                const courseName = courseNameElement ? courseNameElement.textContent.trim() : "AI Automation Masterclass";

                // Save to Firestore
                const docRef = await addDoc(collection(db, "enrollments"), {
                    uid: currentUser.uid,
                    authEmail: currentUser.email,
                    providedName: name,
                    providedEmail: email,
                    providedPhone: phone,
                    courseName: courseName,
                    transactionId: trxId,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });

                // Success Message
                btnText.textContent = "পেমেন্ট সফল!";
                btnText.classList.remove('text-on-primary');
                btnText.classList.add('text-primary-container'); // Optional styling change
                submitBtn.classList.replace('from-primary', 'from-emerald-600');
                submitBtn.classList.replace('to-primary-container', 'to-emerald-400');
                spinner.classList.add('hidden');

                // Redirect after 3s
                setTimeout(() => {
                    window.location.href = "https://t.me/dummy_tanlogy_link";
                }, 3000);

            } catch (error) {
                console.error("Error saving enrollment: ", error);
                alert("সার্ভারে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।");
                
                // Reset loading state
                btnText.textContent = "পেমেন্ট সম্পন্ন করুন";
                spinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }
});
