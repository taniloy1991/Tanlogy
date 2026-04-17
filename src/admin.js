import { auth, db } from './lib/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';

const ADMIN_EMAIL = 'taniloy334@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Protection
    onAuthStateChanged(auth, (user) => {
        if (!user || user.email !== ADMIN_EMAIL) {
            alert("Unauthorized access! Redirecting...");
            window.location.href = 'index.html';
        } else {
            // User is admin, fetch data
            fetchEnrollments();
        }
    });

    const logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'index.html';
        });
    }
});

async function fetchEnrollments() {
    const tbody = document.getElementById('enrollments-table-body');
    
    try {
        const q = query(collection(db, "enrollments"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        tbody.innerHTML = ''; // Clear loader
        
        if (querySnapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        কোনো ডাটা পাওয়া যায়নি।
                    </td>
                </tr>
            `;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Format Status Badge
            let statusBadge = '';
            let actionButtons = '';

            if (data.status === 'approved') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Approved</span>`;
                actionButtons = `<button disabled class="opacity-50 cursor-not-allowed bg-gray-200 text-gray-600 px-3 py-1 rounded font-bold text-xs" title="Already accepted">Done</button>`;
            } else if (data.status === 'rejected') {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Rejected</span>`;
                actionButtons = `<button disabled class="opacity-50 cursor-not-allowed bg-gray-200 text-gray-600 px-3 py-1 rounded font-bold text-xs" title="Already rejected">Done</button>`;
            } else {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Pending</span>`;
                actionButtons = `
                    <button class="bg-primary hover:bg-emerald-700 text-white px-3 py-1 rounded font-bold text-xs transition-colors shadow-sm btn-approve" data-id="${id}">Approve</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold text-xs transition-colors shadow-sm ml-2 btn-reject" data-id="${id}">Reject</button>
                `;
            }

            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition-colors";
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-gray-900">${data.providedName || 'N/A'}</td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${data.providedEmail || 'N/A'}</div>
                    <div class="text-xs text-gray-500">${data.providedPhone || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 font-medium text-primary">${data.courseName || 'N/A'}</td>
                <td class="px-6 py-4 font-mono text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 inline-block mt-3">${data.transactionId || 'N/A'}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    ${actionButtons}
                </td>
            `;
            tbody.appendChild(tr);
        });

        attachActionListeners();

    } catch (error) {
        console.error("Error fetching enrollments: ", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-red-500 font-bold">
                    ডাটা লোড করতে সমস্যা হয়েছে!
                </td>
            </tr>
        `;
    }
}

function attachActionListeners() {
    const approveBtns = document.querySelectorAll('.btn-approve');
    const rejectBtns = document.querySelectorAll('.btn-reject');

    approveBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            await handleStatusChange(id, 'approved', e.target);
        });
    });

    rejectBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const confirmReject = confirm("আপনি কি নিশ্চিত এটি রিজেক্ট করতে চান?");
            if (confirmReject) {
                await handleStatusChange(id, 'rejected', e.target);
            }
        });
    });
}

async function handleStatusChange(docId, newStatus, buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = "...";
    buttonElement.disabled = true;

    try {
        const enrollmentRef = doc(db, "enrollments", docId);
        await updateDoc(enrollmentRef, {
            status: newStatus
        });
        
        // Refresh Table directly after update
        fetchEnrollments();
    } catch (error) {
        console.error(`Error updating status to ${newStatus}:`, error);
        alert("আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
    }
}
