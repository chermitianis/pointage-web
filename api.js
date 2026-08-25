// ===================================================================
// api.js — واجهة برمجية (API) لتطبيق Pointage
//
// الغرض: تمكين التطبيق من العمل ضمن سيناريوهات أتمتة بين عدة تطبيقات،
// عندما يكون هذا التطبيق مُغلّفاً داخل WebView من تطبيق أصلي (Android/iOS)
// أو مضمّناً داخل iframe. يوفر هذا الملف:
//   1) window.PointageAPI: كائن JavaScript موحّد يمكن لأي كود مضيف
//      استدعاءه مباشرة (إن كان مسموحاً له بحقن/تنفيذ JS داخل الصفحة).
//   2) جسر رسائل (Message Bridge) ثنائي الاتجاه عبر postMessage، يعمل مع:
//        - React Native WebView   (window.ReactNativeWebView.postMessage)
//        - WebView أندرويد الأصلي (window.Android.postMessage عبر @JavascriptInterface)
//        - WKWebView iOS          (window.webkit.messageHandlers.pointage)
//        - iframe/نافذة أب        (window.parent.postMessage)
//   3) أحداث بث تلقائية (pointage:*) عند تغيّر البيانات، ليستمع إليها
//      أي كود مضيف دون الحاجة لاستطلاع (polling) البيانات باستمرار.
//
// التحكم: الميزة معطّلة افتراضياً لحماية خصوصية المستخدم، ويتم تفعيلها
// يدوياً من: الإعدادات > API والأتمتة (settings.apiEnabled).
//
// يعتمد على: data.js، stats-engine.js، pdfExport.js، note.js
// (يجب تحميل هذا الملف بعدها في index.html)
// ===================================================================

(function () {
    'use strict';

    const API_VERSION = '1.0.0';

    function isApiEnabled() {
        return !!(typeof settings !== 'undefined' && settings && settings.apiEnabled);
    }

    function ensureEnabled() {
        if (!isApiEnabled()) {
            throw new Error('PointageAPI معطّلة حالياً. فعّلها من: الإعدادات > API والأتمتة.');
        }
    }

    function deepClone(obj) {
        return obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
    }

    // ===== إرسال رسالة خام إلى التطبيق المضيف (أياً كان نوعه) =====
    function sendRawToHost(message) {
        try {
            if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
                window.ReactNativeWebView.postMessage(message);
            } else if (window.Android && typeof window.Android.postMessage === 'function') {
                window.Android.postMessage(message);
            } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.pointage) {
                window.webkit.messageHandlers.pointage.postMessage(message);
            } else if (window.parent && window.parent !== window) {
                window.parent.postMessage(message, '*');
            }
            // إن لم يوجد أي مضيف معروف، لا شيء يُرسل (التطبيق يعمل بشكل مستقل عادي).
        } catch (e) {
            console.error('PointageAPI: تعذّر إرسال رسالة إلى المضيف', e);
        }
    }

    function sendEventToHost(eventName, payload) {
        if (!isApiEnabled()) return;
        sendRawToHost(JSON.stringify({
            source: 'pointage-app',
            type: 'event',
            event: eventName,
            payload: payload,
            timestamp: Date.now()
        }));
    }

    // ===== كائن API الرئيسي =====
    const PointageAPI = {
        version: API_VERSION,

        isEnabled() {
            return isApiEnabled();
        },

        // ----- معلومات عامة -----
        getAppInfo() {
            ensureEnabled();
            return {
                apiVersion: API_VERSION,
                appVersion: (window.APP_CONFIG && window.APP_CONFIG.versionName) || null,
                language: settings.language,
                numberFormat: settings.numberFormat
            };
        },

        // ----- الإعدادات (قراءة فقط عبر API لحماية سلامة البيانات) -----
        getSettings() {
            ensureEnabled();
            return deepClone(settings);
        },

        // ----- الإحصائيات -----
        // startDateStr / endDateStr بصيغة 'YYYY-MM-DD'
        getStats(startDateStr, endDateStr) {
            ensureEnabled();
            const start = parseDate(startDateStr);
            const end = parseDate(endDateStr);
            return calculatePeriodStats(start, end);
        },

        getMonthStats(year, month) {
            ensureEnabled();
            const period = getMonthPeriod(new Date(year, month - 1, 15));
            return calculatePeriodStats(period.startDate, period.endDate);
        },

        getYearStats(year) {
            ensureEnabled();
            return calculateYearlyStats(year);
        },

        // ----- بيانات الأيام -----
        getDay(dateStr) {
            ensureEnabled();
            return deepClone(getDayData(parseDate(dateStr)));
        },

        getDaysInRange(startDateStr, endDateStr) {
            ensureEnabled();
            const start = parseDate(startDateStr);
            const end = parseDate(endDateStr);
            const result = [];
            const d = new Date(start);
            while (d <= end) {
                const dateStr = formatDate(d);
                result.push({ date: dateStr, data: deepClone(getDayData(new Date(d))) });
                d.setDate(d.getDate() + 1);
            }
            return result;
        },

        // type: 'shift' | 'rest' | 'vacation' | 'absence' | 'holiday'
        // shift: رقم الحصة (1 إلى settings.numShifts) — مطلوب فقط عند type === 'shift'
        setDay(dateStr, type, shift) {
            ensureEnabled();
            const validTypes = ['shift', 'rest', 'vacation', 'absence', 'holiday'];
            if (!validTypes.includes(type)) {
                throw new Error('نوع يوم غير صالح: ' + type);
            }
            if (type === 'shift') {
                const numShifts = settings.numShifts || 3;
                shift = parseInt(shift) || 1;
                if (shift < 1 || shift > numShifts) {
                    throw new Error(`رقم حصة غير صالح: ${shift} (المسموح: 1-${numShifts})`);
                }
                workData[dateStr] = { type: 'shift', shift };
            } else {
                workData[dateStr] = { type };
            }

            saveData();
            refreshVisibleSections();
            PointageAPI._emit('dayChanged', { date: dateStr, data: deepClone(workData[dateStr]) });
            return deepClone(workData[dateStr]);
        },

        deleteDay(dateStr) {
            ensureEnabled();
            delete workData[dateStr];
            saveData();
            refreshVisibleSections();
            PointageAPI._emit('dayChanged', { date: dateStr, data: null });
            return true;
        },

        // ----- المذكرات (Notes) -----
        getNotes(startDateStr, endDateStr) {
            ensureEnabled();
            const start = parseDate(startDateStr);
            const end = parseDate(endDateStr);
            return (typeof collectNotesInRange === 'function') ? collectNotesInRange(start, end) : [];
        },

        getNote(dateStr) {
            ensureEnabled();
            return deepClone((typeof notesData !== 'undefined' && notesData[dateStr]) ? notesData[dateStr] : null);
        },

        setNote(dateStr, text) {
            ensureEnabled();
            if (typeof notesData === 'undefined') throw new Error('نظام المذكرات غير محمّل');
            const trimmed = (text || '').trim();
            if (trimmed) {
                notesData[dateStr] = { text: trimmed, updatedAt: new Date().toISOString() };
            } else {
                delete notesData[dateStr];
            }
            saveNotesData();
            if (document.getElementById('notes-section') && document.getElementById('notes-section').classList.contains('active')) {
                renderNotes();
            }
            PointageAPI._emit('noteChanged', { date: dateStr, text: trimmed || null });
            return deepClone(notesData[dateStr] || null);
        },

        // ----- التصدير (PDF) -----
        async exportReportPDF(startDateStr, endDateStr) {
            ensureEnabled();
            await generatePDFReport(parseDate(startDateStr), parseDate(endDateStr));
            return true;
        },

        async exportVacationPDF(startDateStr, endDateStr) {
            ensureEnabled();
            const start = parseDate(startDateStr);
            const end = parseDate(endDateStr);
            const vacationDays = collectVacationDays(start, end);
            if (!vacationDays.length) throw new Error('لا توجد أيام إجازة في هذه الفترة');
            await generateVacationPDF(vacationDays, start, end);
            return true;
        },

        async exportNotesPDF(startDateStr, endDateStr) {
            ensureEnabled();
            const start = parseDate(startDateStr);
            const end = parseDate(endDateStr);
            const notes = collectNotesInRange(start, end);
            if (!notes.length) throw new Error('لا توجد مذكرات في هذه الفترة');
            await generateNotesPDF(notes, start, end);
            return true;
        },

        // ----- الأحداث -----
        _listeners: {},
        on(eventName, callback) {
            if (typeof callback !== 'function') return;
            if (!this._listeners[eventName]) this._listeners[eventName] = [];
            this._listeners[eventName].push(callback);
        },
        off(eventName, callback) {
            if (!this._listeners[eventName]) return;
            this._listeners[eventName] = this._listeners[eventName].filter(cb => cb !== callback);
        },
        _emit(eventName, payload) {
            (PointageAPI._listeners[eventName] || []).forEach(cb => {
                try { cb(payload); } catch (e) { console.error('PointageAPI listener error:', e); }
            });
            window.dispatchEvent(new CustomEvent('pointage:' + eventName, { detail: payload }));
            sendEventToHost(eventName, payload);
        }
    };

    function refreshVisibleSections() {
        updateHeader();
        if (document.getElementById('dashboard-section') && document.getElementById('dashboard-section').classList.contains('active')) {
            renderCurrentWeek();
        }
        if (document.getElementById('calendar-section') && document.getElementById('calendar-section').classList.contains('active')) {
            renderCalendar();
        }
        if (document.getElementById('reports-section') && document.getElementById('reports-section').classList.contains('active')) {
            updateReport();
        }
    }

    // ===== استقبال أوامر من التطبيق المضيف عبر postMessage =====
    // الصيغة المتوقعة للرسالة الواردة (JSON):
    // { id: 'unique-id', action: 'getStats', params: ['2026-01-01','2026-01-31'] }
    // الرد يُرسل بنفس id: { source:'pointage-app', type:'response', id, result, error }
    function handleHostMessage(rawData) {
        if (!isApiEnabled()) return;
        let msg;
        try {
            msg = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch (e) {
            return; // رسالة ليست بصيغة JSON صالحة لنا، نتجاهلها بصمت
        }
        if (!msg || typeof msg !== 'object' || !msg.action) return;

        const respond = (result, error) => {
            sendRawToHost(JSON.stringify({
                source: 'pointage-app',
                type: 'response',
                id: msg.id || null,
                result: result === undefined ? null : result,
                error: error ? String(error.message || error) : null
            }));
        };

        try {
            const fn = PointageAPI[msg.action];
            if (typeof fn !== 'function' || msg.action.startsWith('_')) {
                throw new Error('إجراء غير معروف: ' + msg.action);
            }
            const args = Array.isArray(msg.params) ? msg.params : [];
            const result = fn.apply(PointageAPI, args);
            if (result && typeof result.then === 'function') {
                result.then(r => respond(r)).catch(e => respond(null, e));
            } else {
                respond(result);
            }
        } catch (e) {
            respond(null, e);
        }
    }

    // يعمل مع المضيفات التي تتواصل عبر postMessage القياسي (iframe، بعض أطر WebView)
    window.addEventListener('message', function (event) {
        handleHostMessage(event.data);
    });

    // نقطة دخول بديلة لبعض تطبيقات WebView الأصلية (Android/iOS) التي تستدعي
    // دالة JS مباشرة بدل استخدام postMessage، مثال من الجانب الأصلي:
    //   webView.evaluateJavascript("window.receivePointageCommand('{\"action\":\"getStats\",...}')", null);
    window.receivePointageCommand = handleHostMessage;

    window.PointageAPI = PointageAPI;

    console.log('api.js loaded successfully (PointageAPI v' + API_VERSION + ')');
})();
