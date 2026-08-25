﻿// ===== تصدير تقارير PDF باستخدام html2canvas (يدعم المحلي + CDN) =====

// ===== التأكد من تحميل html2canvas (محلياً أو من CDN) =====
function ensureHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
            console.log('✅ html2canvas found locally');
            resolve();
            return;
        }

        console.log('⏳ Loading html2canvas from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            console.log('✅ html2canvas loaded from CDN');
            resolve();
        };
        script.onerror = () => {
            reject(new Error('❌ Failed to load html2canvas. Please check your internet connection.'));
        };
        document.head.appendChild(script);
    });
}

// ===== فتح نافذة التصدير =====
function openExportModal() {
    const modal = document.getElementById('exportReportModal');
    const now = new Date();
    const period = getMonthPeriod(now);
    document.getElementById('exportStartDate').value = formatDate(period.startDate);
    document.getElementById('exportEndDate').value = formatDate(period.endDate);
    modal.classList.add('show');
}

function closeExportModal() {
    document.getElementById('exportReportModal').classList.remove('show');
}

function openVacationExportModal() {
    const modal = document.getElementById('exportVacationModal');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    const endDate = today;
    document.getElementById('vacationStartDate').value = formatDate(startDate);
    document.getElementById('vacationEndDate').value = formatDate(endDate);
    modal.classList.add('show');
}

function closeVacationExportModal() {
    document.getElementById('exportVacationModal').classList.remove('show');
}

function setVacationQuickDateRange(type) {
    const now = new Date();
    let startDate, endDate;
    switch(type) {
        case 'currentMonth':
            const period = getMonthPeriod(now);
            startDate = period.startDate;
            endDate = period.endDate;
            break;
        case 'lastMonth':
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastPeriod = getMonthPeriod(lastMonth);
            startDate = lastPeriod.startDate;
            endDate = lastPeriod.endDate;
            break;
        case 'currentYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
        case 'allTime':
            startDate = new Date(2020, 0, 1);
            endDate = now;
            break;
    }
    document.getElementById('vacationStartDate').value = formatDate(startDate);
    document.getElementById('vacationEndDate').value = formatDate(endDate);
}

function setQuickDateRange(type) {
    const now = new Date();
    let startDate, endDate;
    switch(type) {
        case 'currentMonth':
            const period = getMonthPeriod(now);
            startDate = period.startDate;
            endDate = period.endDate;
            break;
        case 'lastMonth':
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastPeriod = getMonthPeriod(lastMonth);
            startDate = lastPeriod.startDate;
            endDate = lastPeriod.endDate;
            break;
        case 'last3Months':
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            startDate = getMonthPeriod(threeMonthsAgo).startDate;
            endDate = getMonthPeriod(now).endDate;
            break;
        case 'currentYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
    }
    document.getElementById('exportStartDate').value = formatDate(startDate);
    document.getElementById('exportEndDate').value = formatDate(endDate);
}

// ===== تصدير التقرير العام =====
async function exportReportToPDF() {
    if (typeof canUseExportFeature === 'function' &&
        !canUseExportFeature(settings.language === 'ar' ? 'تصدير التقرير العام' : 'Export du rapport général')) {
        return;
    }
    try {
        await ensureHtml2Canvas();
        
        const startDateStr = document.getElementById('exportStartDate').value;
        const endDateStr = document.getElementById('exportEndDate').value;
        if (!startDateStr || !endDateStr) {
            alert(settings.language === 'ar' ? 'الرجاء ملء جميع الحقول' : 'Veuillez remplir tous les champs');
            return;
        }
        const startDate = parseDate(startDateStr);
        const endDate = parseDate(endDateStr);
        if (startDate > endDate) {
            alert(settings.language === 'ar' ? 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' : 'La date de début doit être avant la date de fin');
            return;
        }
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
            alert(settings.language === 'ar' ? 'الفترة المحددة طويلة جداً. الحد الأقصى سنة واحدة' : 'La période est trop longue. Maximum un an');
            return;
        }
        if (typeof showToast === 'function') {
            showToast(settings.language === 'ar' ? 'جاري إنشاء التقرير...' : 'Création du rapport...', 3000);
        }
        await generatePDFReport(startDate, endDate);
        closeExportModal();

        if (typeof consumeFreeExportUse === 'function') consumeFreeExportUse();

        if (typeof trackFeatureUsed === 'function') {
            trackFeatureUsed('export_pdf_general', { days: daysDiff });
        }

        if (typeof showToast === 'function') {
            showToast(settings.language === 'ar' ? 'تم تصدير التقرير بنجاح ✓' : 'Rapport exporté avec succès ✓', 2000);
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert(settings.language === 'ar' ? 'حدث خطأ أثناء إنشاء التقرير: ' + error.message : 'Erreur lors de la création du rapport: ' + error.message);
    }
}

// ===== إنشاء تقرير PDF =====
async function generatePDFReport(startDate, endDate) {
    const days = collectDaysData(startDate, endDate);
    const stats = calculatePeriodStats(startDate, endDate, false);
    const htmlContent = buildReportHTML(startDate, endDate, days, stats);

    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 30px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        direction: ${settings.language === 'ar' ? 'rtl' : 'ltr'};
        color: #333;
        z-index: -1;
    `;
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: container.scrollHeight
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);

    while (heightLeft > 0) {
        position = 10 - (imgHeight - heightLeft);
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
    }

    const startStr = formatDate(startDate).replace(/-/g, '');
    const endStr = formatDate(endDate).replace(/-/g, '');
    const fileName = `Pointage_Report_${startStr}_${endStr}.pdf`;

    await savePDF(doc, fileName);
}

// ===== تصدير تقرير أيام الإجازة =====
async function exportVacationReportToPDF() {
    if (typeof canUseExportFeature === 'function' &&
        !canUseExportFeature(settings.language === 'ar' ? 'تصدير أيام الإجازة' : 'Export des jours de congé')) {
        return;
    }
    try {
        await ensureHtml2Canvas();

        const startDateStr = document.getElementById('vacationStartDate').value;
        const endDateStr = document.getElementById('vacationEndDate').value;
        if (!startDateStr || !endDateStr) {
            alert(settings.language === 'ar' ? 'الرجاء ملء جميع الحقول' : 'Veuillez remplir tous les champs');
            return;
        }
        const startDate = parseDate(startDateStr);
        const endDate = parseDate(endDateStr);
        if (startDate > endDate) {
            alert(settings.language === 'ar' ? 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' : 'La date de début doit être avant la date de fin');
            return;
        }
        if (typeof showToast === 'function') {
            showToast(settings.language === 'ar' ? 'جاري إنشاء التقرير...' : 'Création du rapport...', 3000);
        }
        const vacationDays = collectVacationDays(startDate, endDate);
        if (vacationDays.length === 0) {
            alert(settings.language === 'ar' ? 'لا توجد أيام إجازة في هذه الفترة' : 'Aucun jour de congé dans cette période');
            return;
        }
        await generateVacationPDF(vacationDays, startDate, endDate);
        closeVacationExportModal();

        if (typeof consumeFreeExportUse === 'function') consumeFreeExportUse();

        if (typeof trackFeatureUsed === 'function') {
            trackFeatureUsed('export_pdf_vacation', { totalDays: vacationDays.length });
        }

        if (typeof showToast === 'function') {
            showToast(settings.language === 'ar' ? 'تم تصدير التقرير بنجاح ✓' : 'Rapport exporté avec succès ✓', 2000);
        }
    } catch (error) {
        console.error('Error exporting vacation report:', error);
        alert(settings.language === 'ar' ? 'حدث خطأ أثناء إنشاء التقرير: ' + error.message : 'Erreur lors de la création du rapport: ' + error.message);
    }
}

async function generateVacationPDF(vacationDays, startDate, endDate) {
    const isAr = settings.language === 'ar';
    const now = new Date();
    const createdDate = formatLocalizedDateTime(now);

    let html = `
        <div style="padding: 30px; font-family: 'Segoe UI', sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #212121;">
            <div style="text-align: center; border-bottom: 2px solid #FF9800; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #FF9800; margin: 0;">${isAr ? 'تقرير أيام الإجازة' : 'Rapport des jours de congé'}</h1>
                <p style="color: #666; font-size: 14px; margin: 8px 0 4px;">
                    ${isAr ? `الفترة: من ${formatNumber(startDate.getDate())} ${getMonthName(startDate.getMonth())} ${formatNumber(startDate.getFullYear())} إلى ${formatNumber(endDate.getDate())} ${getMonthName(endDate.getMonth())} ${formatNumber(endDate.getFullYear())}` :
                    `Période: du ${formatNumber(startDate.getDate())} ${getMonthName(startDate.getMonth())} ${formatNumber(startDate.getFullYear())} au ${formatNumber(endDate.getDate())} ${getMonthName(endDate.getMonth())} ${formatNumber(endDate.getFullYear())}`}
                </p>
                <p style="color: #999; font-size: 11px; margin: 2px 0;">
                    ${isAr ? `تاريخ الإنشاء: ${createdDate}` : `Date de création: ${createdDate}`}
                </p>
            </div>

            <div style="margin-bottom: 15px;">
                <p style="font-size: 16px; font-weight: bold;">${isAr ? `إجمالي أيام الإجازة: ${formatNumber(vacationDays.length)}` : `Total jours de congé: ${formatNumber(vacationDays.length)}`}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #FF9800; color: white;">
                        <th style="padding: 8px; text-align: center;">${isAr ? 'التاريخ' : 'Date'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'اليوم' : 'Jour'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'ملاحظات' : 'Notes'}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    vacationDays.forEach((day, index) => {
        const date = new Date(day.date);
        const dateStr = `${formatNumber(date.getDate())} ${getMonthName(date.getMonth())} ${formatNumber(date.getFullYear())}`;
        const dayName = getDayName(date.getDay());
        const notes = day.data.notes || '';
        const bgColor = index % 2 === 0 ? '#FFF8E1' : '#FFFFFF';
        html += `
            <tr style="background: ${bgColor};">
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${dateStr}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${dayName}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${notes}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-align: center;">
                ${isAr ? 'تم إنشاء هذا التقرير تلقائياً بواسطة نظام Pointage' : 'Ce rapport a été généré automatiquement par le système Pointage'}
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 0;
        color: #212121;
        z-index: -1;
    `;
    container.innerHTML = html;
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: container.scrollHeight
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);

    while (heightLeft > 0) {
        position = 10 - (imgHeight - heightLeft);
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
    }

    const startStr = formatDate(startDate).replace(/-/g, '');
    const endStr = formatDate(endDate).replace(/-/g, '');
    const fileName = `Vacation_Report_${startStr}_${endStr}.pdf`;

    await savePDF(doc, fileName);
}

// ===== دالة حفظ ملف PDF (تعمل على المتصفح وداخل تطبيق أندرويد WebView) =====
async function savePDF(doc, fileName) {
    const pdfBlob = doc.output('blob');
    const success = await downloadFileSmart(pdfBlob, fileName);
    if (!success) {
        throw new Error(settings.language === 'ar' ? 'تعذر حفظ الملف' : 'Impossible d\'enregistrer le fichier');
    }
    console.log('✅ PDF saved/shared successfully');
}

// ===== تصدير تقرير المذكرات (Notes) =====
function openNotesExportModal() {
    const modal = document.getElementById('exportNotesModal');
    const now = new Date();
    const period = getMonthPeriod(now);
    document.getElementById('notesExportStartDate').value = formatDate(period.startDate);
    document.getElementById('notesExportEndDate').value = formatDate(period.endDate);
    modal.classList.add('show');
}

function closeNotesExportModal() {
    document.getElementById('exportNotesModal').classList.remove('show');
}

function setNotesQuickDateRange(type) {
    const now = new Date();
    let startDate, endDate;
    switch (type) {
        case 'currentMonth': {
            const period = getMonthPeriod(now);
            startDate = period.startDate;
            endDate = period.endDate;
            break;
        }
        case 'lastMonth': {
            const lastMonth = new Date(now);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastPeriod = getMonthPeriod(lastMonth);
            startDate = lastPeriod.startDate;
            endDate = lastPeriod.endDate;
            break;
        }
        case 'currentYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
        case 'allTime':
            startDate = new Date(2020, 0, 1);
            endDate = now;
            break;
    }
    document.getElementById('notesExportStartDate').value = formatDate(startDate);
    document.getElementById('notesExportEndDate').value = formatDate(endDate);
}

// يجمع كل المذكرات (من المتغيّر العام notesData المعرّف في note.js) ضمن فترة زمنية معيّنة
function collectNotesInRange(startDate, endDate) {
    const results = [];
    if (typeof notesData !== 'object' || !notesData) return results;

    Object.keys(notesData).forEach(dateStr => {
        const entry = notesData[dateStr];
        if (!entry || !entry.text || !entry.text.trim()) return;
        const d = parseDate(dateStr);
        if (d >= startDate && d <= endDate) {
            results.push({ date: d, text: entry.text, updatedAt: entry.updatedAt });
        }
    });

    results.sort((a, b) => a.date - b.date);
    return results;
}

// تفادي كسر تنسيق HTML عند إدراج نص المذكرة (نص المستخدم الحر) داخل التقرير
function escapeHtmlForPdf(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br>');
}

async function exportNotesToPDF() {
    if (typeof canUseExportFeature === 'function' &&
        !canUseExportFeature(settings.language === 'ar' ? 'تصدير المذكرات' : 'Export des notes')) {
        return;
    }
    try {
        await ensureHtml2Canvas();

        const startDateStr = document.getElementById('notesExportStartDate').value;
        const endDateStr = document.getElementById('notesExportEndDate').value;
        if (!startDateStr || !endDateStr) {
            alert(settings.language === 'ar' ? 'الرجاء ملء جميع الحقول' : 'Veuillez remplir tous les champs');
            return;
        }
        const startDate = parseDate(startDateStr);
        const endDate = parseDate(endDateStr);
        if (startDate > endDate) {
            alert(settings.language === 'ar' ? 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' : 'La date de début doit être avant la date de fin');
            return;
        }

        if (typeof showToast === 'function') {
            showToast(settings.language === 'ar' ? 'جاري إنشاء التقرير...' : 'Création du rapport...', 3000);
        }

        const notesInRange = collectNotesInRange(startDate, endDate);
        if (notesInRange.length === 0) {
            alert(settings.language === 'ar' ? 'لا توجد مذكرات في هذه الفترة' : 'Aucune note dans cette période');
            return;
        }

        await generateNotesPDF(notesInRange, startDate, endDate);
        closeNotesExportModal();

        if (typeof consumeFreeExportUse === 'function') consumeFreeExportUse();

        if (typeof trackFeatureUsed === 'function') {
            trackFeatureUsed('export_pdf_notes', { totalNotes: notesInRange.length });
        }

        if (typeof showToast === 'function') {
            showToast(settings.language === 'ar' ? 'تم تصدير التقرير بنجاح ✓' : 'Rapport exporté avec succès ✓', 2000);
        }
    } catch (error) {
        console.error('Error exporting notes report:', error);
        alert(settings.language === 'ar' ? 'حدث خطأ أثناء إنشاء التقرير: ' + error.message : 'Erreur lors de la création du rapport: ' + error.message);
    }
}

async function generateNotesPDF(notesInRange, startDate, endDate) {
    const isAr = settings.language === 'ar';
    const now = new Date();
    const createdDate = formatLocalizedDateTime(now);

    // ملاحظة: عناوين الجدول ونصوص التقرير مُترجمة حسب اللغة المختارة،
    // أما نص كل مذكرة فيبقى كما كتبه المستخدم دون أي ترجمة (خاص به).
    let html = `
        <div style="padding: 30px; font-family: 'Segoe UI', sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #212121;">
            <div style="text-align: center; border-bottom: 2px solid #00897B; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #00897B; margin: 0;">${isAr ? '📔 تقرير المذكرات' : '📔 Rapport des notes'}</h1>
                <p style="color: #666; font-size: 14px; margin: 8px 0 4px;">
                    ${isAr ? `الفترة: من ${formatNumber(startDate.getDate())} ${getMonthName(startDate.getMonth())} ${formatNumber(startDate.getFullYear())} إلى ${formatNumber(endDate.getDate())} ${getMonthName(endDate.getMonth())} ${formatNumber(endDate.getFullYear())}` :
                    `Période: du ${formatNumber(startDate.getDate())} ${getMonthName(startDate.getMonth())} ${formatNumber(startDate.getFullYear())} au ${formatNumber(endDate.getDate())} ${getMonthName(endDate.getMonth())} ${formatNumber(endDate.getFullYear())}`}
                </p>
                <p style="color: #999; font-size: 11px; margin: 2px 0;">
                    ${isAr ? `تاريخ الإنشاء: ${createdDate}` : `Date de création: ${createdDate}`}
                </p>
            </div>

            <div style="background: linear-gradient(135deg, #E0F2F1, #E8F5E9); border-radius: 10px; padding: 14px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 22px; font-weight: bold; color: #00695C;">${formatNumber(notesInRange.length)}</div>
                <div style="font-size: 12px; color: #444;">${isAr ? 'إجمالي المذكرات المسجلة' : 'Total des notes enregistrées'}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #00897B; color: white;">
                        <th style="padding: 8px; text-align: center; width: 15%;">${isAr ? 'التاريخ' : 'Date'}</th>
                        <th style="padding: 8px; text-align: center; width: 12%;">${isAr ? 'اليوم' : 'Jour'}</th>
                        <th style="padding: 8px; text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'نص المذكرة' : 'Texte de la note'}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    notesInRange.forEach((note, index) => {
        const dateStr = `${formatNumber(note.date.getDate())} ${getMonthName(note.date.getMonth())} ${formatNumber(note.date.getFullYear())}`;
        const dayName = getDayName(note.date.getDay());
        const bgColor = index % 2 === 0 ? '#E0F2F1' : '#FFFFFF';
        html += `
            <tr style="background: ${bgColor};">
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd; color: #000000; vertical-align: top;">${dateStr}</td>
                <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd; color: #000000; vertical-align: top;">${dayName}</td>
                <td style="padding: 8px; text-align: ${isAr ? 'right' : 'left'}; border-bottom: 1px solid #ddd; color: #000000; line-height: 1.6;">${escapeHtmlForPdf(note.text)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-align: center;">
                ${isAr ? 'تم إنشاء هذا التقرير تلقائياً بواسطة نظام Pointage' : 'Ce rapport a été généré automatiquement par le système Pointage'}
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 0;
        color: #212121;
        z-index: -1;
    `;
    container.innerHTML = html;
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: container.scrollHeight
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);

    while (heightLeft > 0) {
        position = 10 - (imgHeight - heightLeft);
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
    }

    const startStr = formatDate(startDate).replace(/-/g, '');
    const endStr = formatDate(endDate).replace(/-/g, '');
    const fileName = `Pointage_Notes_${startStr}_${endStr}.pdf`;

    await savePDF(doc, fileName);
}

// ===== دوال مساعدة (buildReportHTML, collectVacationDays, collectDaysData) =====
function buildReportHTML(startDate, endDate, days, stats) {
    const isAr = settings.language === 'ar';
    const currency = settings.currency || 'DT';
    const now = new Date();
    const createdDate = formatLocalizedDateTime(now);
    
    let html = `
        <div style="text-align: center; border-bottom: 2px solid #1976D2; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #1976D2; margin: 0;">${isAr ? 'تقرير الحضور والمرتبات' : 'Rapport de Présence et Salaires'}</h1>
            <p style="color: #666; font-size: 14px; margin: 8px 0 4px;">
                ${isAr ? `الفترة: من ${formatNumber(startDate.getDate())} ${getMonthName(startDate.getMonth())} ${formatNumber(startDate.getFullYear())} إلى ${formatNumber(endDate.getDate())} ${getMonthName(endDate.getMonth())} ${formatNumber(endDate.getFullYear())}` :
                `Période: du ${formatNumber(startDate.getDate())} ${getMonthName(startDate.getMonth())} ${formatNumber(startDate.getFullYear())} au ${formatNumber(endDate.getDate())} ${getMonthName(endDate.getMonth())} ${formatNumber(endDate.getFullYear())}`}
            </p>
            <p style="color: #999; font-size: 11px; margin: 2px 0;">
                ${isAr ? `تاريخ الإنشاء: ${createdDate}` : `Date de création: ${createdDate}`}
            </p>
        </div>
    `;
    
    html += `
        <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${isAr ? 'ملخص الفترة' : 'Résumé de la période'}</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #1976D2;">${formatNumber(stats.workDays)}</div>
                    <div style="font-size: 11px; color: #666;">${isAr ? 'أيام العمل' : 'Jours de travail'}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #FF9800;">${formatNumber(stats.vacationDays)}</div>
                    <div style="font-size: 11px; color: #666;">${isAr ? 'إجازة' : 'Congé'}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #666;">${formatNumber(stats.absenceDays)}</div>
                    <div style="font-size: 11px; color: #666;">${isAr ? 'غياب' : 'Absence'}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #4CAF50;">${formatNumber(stats.holidayDays)}</div>
                    <div style="font-size: 11px; color: #666;">${isAr ? 'عطل رسمية' : 'Jours fériés'}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #9C27B0;">${formatNumber(stats.overtimeHours.toFixed(1))}${isAr ? 'س' : 'h'}</div>
                    <div style="font-size: 11px; color: #666;">${isAr ? 'ساعات إضافية' : 'Heures supp.'}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #FF5722;">${formatNumber(stats.totalBonus)} ${currency}</div>
                    <div style="font-size: 11px; color: #666;">${isAr ? 'إجمالي المكافآت' : 'Total primes'}</div>
                </div>
            </div>
        </div>
    `;
    
    html += `
        <div style="background: #FFF3E0; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
                <div>
                    <div style="font-weight: bold; color: #E65100;">${formatNumber(stats.shiftBonusesTotal || 0)} ${currency}</div>
                    <div style="font-size: 10px; color: #666;">${isAr ? 'مكافأة الحصص' : 'Prime des postes'}</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #D32F2F;">${formatNumber(stats.overtimeBonuses.total)} ${currency}</div>
                    <div style="font-size: 10px; color: #666;">${isAr ? 'مكافأة الساعات الإضافية' : 'Prime heures supp.'}</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #1565C0;">${formatNumber(stats.totalBonus)} ${currency}</div>
                    <div style="font-size: 10px; color: #666;">${isAr ? 'إجمالي المكافآت' : 'Total primes'}</div>
                </div>
            </div>
        </div>
    `;
    
    html += `
        <div style="margin-top: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${isAr ? 'تفاصيل الأيام' : 'Détails des jours'}</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #4CAF50; color: white;">
                        <th style="padding: 8px; text-align: center;">${isAr ? 'التاريخ' : 'Date'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'اليوم' : 'Jour'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'النوع' : 'Type'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'الحصة' : 'Poste'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'س.إضافية' : 'H.Supp'}</th>
                        <th style="padding: 8px; text-align: center;">${isAr ? 'المكافأة' : 'Prime'}</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    days.forEach((day, index) => {
        const date = new Date(day.date);
        const dateStr = `${formatNumber(date.getDate())} ${getMonthName(date.getMonth())} ${formatNumber(date.getFullYear())}`;
        const dayName = getDayName(date.getDay());
        let typeText = '', shiftText = '', bgColor = '#fff';
        if (day.data.type === 'shift') {
            typeText = isAr ? 'عمل' : 'Trav.';
            shiftText = `${day.data.shift}`;
            bgColor = day.data.shift === 1 ? '#E3F2FD' : (day.data.shift === 2 ? '#FFF3E0' : (day.data.shift === 3 ? '#FFEBEE' : '#EFEBE9'));
        } else if (day.data.type === 'rest') {
            typeText = isAr ? 'راحة' : 'Repos';
            bgColor = '#F5F5F5';
        } else if (day.data.type === 'vacation') {
            typeText = isAr ? 'إجازة' : 'Congé';
            bgColor = '#FFFDE7';
        } else if (day.data.type === 'absence') {
            typeText = isAr ? 'غياب' : 'Abs.';
            bgColor = '#EEEEEE';
        } else if (day.data.type === 'holiday') {
            typeText = isAr ? 'عطلة' : 'Férié';
            bgColor = '#E8F5E9';
        }
        const overtime = day.data.overtimeHours || 0;
        let overtimeBonus = 0;
        let shiftBonus = 0;
        if (overtime > 0) {
            const multiplier = calculateOvertimeMultiplier(date, day.data);
            overtimeBonus = Math.round(overtime * settings.hourlyRate * multiplier);
        }
        // حساب مكافأة الحصة
        if (day.data.type === 'shift' && day.data.shift > 1 && settings.shiftBonuses && settings.shiftBonuses[day.data.shift]) {
            shiftBonus = Math.round(settings.shiftBonuses[day.data.shift] / 5);
        }
        const totalDayBonus = shiftBonus + overtimeBonus;
        
        html += `
            <tr style="background: ${bgColor}; ${index % 2 === 0 ? '' : 'background: #FAFAFA;'}">
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${dateStr}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${dayName}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${typeText}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${shiftText ? formatNumber(shiftText) : ''}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${overtime > 0 ? formatNumber(overtime) : '-'}</td>
                <td style="padding: 6px; text-align: center; border-bottom: 1px solid #ddd; color: #000000;">${totalDayBonus > 0 ? formatNumber(totalDayBonus) + ' ' + currency : '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    html += `
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-align: center;">
            ${isAr ? 'تم إنشاء هذا التقرير تلقائياً بواسطة نظام Pointage' : 'Ce rapport a été généré automatiquement par le système Pointage'}
        </div>
    `;
    
    return html;
}

function collectVacationDays(startDate, endDate) {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayData = getDayData(current);
        if (dayData.type === 'vacation') {
            days.push({ date: new Date(current), data: dayData });
        }
        current.setDate(current.getDate() + 1);
    }
    return days;
}

function collectDaysData(startDate, endDate) {
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayData = getDayData(current);
        days.push({ date: new Date(current), data: dayData });
        current.setDate(current.getDate() + 1);
    }
    return days;
}

console.log('pdfExport.js loaded - with Android WebView compatible download');