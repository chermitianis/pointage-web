// ===== contact.js - التواصل مع المطور =====

// ===== التواصل عبر البريد الإلكتروني =====
function contactByEmail() {
    // جمع بعض المعلومات عن المستخدم لمساعدة المطور
    const userData = getUserContactInfo();
    const subject = encodeURIComponent('مشكلة في تطبيق Pointage - ' + userData.device);
    const body = encodeURIComponent(
        'الرجاء كتابة تفاصيل مشكلتك هنا...\n\n' +
        '─────────────────────────────\n' +
        '📱 معلومات الجهاز:\n' +
        '• النظام: ' + userData.os + '\n' +
        '• المتصفح: ' + userData.browser + '\n' +
        '• اللغة: ' + userData.language + '\n' +
        '• إصدار التطبيق: ' + userData.appVersion + '\n' +
        '• عدد مرات الفتح: ' + userData.openCount + '\n' +
        '─────────────────────────────\n\n' +
        '📝 وصف المشكلة:\n'
    );
    
    // فتح عميل البريد الإلكتروني
    const email = (window.DEVELOPER_INFO && DEVELOPER_INFO.email) || 'dev@example.com';
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    // تسجيل استخدام الميزة
    if (typeof trackFeature !== 'undefined') {
        trackFeature('contact_email');
    }
    
    showToast(settings.language === 'ar' ? '📧 جاري فتح البريد الإلكتروني...' : '📧 Ouverture de l\'email...', 2000);
}

// ===== التواصل عبر واتساب =====
function contactByWhatsApp() {
    // رقم هاتف المطور (من الملف المشترك developerInfo.js)
    const phoneNumber = (window.DEVELOPER_INFO && DEVELOPER_INFO.whatsappNumber) || '216XXXXXXXX';
    
    // رسالة افتراضية مع معلومات مفيدة
    const userData = getUserContactInfo();
    const message = encodeURIComponent(
        'مرحباً، لدي مشكلة في تطبيق Pointage.\n\n' +
        '📱 معلومات الجهاز:\n' +
        '• النظام: ' + userData.os + '\n' +
        '• المتصفح: ' + userData.browser + '\n' +
        '• إصدار التطبيق: ' + userData.appVersion + '\n' +
        '• عدد مرات الفتح: ' + userData.openCount + '\n\n' +
        '📝 وصف المشكلة:\n'
    );
    
    // فتح واتساب
    // ملاحظة: نستخدم location.href وليس window.open، لأن window.open (وأي
    // target="_blank") يمر بمسار onCreateWindow في WebView، وهو غير مُفعَّل
    // هنا عمداً. location.href يمر بمسار shouldOverrideUrlLoading في
    // MainActivity.kt الذي يفتح واتساب مباشرة على محادثة مع الرقم المحدد.
    window.location.href = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // تسجيل استخدام الميزة
    if (typeof trackFeature !== 'undefined') {
        trackFeature('contact_whatsapp');
    }
    
    showToast(settings.language === 'ar' ? '💬 جاري فتح واتساب...' : '💬 Ouverture de WhatsApp...', 2000);
}

// ===== الحصول على معلومات المستخدم للتواصل =====
function getUserContactInfo() {
    // محاولة الحصول على بيانات المستخدم من نظام الخصوصية
    let userData = {};
    
    if (typeof getUserData !== 'undefined') {
        const data = getUserData();
        if (data) {
            userData = {
                os: data.deviceInfo?.platform || 'غير معروف',
                browser: navigator.userAgent.split(' ').slice(-2).join(' ') || 'غير معروف',
                language: data.deviceInfo?.language || navigator.language || 'ar',
                appVersion: data.appVersion || '3.0',
                openCount: data.openCount || 0,
                device: data.deviceInfo?.userAgent?.substring(0, 50) || 'جهاز غير معروف'
            };
        }
    }
    
    // إكمال البيانات الناقصة
    if (!userData.os) userData.os = navigator.platform || 'غير معروف';
    if (!userData.browser) userData.browser = navigator.userAgent.split(' ').slice(-2).join(' ') || 'غير معروف';
    if (!userData.language) userData.language = navigator.language || 'ar';
    if (!userData.appVersion) userData.appVersion = '3.0';
    if (!userData.openCount) userData.openCount = 0;
    if (!userData.device) userData.device = navigator.userAgent?.substring(0, 50) || 'جهاز غير معروف';
    
    return userData;
}

// ===== عرض معلومات الاتصال =====
function showContactInfo() {
    const d = window.DEVELOPER_INFO || {};
    const email = d.email || 'dev@example.com';
    const whatsapp = d.whatsappNumber || '216XXXXXXXX';

    const info = settings.language === 'ar' 
        ? `📞 يمكنك التواصل معنا عبر:\n\n📧 البريد الإلكتروني: ${email}\n💬 واتساب: +${whatsapp}\n\nسنسعد بخدمتك!`
        : `📞 Vous pouvez nous contacter via:\n\n📧 Email: ${email}\n💬 WhatsApp: +${whatsapp}\n\nNous serons ravis de vous aider!`;
    
    alert(info);
}

// ===== ربط الدوال بالكائن العام =====
window.contactByEmail = contactByEmail;
window.contactByWhatsApp = contactByWhatsApp;
window.getUserContactInfo = getUserContactInfo;
window.showContactInfo = showContactInfo;

console.log('contact.js loaded successfully');