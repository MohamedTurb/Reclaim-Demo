/**
 * ==========================================
 * RECLAIM - Error Handler & Notifications
 * معالجة الأخطاء والإشعارات
 * ==========================================
 * 
 * يوفر:
 * 1. نظام الإشعارات (Toasts)
 * 2. معالجة الأخطاء المركزية
 * 3. دوال التحقق من البيانات (Validation)
 * 4. Fallback للصور والموارد
 */

// ============================================
// نظام الإشعارات | NOTIFICATION SYSTEM
// ============================================
const RECLAIM_NOTIFICATION_LOG_KEY = "reclaim.notifications.log.v1";
const RECLAIM_NOTIFICATION_SEEN_AT_KEY = "reclaim.notifications.seenAt";

window.ReclaimNotifications = {
  // حاوية الإشعارات
  container: null,
  centerPanel: null,
  centerList: null,
  centerBadge: null,

  /**
   * تهيئة نظام الإشعارات
   * Initialize notification system
   */
  init() {
    // إنشاء حاوية الإشعارات إذا لم تكن موجودة
    if (!document.getElementById("notificationContainer")) {
      const container = document.createElement("div");
      container.id = "notificationContainer";
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById("notificationContainer");
    }

    this.initCenter();
  },

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(RECLAIM_NOTIFICATION_LOG_KEY) || "[]");
    } catch (_) {
      return [];
    }
  },

  saveLogs(logs) {
    localStorage.setItem(RECLAIM_NOTIFICATION_LOG_KEY, JSON.stringify(logs.slice(-250)));
  },

  pushLog(message, type) {
    const logs = this.getLogs();
    logs.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      type,
      message: String(message || ""),
      at: new Date().toISOString()
    });
    this.saveLogs(logs);
  },

  getSeenAt() {
    return Number(localStorage.getItem(RECLAIM_NOTIFICATION_SEEN_AT_KEY) || 0);
  },

  markSeenNow() {
    localStorage.setItem(RECLAIM_NOTIFICATION_SEEN_AT_KEY, String(Date.now()));
  },

  getUnreadCount() {
    const seenAt = this.getSeenAt();
    return this.getLogs().filter((item) => new Date(item.at).getTime() > seenAt).length;
  },

  refreshCenterBadge() {
    if (!this.centerBadge) return;
    const unread = this.getUnreadCount();
    this.centerBadge.textContent = unread > 99 ? "99+" : String(unread);
    this.centerBadge.style.display = unread ? "inline-flex" : "none";
  },

  renderCenterList() {
    if (!this.centerList) return;

    const logs = this.getLogs().slice().reverse();
    if (!logs.length) {
      this.centerList.innerHTML = '<p style="margin:0;color:#6a7780;">No notifications yet.</p>';
      return;
    }

    this.centerList.innerHTML = logs
      .map((item) => {
        const tone = item.type === "success"
          ? "#047857"
          : item.type === "error"
            ? "#b91c1c"
            : item.type === "warning"
              ? "#b45309"
              : "#1d4ed8";
        return `
          <article style="border:1px solid #e2e8f0;border-radius:8px;padding:8px;background:#fff;">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:4px;">
              <strong style="font-size:0.84rem;color:${tone};text-transform:uppercase;">${item.type}</strong>
              <small style="color:#6a7780;">${new Date(item.at).toLocaleString()}</small>
            </div>
            <div style="color:#1e2a2f;line-height:1.45;">${item.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </article>
        `;
      })
      .join("");
  },

  openCenter() {
    if (!this.centerPanel) return;
    this.renderCenterList();
    this.centerPanel.style.display = "block";
    this.markSeenNow();
    this.refreshCenterBadge();
  },

  closeCenter() {
    if (!this.centerPanel) return;
    this.centerPanel.style.display = "none";
  },

  clearCenter() {
    this.saveLogs([]);
    this.renderCenterList();
    this.refreshCenterBadge();
  },

  initCenter() {
    const self = this;

    if (!this.centerPanel) {
      const panel = document.createElement("div");
      panel.id = "notificationCenterPanel";
      panel.style.cssText = `
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: min(460px, 94vw);
        max-height: 72vh;
        border: 1px solid #d7e2e8;
        border-radius: 12px;
        background: #f8fbfe;
        box-shadow: 0 22px 45px rgba(9, 42, 58, 0.24);
        z-index: 10010;
        display: none;
      `;
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #dbe6ec;background:#fff;border-radius:12px 12px 0 0;">
          <h3 style="margin:0;font-size:1rem;color:#0b4f6c;">Notifications</h3>
          <div style="display:flex;gap:8px;">
            <button id="notificationCenterClearBtn" class="btn-outline" type="button">Clear</button>
            <button id="notificationCenterCloseBtn" class="btn-outline" type="button">Close</button>
          </div>
        </div>
        <div id="notificationCenterList" style="display:grid;gap:8px;padding:10px;overflow:auto;max-height:calc(72vh - 60px);"></div>
      `;

      document.body.appendChild(panel);
      this.centerPanel = panel;
      this.centerList = panel.querySelector("#notificationCenterList");

      panel.querySelector("#notificationCenterCloseBtn").addEventListener("click", () => self.closeCenter());
      panel.querySelector("#notificationCenterClearBtn").addEventListener("click", () => self.clearCenter());
    }

    if (!document.getElementById("sidebarNotificationBtn")) {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        const wrap = document.createElement("div");
        wrap.id = "sidebarNotificationWrap";
        wrap.style.cssText = "display:flex;justify-content:flex-end;margin-bottom:8px;";
        wrap.innerHTML = `
          <button id="sidebarNotificationBtn" type="button" aria-label="Notifications" title="Notifications" style="position:relative;border:0;background:transparent;color:#ecf8ff;cursor:pointer;font-size:1.35rem;line-height:1;padding:4px 6px;">
            &#128276;
            <span id="sidebarNotificationBadge" style="display:none;position:absolute;right:-4px;top:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ef4444;color:#fff;font-size:0.72rem;font-weight:700;align-items:center;justify-content:center;"></span>
          </button>
        `;

        const logoWrap = sidebar.querySelector(".logo-wrap");
        if (logoWrap) {
          logoWrap.insertAdjacentElement("afterend", wrap);
        } else {
          sidebar.prepend(wrap);
        }

        this.centerBadge = wrap.querySelector("#sidebarNotificationBadge");
        wrap.querySelector("#sidebarNotificationBtn").addEventListener("click", () => self.openCenter());
      }
    } else if (!this.centerBadge) {
      this.centerBadge = document.getElementById("sidebarNotificationBadge");
    }

    this.refreshCenterBadge();
  },

  /**
   * عرض إشعار نجاح
   * Show success notification
   */
  success(message, duration = 3000) {
    this.show(message, "success", duration);
  },

  /**
   * عرض إشعار خطأ
   * Show error notification
   */
  error(message, duration = 4000) {
    this.show(message, "error", duration);
  },

  /**
   * عرض إشعار تحذيري
   * Show warning notification
   */
  warning(message, duration = 3500) {
    this.show(message, "warning", duration);
  },

  /**
   * عرض إشعار معلومات
   * Show info notification
   */
  info(message, duration = 3000) {
    this.show(message, "info", duration);
  },

  /**
   * الدالة الأساسية لعرض الإشعار
   * Base show notification function
   */
  show(message, type = "info", duration = 3000) {
    if (!this.container) this.init();

    this.pushLog(message, type);
    this.refreshCenterBadge();
    this.renderCenterList();

    const notification = document.createElement("div");
    const colors = {
      success: { bg: "#ecfdf5", border: "#10b981", text: "#047857" },
      error: { bg: "#fef2f2", border: "#ef4444", text: "#dc2626" },
      warning: { bg: "#fffbeb", border: "#f59e0b", text: "#d97706" },
      info: { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" }
    };

    const color = colors[type] || colors.info;

    notification.style.cssText = `
      background: ${color.bg};
      border-left: 4px solid ${color.border};
      color: ${color.text};
      padding: 14px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    `;
    notification.textContent = message;

    this.container.appendChild(notification);

    // إزالة الإشعار بعد المدة المحددة
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out forwards";
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
};

// ============================================
// دوال التحقق | VALIDATION FUNCTIONS
// ============================================
window.ReclaimValidation = {
  /**
   * التحقق من صحة العميل
   * Validate customer data
   */
  validateCustomer(customer) {
    const errors = [];

    if (!customer) {
      errors.push("العميل غير موجود");
      return errors;
    }

    if (!customer.id || typeof customer.id !== "string") {
      errors.push("معرف العميل مفقود أو غير صحيح");
    }

    if (!customer.name || customer.name.trim().length === 0) {
      errors.push("اسم العميل مفقود");
    }

    if (!customer.contact || customer.contact.trim().length === 0) {
      errors.push("رقم الهاتف مفقود");
    }

    if (customer.overdueAmount === undefined || customer.overdueAmount < 0) {
      errors.push("المبلغ المستحق غير صحيح");
    }

    if (typeof customer.daysPastDue !== "number" || customer.daysPastDue < 0) {
      errors.push("أيام التأخير غير صحيحة");
    }

    if (!["high", "medium", "low"].includes(customer.priority)) {
      errors.push("درجة الأولوية غير صحيحة");
    }

    return errors;
  },

  /**
   * التحقق من صحة التقسيط
   * Validate installment data
   */
  validateInstallment(installment) {
    const errors = [];

    if (!installment) {
      errors.push("التقسيط غير موجود");
      return errors;
    }

    if (!installment.id || typeof installment.id !== "string") {
      errors.push("معرف التقسيط مفقود");
    }

    if (!installment.customerId || typeof installment.customerId !== "string") {
      errors.push("معرف العميل مفقود");
    }

    if (!installment.dueDate || !this.isValidDate(installment.dueDate)) {
      errors.push("تاريخ الاستحقاق غير صحيح");
    }

    if (typeof installment.amount !== "number" || installment.amount <= 0) {
      errors.push("المبلغ يجب أن يكون أكبر من صفر");
    }

    if (typeof installment.lateFee !== "number" || installment.lateFee < 0) {
      errors.push("رسم التأخير غير صحيح");
    }

    if (!["paid", "pending", "overdue", "partial"].includes(installment.status)) {
      errors.push("حالة التقسيط غير صحيحة");
    }

    return errors;
  },

  /**
   * التحقق من صحة التاريخ
   * Validate date format (YYYY-MM-DD)
   */
  isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  /**
   * التحقق من رقم الهاتف
   * Validate phone number
   */
  isValidPhoneNumber(phone) {
    // يقبل أرقام فقط و + و - و مسافات
    const phoneRegex = /^[\d\s+\-()]+$/;
    return phoneRegex.test(phone) && phone.trim().length >= 7;
  },

  /**
   * التحقق من البريد الإلكتروني
   * Validate email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * التحقق من أن الرقم موجب
   * Validate positive number
   */
  isPositiveNumber(num) {
    return typeof num === "number" && num > 0 && !isNaN(num);
  }
};

// ============================================
// معالج الأخطاء المركزي
// CENTRAL ERROR HANDLER
// ============================================
window.ReclaimErrorHandler = {
  /**
   * معالجة الخطأ وعرض رسالة للمستخدم
   * Handle error and show to user
   */
  handle(error, context = "عملية") {
    console.error(`[${context}]`, error);

    let message = "حدث خطأ ما. يرجى المحاولة مجدداً.";

    if (typeof error === "string") {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }

    window.ReclaimNotifications.error(message);
    return false;
  },

  /**
   * معالجة آمنة لدالة معينة
   * Safe wrapper for a function
   */
  wrap(fn, errorContext = "العملية") {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, errorContext);
        return null;
      }
    };
  },

  /**
   * معالجة آمنة لدالة غير متزامنة
   * Safe wrapper for async function
   */
  wrapAsync(fn, errorContext = "العملية") {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, errorContext);
        return null;
      }
    };
  }
};

// ============================================
// أداة تحميل الصور مع Fallback
// IMAGE LOADER WITH FALLBACK
// ============================================
window.ReclaimImageLoader = {
  /**
   * تحميل الصورة مع fallback
   * Load image with fallback
   */
  loadImage(url, fallbackUrl = null) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(fallbackUrl || this.getDefaultAvatar());
        return;
      }

      const img = new Image();

      img.onload = () => {
        resolve(url);
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${url}`);
        resolve(fallbackUrl || this.getDefaultAvatar());
      };

      // timeout بعد 5 ثوان
      setTimeout(() => {
        if (!img.complete) {
          resolve(fallbackUrl || this.getDefaultAvatar());
        }
      }, 5000);

      img.src = url;
    });
  },

  /**
   * الحصول على صورة افتراضية
   * Get default avatar
   */
  getDefaultAvatar() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
  },

  /**
   * إعداد الصورة على عنصر مع معالجة الأخطاء
   * Setup image on element with error handling
   */
  setupImageElement(img, src, fallback = null) {
    if (!img) return;

    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      if (fallback) {
        img.src = fallback;
      } else {
        img.src = this.getDefaultAvatar();
      }
    };

    img.src = src || this.getDefaultAvatar();
  }
};

// ============================================
// التهيئة والإعدادات الأولية
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // تهيئة نظام الإشعارات
  window.ReclaimNotifications.init();

  // إضافة أنماط الرسوم المتحركة
  if (!document.getElementById("reclaimAnimationStyles")) {
    const style = document.createElement("style");
    style.id = "reclaimAnimationStyles";
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(20px);
        }
      }
    `;
    document.head.appendChild(style);
  }
});

// معالج عام لأخطاء JavaScript
// Global error handler
const __reclaimGlobalErrorState = {
  lastToastAt: 0,
  shownKeys: new Map()
};

function shouldIgnoreGlobalError(event) {
  // Resource loading errors are often non-critical (img/font/script from third-party)
  if (event && !event.error && event.target && event.target !== window) {
    return true;
  }

  const message = String(event?.message || "").toLowerCase();

  // Ignore noisy browser/extension related runtime errors
  if (
    message.includes("resizeobserver") ||
    message.includes("chrome-extension") ||
    message.includes("script error")
  ) {
    return true;
  }

  return false;
}

function shouldShowGlobalToast(key, now) {
  const minGapMs = 2500;
  if (now - __reclaimGlobalErrorState.lastToastAt < minGapMs) {
    return false;
  }

  const lastShownForKey = __reclaimGlobalErrorState.shownKeys.get(key) || 0;
  // Same error key should not be shown repeatedly in short period
  if (now - lastShownForKey < 30000) {
    return false;
  }

  __reclaimGlobalErrorState.lastToastAt = now;
  __reclaimGlobalErrorState.shownKeys.set(key, now);
  return true;
}

window.addEventListener("error", (event) => {
  if (shouldIgnoreGlobalError(event)) {
    console.warn("Ignored global error:", event?.message || event?.target?.src || event);
    return;
  }

  console.error("Global error:", event.error || event.message || event);

  const key = `error:${event?.message || "unknown"}:${event?.filename || ""}:${event?.lineno || 0}`;
  const now = Date.now();
  if (shouldShowGlobalToast(key, now)) {
    window.ReclaimNotifications.error("حدث خطأ غير متوقع");
  }
});

// معالج لأخطاء Promise
// Promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);

  const reasonText = typeof event.reason === "string"
    ? event.reason
    : (event.reason?.message || "promise-rejection");
  const key = `promise:${reasonText}`;
  const now = Date.now();

  if (shouldShowGlobalToast(key, now)) {
    window.ReclaimNotifications.error("حدث خطأ في العملية");
  }
});
