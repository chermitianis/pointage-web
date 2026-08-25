﻿// ===== الترجمات =====
const translations = {
    ar: {
        // Header
        appTitle: 'Pointage',
        loading: 'جاري التحميل...',
        currentBonus: 'مكافآت الشهر',
        workDaysLabel: 'أيام عمل',
        vacationLabel: 'إجازة',
        overtimeHours: 'ساعات إضافية',
        previousBonus: 'مكافآت الشهر السابق',
        received: 'تم الاستلام ✓',
        
        // Dashboard
        currentWeek: 'الأسبوع الحالي',
        shift1: 'حصة 1',
        shift2: 'حصة 2',
        shift3: 'حصة 3',
        shift4: 'حصة 4',
        shiftsBonusLabel: 'مكافأة الحصص',
        legendShift1: 'حصة 1',
        legendShift2: 'حصة 2 (مكافأة)',
        legendShift3: 'حصة 3 (مكافأة)',
        legendShift4: 'حصة 4',
        legendRest: 'راحة',
        legendVacation: 'إجازة',
        legendAbsence: 'غياب',
        legendHoliday: 'عطلة',
        
        // Navigation
        navHome: 'الرئيسية',
        navCalendar: 'التقويم',
        navReports: 'التقارير',
        Notes: 'المذكرات',
        navSettings: 'الإعدادات',
        
        // Reports
        reportsTitle: 'التقارير',
        monthlyReport: 'التقرير الشهري',
        workDays: 'أيام العمل',
        vacationDays: 'إجازة',
        absenceDays: 'غياب',
        holidays: 'عطل',
        monthlySalaryLabel: 'الراتب الشهري (تحويل بنكي)',
        baseSalary: 'الراتب الأساسي',
        absenceDeduction: 'خصم الغياب',
        monthlyBonus: 'المكافآت الشهرية (نقدي)',
        overtime: 'ساعات إضافية',
        overtimeDetails: 'تفاصيل الساعات الإضافية',
        overtimeNormal: 'ساعات عادية',
        overtimeNight: 'ساعات ليلية (عبر الحصص)',
        overtimeRest: 'يوم راحة',
        overtimeHoliday: 'أعياد رسمية',
        yearlyReport: 'الملخص السنوي',
        yearlyWorkDays: 'أيام عمل',
        yearlyVacation: 'إجازة',
        yearlyAbsence: 'غياب',
        yearlyBonus: 'مكافآت (د)',
        
        // Export Tools
        exportTools: '📤 أدوات التصدير',
        exportReportBtn: 'تصدير تقرير عام',
        exportVacationBtn: 'تصدير أيام الإجازة',
        exportVacationTitle: '🏖️ تصدير أيام الإجازة',
        vacationExportNote: '💡 سيتم إنشاء تقرير يحتوي على جميع أيام الإجازة المسجلة في الفترة المحددة.',
        exportNotesTitle: '📔 تصدير تقرير المذكرات',
        notesExportNote: '💡 سيتم إنشاء تقرير يحتوي على جدول بجميع المذكرات المسجلة في الفترة المحددة (تاريخ كل مذكرة ونصها).',
        allTimeBtn: 'كل الوقت',
        
        // Settings - New Categories
        settingsGeneral: 'عام',
        settingsCalculation: 'طريقة الحساب',
        settingsDays: 'إعدادات الأيام والورديات',
        theme: 'الثيم',
        darkMode: 'الوضع الداكن',
        lightMode: 'الوضع الفاتح',
        monthCycleNote: '💡 يتم حساب نهاية الشهر تلقائياً حسب عدد أيام الشهر (30، 31، أو 28/29)',
        shiftsCount: 'عدد الورديات',
        shiftsCountInfo: 'يعمل التطبيق حالياً بـ 3 ورديات (حصة 1، حصة 2، حصة 3)',
        about: 'حول التطبيق',
        appVersion: 'الإصدار:',
        developer: 'المطور:',
        website: 'الموقع:',
        address: 'العنوان:',
        analyticsDashboard: '📊 لوحة التحليلات',
        contactInfo: 'معلومات الاتصال',
        numberFormat: 'نوع الأرقام:',
        westernNumbers: 'أرقام عادية (1,2,3)',
        arabicNumbers: 'أرقام عربية (١,٢,٣)',
        
        // Settings
        settingsTitle: 'الإعدادات',
        monthCycle: 'دورة الشهر',
        startDay: 'يبدأ من يوم:',
        endDay: 'ينتهي في يوم:',
        bonuses: 'مكافآت الورديات',
        shift2Bonus: 'حصة 2 (د/أسبوع):',
        shift3Bonus: 'حصة 3 (د/أسبوع):',
        overtimeSettings: 'الساعات الإضافية',
        configureOvertime: '⚙️ ضبط الساعات الإضافية',
        overtimeMultipliers: 'معاملات الساعات الإضافية',
        normalMultiplier: 'ساعات عادية (×):',
        nightMultiplier: 'ساعات ليلية (×):',
        restDayMultiplier: 'يوم راحة (×):',
        holidayMultiplier: 'أعياد رسمية (×):',
        workHoursSettings: 'إعدادات وقت العمل',
        normalStartHour: 'بداية العمل العادي:',
        normalEndHour: 'نهاية العمل العادي:',
        nightStartHour: 'بداية الليل:',
        nightEndHour: 'نهاية الليل:',
        vacations: 'الإجازات',
        annualVacation: 'رصيد سنوي (يوم):',
        salary: 'الراتب والأجر',
        hourlyRate: 'أجر الساعة الأساسي:',
        monthlySalary: 'الراتب الشهري:',
        currencyLabel: 'رمز العملة:',
        hoursPerDay: 'ساعات العمل اليومية:',
        language: 'اللغة',
        selectLanguage: 'اختر اللغة:',
        arabic: 'العربية',
        french: 'Français',
        officialHolidays: 'العطل الرسمية',
        religiousHolidays: 'العطل الدينية',
        religiousHolidaysNote: 'ملاحظة: الأعياد الدينية تعتمد على التقويم الهجري وتحتاج تحديث سنوي يدوي',
        updateReligiousHolidays: '📅 تحديث الأعياد الدينية',
        addHoliday: '+ إضافة',
        noHolidays: 'لا توجد عطل',
        backup: 'النسخ الاحتياطي',
        exportData: 'تصدير البيانات',
        importData: 'استيراد البيانات',
        clearData: 'مسح جميع البيانات',
        apiSection: 'API والأتمتة',
        apiEnableLabel: 'تفعيل PointageAPI (للاستخدام ضمن WebView/أتمتة خارجية):',
        apiNote: '💡 عند التفعيل، يمكن لتطبيق مضيف (يُحمّل هذا التطبيق داخل WebView) قراءة البيانات والإحصائيات والتحكم بها عبر window.PointageAPI أو عبر رسائل postMessage. الميزة معطّلة افتراضياً لحماية خصوصيتك.',
        apiDocsBtn: '📖 عرض توثيق API',
        
        // Shifts Configuration (جديد)
        shiftsConfiguration: 'تكوين الحصص',
        numShiftsLabel: 'عدد الحصص اليومية:',
        shiftStartLabel: 'وقت بداية الحصة الأولى:',
        shiftsNote: '💡 يتم حساب أوقات الحصص تلقائياً بتقسيم 24 ساعة على عدد الحصص، بدءاً من وقت بداية الحصة الأولى. عند اختيار حصة واحدة يُعتمد التوقيت الإداري الاعتيادي.',
        
        // Export Report
        exportReportTitle: '📄 تصدير تقرير PDF',
        currentMonthBtn: 'الشهر الحالي',
        lastMonthBtn: 'الشهر السابق',
        last3MonthsBtn: 'آخر 3 أشهر',
        currentYearBtn: 'السنة الحالية',
        startDateLabel: 'تاريخ البداية:',
        endDateLabel: 'تاريخ النهاية:',
        exportNote: '💡 سيتم إنشاء تقرير PDF يحتوي على جدول تفصيلي لجميع الأيام في الفترة المحددة مع الألوان والإحصائيات',
        exportBtn: 'تصدير PDF',
        
        // Export Notes
        exportNotesBtn: 'تصدير PDF',
        
        // Modal
        editDay: 'تعديل اليوم',
        rest: 'راحة',
        vacation: 'إجازة',
        absence: 'غياب',
        holiday: 'عطلة',
        overtimeHoursLabel: 'ساعات العمل الإضافية:',
        overtimeNote: 'تُحسب حسب نوع اليوم ووقت العمل',
        saveOvertime: '💾 حفظ الساعات الإضافية',
        overtimeSaved: 'تم حفظ الساعات الإضافية',
        overtimeWeekSaved: 'تم حفظ الساعات الإضافية للأسبوع كامل',
        dayTypeSaved: 'تم حفظ نوع اليوم',
        weekTypeSaved: 'تم تطبيق النوع على الأسبوع كامل',
        invalidHours: 'الرجاء إدخال عدد ساعات صحيح بين 0 و 24',
        applyToWeek: 'تطبيق على الأسبوع',
        isNightOvertimeLabel: 'ساعات إضافية ليلية (تطبيق المضاعف الليلي)',
        close: 'إغلاق',
        overtimeSettingsTitle: '⚙️ ضبط الساعات الإضافية',
        save: 'حفظ',
        cancel: 'إلغاء',
        
        // Add Holiday Modal
        addHolidayTitle: 'إضافة عطلة',
        holidayDate: 'التاريخ:',
        recurring: 'متكررة سنوياً',
        add: 'إضافة',
        editHoliday: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'حذف العطلة؟',
        fillAllFields: 'الرجاء ملء جميع الحقول',
        
        // Messages
        dataExported: 'تم تصدير البيانات',
        dataImported: 'تم استيراد البيانات',
        invalidFile: 'ملف غير صالح',
        confirmRestore: 'هل تريد استعادة البيانات؟ سيتم استبدال البيانات الحالية.',
        confirmClear: 'هل أنت متأكد من مسح جميع البيانات؟',
        dataCleared: 'تم مسح البيانات',
        
        // Notes
        notesTitle: 'المذكرات',
        notesSubtitle: 'مساحتك الخاصة لتدوين أفكارك ويومياتك',
        notesViewMonth: 'شهر',
        notesViewWeek: 'أسبوع',
        notesToday: 'اليوم',
        notesEmptyDay: 'لا توجد مذكرة',
        notesPlaceholder: 'اكتب مذكرتك هنا...',
        notesSave: 'حفظ',
        notesDelete: 'حذف',
        notesClose: 'إغلاق',
        notesSaved: 'تم حفظ المذكرة ✓',
        notesDeleted: 'تم حذف المذكرة',
        notesDeleteConfirm: 'هل تريد حذف مذكرة هذا اليوم؟',
        notesLastEdited: 'آخر تعديل:',

        // Notes Hub — التبديل بين الميزات الثلاث
        hubTasks: 'جدول أعمالي',
        hubNotes: 'مفكراتي',
        hubReminders: 'تذكير',

        // جدول الأعمال (Tasks)
        tasksFilterUpcoming: 'القادمة',
        tasksFilterToday: 'اليوم',
        tasksFilterDone: 'منجزة',
        tasksFilterAll: 'الكل',
        tasksEmpty: 'لا توجد مهام بعد. اضغط + لإضافة أول مهمة في جدول أعمالك.',
        taskModalTitle: 'مهمة جديدة',
        taskPlaceholder: 'ما هي المهمة؟',
        taskDateLabel: 'التاريخ:',
        taskTimeLabel: 'الوقت:',
        taskNotifyLabel: 'تفعيل التذكير بالإشعار',
        taskNotifyLeadLabel: 'إظهار الإشعار قبل الموعد بـ:',
        leadAtTime: 'عند الموعد بالضبط',
        lead10min: '10 دقائق',
        lead30min: '30 دقيقة',
        lead1hour: 'ساعة واحدة',
        lead3hours: '3 ساعات',
        lead1day: 'يوم كامل',

        // التذكيرات (Reminders)
        remindersFilterPast: 'السابقة',
        remindersEmpty: 'لا توجد تذكيرات بعد. اضغط + لإضافة تذكير جديد.',
        reminderModalTitle: 'تذكير جديد',
        reminderPlaceholder: 'بماذا تريد أن أذكّرك؟',
        reminderVibrateLabel: 'اهتزاز عند التذكير',
        reminderSoundLabel: 'نغمة التذكير:',
        soundTone1: 'نغمة 1 (كلاسيكية)',
        soundTone2: 'نغمة 2 (جرس)',
        soundTone3: 'نغمة 3 (نبضة)',
        soundDevice: 'نغمة من الهاتف...',
        soundCustomFile: 'ملف صوتي مخصص...',
        soundTestBtn: '🔊 تجربة النغمة',

        // Paywall & Premium Purchase (Flouci)
        paywallFeatureUnlimited: 'تصدير PDF بلا حدود لكل التقارير',
        paywallFeatureThemes: 'كل الميزات المتقدمة الحالية والمستقبلية',
        paywallFeatureSupport: 'دعم مباشر لتطوير التطبيق',
        paywallUpgradeBtn: '⭐ الترقية إلى النسخة المميزة',
        premiumModalTitle: 'النسخة المميزة من Pointage',
        premiumPriceCurrency: 'د.ت',
        premiumPriceNote: 'دفعة واحدة — بدون اشتراك شهري',
        premiumFeatureNoAds: 'بدون أي إعلانات',
        payWithFlouciBtn: '💳 الدفع عبر Flouci',
        paymentSecurityNote: 'عملية دفع آمنة ومشفّرة عبر Flouci — لا نطّلع أبداً على بيانات بطاقتك أو حسابك',
        notesEmptyMonth: 'لا توجد أي مذكرات في هذا الشهر',
        notesEmptyWeek: 'لا توجد أي مذكرات في هذا الأسبوع',
        notesCharCount: 'حرف',
        
        // Premium
        premium: 'Pointage Premium',
        upgradeNow: '🚀 ترقية إلى النسخة الممتازة',
        premiumNotSubscribed: 'غير مشترك. قم بالترقية للاستمتاع بالمزايا.',
        premiumFeatures: 'مزايا الاشتراك مدى الحياة:',
        premiumPrice: '99 د',
        premiumNote: 'دفعة واحدة مدى الحياة',
        purchasePremium: '💰 اشتر الآن',
        
        // Contact
        contactUs: 'تواصل معنا',
        contactEmail: '📧 البريد الإلكتروني',
        contactWhatsApp: '💬 واتساب',
        contactInfo: 'ℹ️ معلومات الاتصال',
        
        // Rating
        ratingTitle: '⭐ هل أعجبك التطبيق؟',
        ratingText: 'نحن نعمل باستمرار على تحسين التطبيق. إذا أعجبك، ساعدنا بتقييمه في المتجر.',
        ratingReward: '🌟 مكافأة: بعد التقييم، سنقوم بإزالة الإعلانات نهائياً!',
        rateNow: '⭐ تقييم التطبيق',
        rateLater: '⏰ تذكير لاحقاً',
        rateNever: 'لا، شكراً',
        ratingThanks: 'شكراً لك! تم إزالة الإعلانات.',
        ratingDeclined: 'تم إلغاء طلب التقييم.',
        
        // Days
        sunday: 'الأحد',
        monday: 'الإثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
        saturday: 'السبت',
        sun: 'ح',
        mon: 'ن',
        tue: 'ث',
        wed: 'ر',
        thu: 'خ',
        fri: 'ج',
        sat: 'س',
        
        // Months
        january: 'جانفي',
        february: 'فيفري',
        march: 'مارس',
        april: 'أفريل',
        may: 'ماي',
        june: 'جوان',
        july: 'جويلية',
        august: 'أوت',
        september: 'سبتمبر',
        october: 'أكتوبر',
        november: 'نوفمبر',
        december: 'ديسمبر',
        
        // Weekly Rest Days
        weeklyRestDays: 'أيام الراحة الأسبوعية',
        day: 'اليوم',
        settingsSaved: 'تم حفظ الإعدادات'
    },
    
    fr: {
        // Header
        appTitle: 'Pointage',
        loading: 'Chargement...',
        currentBonus: 'Primes du mois',
        workDaysLabel: 'Jours travail',
        vacationLabel: 'Congé',
        overtimeHours: 'Heures sup.',
        previousBonus: 'Primes du mois précédent',
        received: 'Reçu ✓',
        
        // Dashboard
        currentWeek: 'Semaine actuelle',
        shift1: 'Poste 1',
        shift2: 'Poste 2',
        shift3: 'Poste 3',
        shift4: 'Poste 4',
        shiftsBonusLabel: 'Prime des postes',
        legendShift1: 'Poste 1',
        legendShift2: 'Poste 2 (prime)',
        legendShift3: 'Poste 3 (prime)',
        legendShift4: 'Poste 4',
        legendRest: 'Repos',
        legendVacation: 'Congé',
        legendAbsence: 'Absence',
        legendHoliday: 'Férié',
        
        // Navigation
        navHome: 'Accueil',
        navCalendar: 'Calendrier',
        navReports: 'Rapports',
        Notes: 'Notes',
        navSettings: 'Paramètres',
        
        // Reports
        reportsTitle: 'Rapports',
        monthlyReport: 'Rapport mensuel',
        workDays: 'Jours travail',
        vacationDays: 'Congé',
        absenceDays: 'Absence',
        holidays: 'Fériés',
        monthlySalaryLabel: 'Salaire mensuel (virement)',
        baseSalary: 'Salaire de base',
        absenceDeduction: 'Déduction absence',
        monthlyBonus: 'Primes mensuelles (espèces)',
        overtime: 'Heures sup.',
        overtimeDetails: 'Détails heures supplémentaires',
        overtimeNormal: 'Heures normales',
        overtimeNight: 'Heures nocturnes (via postes)',
        overtimeRest: 'Jour de repos',
        overtimeHoliday: 'Jours fériés',
        yearlyReport: 'Résumé annuel',
        yearlyWorkDays: 'Jours travail',
        yearlyVacation: 'Congé',
        yearlyAbsence: 'Absence',
        yearlyBonus: 'Primes (DT)',
        
        // Export Tools
        exportTools: '📤 Outils d\'export',
        exportReportBtn: 'Exporter rapport général',
        exportVacationBtn: 'Exporter jours de congé',
        exportVacationTitle: '🏖️ Exporter les jours de congé',
        vacationExportNote: '💡 Un rapport contenant tous les jours de congé enregistrés pour la période sélectionnée sera créé.',
        exportNotesTitle: '📔 Exporter le rapport des notes',
        notesExportNote: '💡 Un rapport contenant un tableau de toutes les notes enregistrées pour la période sélectionnée sera créé (date et texte de chaque note).',
        allTimeBtn: 'Tout le temps',
        
        // Settings - New Categories
        settingsGeneral: 'Général',
        settingsCalculation: 'Méthode de calcul',
        settingsDays: 'Paramètres des jours et postes',
        theme: 'Thème',
        darkMode: 'Mode sombre',
        lightMode: 'Mode clair',
        monthCycleNote: '💡 La fin du mois est calculée automatiquement selon le nombre de jours du mois (30, 31, ou 28/29)',
        shiftsCount: 'Nombre de postes',
        shiftsCountInfo: 'L\'application fonctionne actuellement avec 3 postes (Poste 1, Poste 2, Poste 3)',
        about: 'À propos',
        appVersion: 'Version:',
        developer: 'Développeur:',
        website: 'Site web:',
        address: 'Adresse:',
        analyticsDashboard: '📊 Tableau de bord analytique',
        contactInfo: 'Informations de contact',
        numberFormat: 'Format des nombres:',
        westernNumbers: 'Chiffres occidentaux (1,2,3)',
        arabicNumbers: 'Chiffres arabes (١,٢,٣)',
        
        // Settings
        settingsTitle: 'Paramètres',
        monthCycle: 'Cycle mensuel',
        startDay: 'Commence le:',
        endDay: 'Se termine le:',
        bonuses: 'Primes des postes',
        shift2Bonus: 'Poste 2 (DT/sem):',
        shift3Bonus: 'Poste 3 (DT/sem):',
        overtimeSettings: 'Heures supplémentaires',
        configureOvertime: '⚙️ Configurer heures sup',
        overtimeMultipliers: 'Multiplicateurs heures sup',
        normalMultiplier: 'Heures normales (×):',
        nightMultiplier: 'Heures nocturnes (×):',
        restDayMultiplier: 'Jour repos (×):',
        holidayMultiplier: 'Jours fériés (×):',
        workHoursSettings: 'Paramètres horaires travail',
        normalStartHour: 'Début travail normal:',
        normalEndHour: 'Fin travail normal:',
        nightStartHour: 'Début nuit:',
        nightEndHour: 'Fin nuit:',
        vacations: 'Congés',
        annualVacation: 'Solde annuel (jours):',
        salary: 'Salaire et Rémunération',
        hourlyRate: 'Taux horaire de base:',
        monthlySalary: 'Salaire mensuel:',
        currencyLabel: 'Symbole de la devise:',
        hoursPerDay: 'Heures de travail par jour:',
        language: 'Langue',
        selectLanguage: 'Choisir la langue:',
        arabic: 'العربية',
        french: 'Français',
        officialHolidays: 'Jours fériés',
        religiousHolidays: 'Fêtes religieuses',
        religiousHolidaysNote: 'Note: Les fêtes religieuses dépendent du calendrier hégirien et nécessitent une mise à jour manuelle annuelle',
        updateReligiousHolidays: '📅 Mettre à jour les fêtes religieuses',
        addHoliday: '+ Ajouter',
        noHolidays: 'Aucun jour férié',
        backup: 'Sauvegarde',
        exportData: 'Exporter les données',
        importData: 'Importer les données',
        clearData: 'Effacer toutes les données',
        apiSection: 'API et automatisation',
        apiEnableLabel: 'Activer PointageAPI (utilisation via WebView/automatisation externe) :',
        apiNote: '💡 Une fois activée, une application hôte (qui charge cette application dans une WebView) peut lire et contrôler les données et statistiques via window.PointageAPI ou des messages postMessage. Cette fonctionnalité est désactivée par défaut pour protéger votre vie privée.',
        apiDocsBtn: '📖 Voir la documentation API',
        
        // Shifts Configuration (nouveau)
        shiftsConfiguration: 'Configuration des postes',
        numShiftsLabel: 'Nombre de postes par jour:',
        shiftStartLabel: 'Heure de début du premier poste:',
        shiftsNote: '💡 Les horaires des postes sont calculés automatiquement en divisant 24 heures par le nombre de postes, à partir de l\'heure de début du premier poste. Avec un seul poste, l\'horaire administratif normal est utilisé.',
        
        // Export Report
        exportReportTitle: '📄 Exporter rapport PDF',
        currentMonthBtn: 'Mois actuel',
        lastMonthBtn: 'Mois précédent',
        last3MonthsBtn: '3 derniers mois',
        currentYearBtn: 'Année en cours',
        startDateLabel: 'Date de début:',
        endDateLabel: 'Date de fin:',
        exportNote: '💡 Un rapport PDF sera créé contenant un tableau détaillé de tous les jours de la période sélectionnée avec couleurs et statistiques',
        exportBtn: 'Exporter PDF',
        
        // Export Notes
        exportNotesBtn: 'Exporter PDF',
        
        // Modal
        editDay: 'Modifier le jour',
        rest: 'Repos',
        vacation: 'Congé',
        absence: 'Absence',
        holiday: 'Férié',
        overtimeHoursLabel: 'Heures supplémentaires:',
        overtimeNote: 'Calculées selon le type de jour et l\'horaire',
        saveOvertime: '💾 Enregistrer les heures sup',
        overtimeSaved: 'Heures supplémentaires enregistrées',
        overtimeWeekSaved: 'Heures sup enregistrées pour toute la semaine',
        dayTypeSaved: 'Type de jour enregistré',
        weekTypeSaved: 'Type appliqué à toute la semaine',
        invalidHours: 'Veuillez saisir un nombre d\'heures valide entre 0 et 24',
        applyToWeek: 'Appliquer à la semaine',
        isNightOvertimeLabel: 'Heures supplémentaires de nuit (applique le multiplicateur nocturne)',
        close: 'Fermer',
        overtimeSettingsTitle: '⚙️ Paramètres heures supplémentaires',
        save: 'Enregistrer',
        cancel: 'Annuler',
        
        // Add Holiday Modal
        addHolidayTitle: 'Ajouter un jour férié',
        holidayDate: 'Date:',
        recurring: 'Récurrent annuellement',
        add: 'Ajouter',
        editHoliday: 'Modifier',
        delete: 'Supprimer',
        confirmDelete: 'Supprimer le jour férié?',
        fillAllFields: 'Veuillez remplir tous les champs',
        
        // Messages
        dataExported: 'Données exportées',
        dataImported: 'Données importées',
        invalidFile: 'Fichier invalide',
        confirmRestore: 'Voulez-vous restaurer les données? Les données actuelles seront remplacées.',
        confirmClear: 'Êtes-vous sûr de vouloir effacer toutes les données?',
        dataCleared: 'Données effacées',
        
        // Notes
        notesTitle: 'Notes',
        notesSubtitle: 'Votre espace personnel pour noter vos idées et votre journal',
        notesViewMonth: 'Mois',
        notesViewWeek: 'Semaine',
        notesToday: 'Aujourd\'hui',
        notesEmptyDay: 'Aucune note',
        notesPlaceholder: 'Écrivez votre note ici...',
        notesSave: 'Enregistrer',
        notesDelete: 'Supprimer',
        notesClose: 'Fermer',
        notesSaved: 'Note enregistrée ✓',
        notesDeleted: 'Note supprimée',
        notesDeleteConfirm: 'Voulez-vous supprimer la note de ce jour ?',
        notesLastEdited: 'Dernière modification :',
        notesEmptyMonth: 'Aucune note ce mois-ci',

        // Notes Hub — bascule entre les trois fonctionnalités
        hubTasks: 'Mon agenda',
        hubNotes: 'Mes notes',
        hubReminders: 'Rappels',

        // Agenda (Tasks)
        tasksFilterUpcoming: 'À venir',
        tasksFilterToday: "Aujourd'hui",
        tasksFilterDone: 'Terminées',
        tasksFilterAll: 'Toutes',
        tasksEmpty: "Aucune tâche pour l'instant. Appuyez sur + pour ajouter votre première tâche.",
        taskModalTitle: 'Nouvelle tâche',
        taskPlaceholder: 'Quelle est la tâche ?',
        taskDateLabel: 'Date :',
        taskTimeLabel: 'Heure :',
        taskNotifyLabel: 'Activer le rappel par notification',
        taskNotifyLeadLabel: "Afficher la notification avant l'échéance de :",
        leadAtTime: "Exactement à l'heure prévue",
        lead10min: '10 minutes',
        lead30min: '30 minutes',
        lead1hour: '1 heure',
        lead3hours: '3 heures',
        lead1day: 'Un jour complet',

        // Rappels (Reminders)
        remindersFilterPast: 'Passés',
        remindersEmpty: "Aucun rappel pour l'instant. Appuyez sur + pour ajouter un nouveau rappel.",
        reminderModalTitle: 'Nouveau rappel',
        reminderPlaceholder: 'De quoi voulez-vous que je vous rappelle ?',
        reminderVibrateLabel: 'Vibration lors du rappel',
        reminderSoundLabel: 'Sonnerie du rappel :',
        soundTone1: 'Tonalité 1 (classique)',
        soundTone2: 'Tonalité 2 (cloche)',
        soundTone3: 'Tonalité 3 (pulsation)',
        soundDevice: 'Sonnerie du téléphone...',
        soundCustomFile: 'Fichier audio personnalisé...',
        soundTestBtn: '🔊 Tester la sonnerie',

        // Paywall & Premium Purchase (Flouci)
        paywallFeatureUnlimited: 'Exports PDF illimités pour tous les rapports',
        paywallFeatureThemes: 'Toutes les fonctionnalités avancées actuelles et futures',
        paywallFeatureSupport: 'Soutien direct au développement de l\'application',
        paywallUpgradeBtn: '⭐ Passer à la version Premium',
        premiumModalTitle: 'Version Premium de Pointage',
        premiumPriceCurrency: 'DT',
        premiumPriceNote: 'Paiement unique — sans abonnement mensuel',
        premiumFeatureNoAds: 'Sans aucune publicité',
        payWithFlouciBtn: '💳 Payer avec Flouci',
        paymentSecurityNote: 'Paiement sécurisé et chiffré via Flouci — nous n\'avons jamais accès aux données de votre carte ou compte',
        notesEmptyWeek: 'Aucune note cette semaine',
        notesCharCount: 'caractères',
        
        // Premium
        premium: 'Pointage Premium',
        upgradeNow: '🚀 Passer à la version Premium',
        premiumNotSubscribed: 'Non abonné. Mettez à niveau pour profiter des avantages.',
        premiumFeatures: 'Avantages de l\'abonnement à vie:',
        premiumPrice: '99 DT',
        premiumNote: 'Paiement unique à vie',
        purchasePremium: '💰 Acheter maintenant',
        
        // Contact
        contactUs: 'Contactez-nous',
        contactEmail: '📧 E-mail',
        contactWhatsApp: '💬 WhatsApp',
        contactInfo: 'ℹ️ Informations de contact',
        
        // Rating
        ratingTitle: '⭐ Aimez-vous l\'application?',
        ratingText: 'Nous travaillons constamment à améliorer l\'application. Si vous l\'aimez, aidez-nous en la notant sur le store.',
        ratingReward: '🌟 Récompense: après l\'évaluation, nous supprimerons les publicités définitivement!',
        rateNow: '⭐ Noter l\'application',
        rateLater: '⏰ Rappeler plus tard',
        rateNever: 'Non, merci',
        ratingThanks: 'Merci! Les publicités ont été supprimées.',
        ratingDeclined: 'Demande d\'évaluation annulée.',
        
        // Days
        sunday: 'Dimanche',
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sun: 'D',
        mon: 'L',
        tue: 'M',
        wed: 'M',
        thu: 'J',
        fri: 'V',
        sat: 'S',
        
        // Months
        january: 'Janvier',
        february: 'Février',
        march: 'Mars',
        april: 'Avril',
        may: 'Mai',
        june: 'Juin',
        july: 'Juillet',
        august: 'Août',
        september: 'Septembre',
        october: 'Octobre',
        november: 'Novembre',
        december: 'Décembre',
        
        // Weekly Rest Days
        weeklyRestDays: 'Jours de repos hebdomadaires',
        day: 'Jour',
        settingsSaved: 'Paramètres enregistrés'
    }
};

function t(key) {
    return translations[settings.language][key] || key;
}

function getDayName(idx) {
    const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return t(keys[idx]);
}

function getDayNameShort(idx) {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return t(keys[idx]);
}

function getMonthName(idx) {
    const keys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    return t(keys[idx]);
}

// مفاتيح لا يجب تحويل أرقامها أبداً لأنها تصف نمط الأرقام نفسه
// (مثال: خيار "أرقام عادية (1,2,3)" يجب أن يبقى كما هو دائماً كمرجع للمستخدم)
const NUMBER_FORMAT_LABEL_KEYS = ['westernNumbers', 'arabicNumbers'];

function updateUILanguage() {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        let translation = t(key);
        if (translation) {
            // اعتماد نوع الأرقام المختار (عادية/عربية) في كل نصوص الواجهة الثابتة
            if (!NUMBER_FORMAT_LABEL_KEYS.includes(key) && typeof toLocalizedDigits === 'function') {
                translation = toLocalizedDigits(translation);
            }
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
}

function changeLanguage(lang) {
    settings.language = lang;
    saveData();
    updateUILanguage();
    
    updateHeader();
    renderCurrentWeek();
    buildWeeklyRestTable();
    
    if (document.getElementById('calendar-section').classList.contains('active')) {
        renderCalendar();
    }
    
    if (document.getElementById('reports-section').classList.contains('active')) {
        initializeReports();
    }
    
    if (document.getElementById('notes-section').classList.contains('active')) {
        renderNotes();
    }
    
    renderHolidaysList();
    updateNumberFormatUI();
    updateShiftBonusesUI();

    // ✅ تحديث قسم "À propos" عند تغيير اللغة
    if (typeof updateDeveloperInfo === 'function') {
        updateDeveloperInfo();
    }

    showToast(settings.language === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Langue changée en français', 2000);
}

// ===== دالة تحديث واجهة نوع الأرقام =====
function updateNumberFormatUI() {
    const select = document.getElementById('numberFormatSelect');
    if (select) {
        select.value = settings.numberFormat || 'western';
    }
}