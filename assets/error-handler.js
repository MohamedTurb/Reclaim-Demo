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
window.ReclaimNotifications = {
  // حاوية الإشعارات
  container: null,

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
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  window.ReclaimNotifications.error("حدث خطأ غير متوقع");
});

// معالج لأخطاء Promise
// Promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  window.ReclaimNotifications.error("حدث خطأ في العملية");
});
