import { db } from './firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function runMigration() {
    // Prevent multiple runs
    const settingsRef = doc(db, 'website_settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
        console.log("Migration skipped: Data already exists.");
        return;
    }

    console.log("Starting Data Migration...");

    try {
        // 1. Website Settings
        await setDoc(settingsRef, {
            hero_title: "প্র্যাকটিক্যাল এআই স্কিল শিখুন, আপনার ক্যারিয়ারকে অটোমেট করুন",
            hero_subtitle: "ভবিষ্যতের কর্মক্ষেত্রে নিজেকে রিলেভেন্ট রাখতে এআই টুলস এবং স্ট্র্যাটেজি শিখুন। আমাদের এক্সপার্ট গাইডেন্সের সাহায্যে আপনার প্রোডাক্টিভিটি ১০ গুণ বাড়ান।",
            hero_image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4JH_ver9ptFSw68kzmMS1CodJYn7hTf7bSFD8zur75n-jqgn4WkPT5a3SnPqIOst3JCjIPY7nngLT2XKMqigVWJYNJHb97fM6xjdWrGPrJwYgIil6g1CQXVtefXUAi6VrAg8_hq2A9G7Fm2UeXX8F0IhCJbrWrfC9RN3WZw6OSvRPhJhXjiMl_2JNkbizLzYEVbcVFvVpTE3Nr2NmgNwJaCbevfVqk7L8-tRGtIys2RsT2zlgoZgXCCkRDNvxgFhiWwobi5VlwFW2"
        });

        // 2. YouTube Automation Mastery
        const ytRef = doc(db, 'courses', 'youtube-automation');
        await setDoc(ytRef, {
            id: 'youtube-automation',
            title: "YouTube Automation Mastery",
            subtitle: "নিজে ক্যামেরায় না এসেও গ্লোবাল ইউটিউব নিস-এর মাধ্যমে আপনার ক্যারিয়ার ও ইনকাম সিকিউর করুন।",
            features: [
                "টেলিগ্রাম প্রাইভেট গ্রুপ সাপোর্ট",
                "লাইফটাইম এক্সেস ও ফিউচার আপডেট",
                "উচ্চ-আয়ের গ্লোবাল সিপিএম মার্কেট হ্যাকস"
            ],
            image_url: "",
            button_theme: "bg-primary",
            status: "active",
            order: 1,
            modules: [
                {
                    title: "১. রিয়েল লাইফ ইউটিউব হ্যাকস",
                    description: "উদ্দেশ্য: কিভাবে সহজে ইউটিউবে ইনকাম শুরু করবেন।",
                    videos: [
                        "সিক্রেট ইউটিউব নিস ফাইন্ডিং",
                        "এআই দিয়ে অটোমেটেড স্ক্রিপ্টিং"
                    ]
                }
            ]
        });

        // 3. AI Business Automation
        const aiRef = doc(db, 'courses', 'ai-automation');
        await setDoc(aiRef, {
            id: 'ai-automation',
            title: "AI Business Automation",
            subtitle: "এআই এজেন্ট এবং কাস্টম সিস্টেমের মাধ্যমে ব্যবসার কাজ অর্ধেক করে প্রোডাক্টিভিটি বাড়ান।",
            isPopular: true,
            features: [
                "সরাসরি এক্সপার্ট মেন্টরশিপ সেশন",
                "লাইফটাইম এক্সেস ও ফিউচার আপডেট",
                "রিয়েল লাইফ এআই ক্লায়েন্ট প্রজেক্টস"
            ],
            image_url: "",
            button_theme: "bg-gradient-to-r from-primary to-primary-container text-white",
            status: "active",
            order: 2,
            modules: [
                {
                    title: "১. এআই মাইন্ডসেট ও বেসিক্স",
                    description: "উদ্দেশ্য: মানুষের কাজকে এআই দিয়ে সহজ করা এবং উৎপাদনশীলতা বাড়ানো।",
                    videos: [
                        "এআই কেন আপনার শত্রু নয়, বরং সবচেয়ে দক্ষ সহকারী।",
                        "প্রম্পট ইঞ্জিনিয়ারিংয়ের গোপন সূত্র (The Art of Talking to AI)।"
                    ]
                },
                {
                    title: "২. কন্টেন্ট ও মার্কেটিং অটোমেশন",
                    description: "উদ্দেশ্য: কন্টেন্ট ক্রিয়েশনে সময় বাঁচানো।",
                    videos: [
                        "এক মাসে ১ বছরের কন্টেন্ট ক্যালেন্ডার তৈরির কৌশল।",
                        "চ্যাটজিপিটি এবং ক্যানভা ব্যবহার করে বাল্ক কন্টেন্ট ডিজাইন।"
                    ]
                }
            ]
        });

        // 4. Upwork Lead Generation
        const upworkRef = doc(db, 'courses', 'upwork-leads');
        await setDoc(upworkRef, {
            id: 'upwork-leads',
            title: "Upwork Lead Generation",
            subtitle: "সঠিক ক্লায়েন্ট কীভাবে খুঁজে পেতে হয় তা শিখুন এবং ঘরে বসেই ফ্রিল্যান্স ক্যারিয়ার গড়ুন।",
            features: [
                "টেলিগ্রাম প্রাইভেট সাপোর্ট গ্রুপ",
                "লাইফটাইম এক্সেস ও ফিউচার আপডেট",
                "আপওয়ার্ক প্রোফাইল এবং পোর্টফোলিও রিভিউ"
            ],
            image_url: "",
            button_theme: "bg-surface-container-high text-on-surface hover:bg-secondary hover:text-white",
            status: "active",
            order: 3,
            modules: [
                {
                    title: "১. আপওয়ার্ক মাস্টারক্লাস",
                    description: "উদ্দেশ্য: লিড জেনারেশন এবং ক্লায়েন্ট পসিবিলিটি।",
                    videos: [
                        "কীভাবে প্রপোজাল পাঠাতে হবে?",
                        "ক্লায়েন্ট ইন্টারভিউ ক্লোজিং ট্যাকটিক্স"
                    ]
                }
            ]
        });

        console.log("Migration Completed Successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}
