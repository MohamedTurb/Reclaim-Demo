# نظام معالجة الأخطاء والتحقق من البيانات | Error Handling & Data Validation System

## نظرة عامة | Overview

تم تطوير نظام شامل لمعالج الأخطاء والتحقق من صحة البيانات لضمان موثوقية التطبيق وتجربة مستخدم آمنة.

A comprehensive error handling and data validation system was developed to ensure application reliability and safe user experience.

---

## المكونات الرئيسية | Main Components

### 1. نظام الإشعارات | Notification System
**الملف:** [assets/error-handler.js](assets/error-handler.js)

```javascript
// الوصول عبر window.ReclaimNotifications
window.ReclaimNotifications.success("رسالة نجاح");
window.ReclaimNotifications.error("رسالة خطأ");
window.ReclaimNotifications.warning("رسالة تحذير");
window.ReclaimNotifications.info("رسالة معلومات");
```

**الميزات:**
- إشعارات منبثقة بألوان مختلفة حسب النوع
- مدة عرض قابلة للتخصيص (افتراضي: 3-4 ثواني)
- رسوم متحركة سلسة (Slide In/Out)
- ظهور في الزاوية العلوية اليمنى

**الأنواع:**
| النوع | الدالة | المدة | اللون |
|------|--------|------|--------|
| نجاح | `success()` | 3000ms | أخضر |
| خطأ | `error()` | 4000ms | أحمر |
| تحذير | `warning()` | 3500ms | برتقالي |
| معلومات | `info()` | 3000ms | أزرق |

---

### 2. نظام التحقق من البيانات | Validation System
**الوصول عبر:** `window.ReclaimValidation`

#### التحقق من العملاء
```javascript
// التحقق من صحة بيانات العميل
const errors = window.ReclaimValidation.validateCustomer(customer);
if (errors.length > 0) {
  console.warn("أخطاء في العميل:", errors);
}
```

**التحققات المجراة:**
- معرف العميل (required, string)
- الاسم (required, non-empty)
- رقم الهاتف (required, non-empty)
- المبلغ المستحق (required, >= 0)
- أيام التأخير (required, number >= 0)
- درجة الأولوية (high|medium|low)

#### التحقق من التقسيطات
```javascript
const errors = window.ReclaimValidation.validateInstallment(installment);
```

**التحققات المجراة:**
- معرف التقسيط (required, string)
- معرف العميل (required, string)
- تاريخ الاستحقاق (required, valid date YYYY-MM-DD)
- المبلغ (required, > 0)
- رسم التأخير (required, >= 0)
- الحالة (paid|pending|overdue|partial)

#### دوال تحقق إضافية
```javascript
// التحقق من صحة التاريخ (YYYY-MM-DD)
window.ReclaimValidation.isValidDate(dateString);

// التحقق من رقم الهاتف
window.ReclaimValidation.isValidPhoneNumber(phone);

// التحقق من البريد الإلكتروني
window.ReclaimValidation.isValidEmail(email);

// التحقق من الأرقام الموجبة
window.ReclaimValidation.isPositiveNumber(num);
```

---

### 3. معالج الأخطاء المركزي | Central Error Handler
**الوصول عبر:** `window.ReclaimErrorHandler`

#### معالجة الأخطاء اليدوية
```javascript
try {
  someDangerousOperation();
} catch (error) {
  window.ReclaimErrorHandler.handle(error, "اسم العملية");
  // سيقوم بـ:
  // 1. تسجيل الخطأ في console
  // 2. عرض رسالة خطأ للمستخدم
}
```

#### التغليف الآمن للدوال (Safe Wrapper)
```javascript
// لدالة عادية
const safeFn = window.ReclaimErrorHandler.wrap(myFunction, "اسم العملية");
safeFn(arg1, arg2); // آمن من الأخطاء

// لدالة غير متزامنة
const safeAsyncFn = window.ReclaimErrorHandler.wrapAsync(myAsyncFunction, "اسم العملية");
await safeAsyncFn(arg1, arg2);
```

---

### 4. أداة تحميل الصور مع Fallback | Image Loader with Fallback
**الوصول عبر:** `window.ReclaimImageLoader`

#### تحميل الصورة بـ Fallback
```javascript
// تحميل الصورة مع fallback
const url = await window.ReclaimImageLoader.loadImage(
  primaryUrl,
  fallbackUrl // اختياري
);
```

#### إعداد عنصر صورة
```javascript
// إضافة معالج أخطاء تلقائي لعنصر img
window.ReclaimImageLoader.setupImageElement(
  imgElement,
  imageUrl,
  fallbackUrl // اختياري
);
```

#### الصورة الافتراضية
```javascript
// الحصول على صورة SVG افتراضية (مستخدم بدون صورة)
const defaultAvatar = window.ReclaimImageLoader.getDefaultAvatar();
```

---

## أمثلة الاستخدام | Usage Examples

### مثال 1: معالجة خطأ في عملية بحث
```javascript
function searchCustomers(query) {
  try {
    if (!query || query.trim().length < 2) {
      throw new Error("يجب أن تكون عملية البحث 2 حرف على الأقل");
    }

    const results = customers.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      window.ReclaimNotifications.info("لم يتم العثور على نتائج");
    } else {
      window.ReclaimNotifications.success(`تم العثور على ${results.length} عميل`);
    }

    return results;
  } catch (error) {
    window.ReclaimErrorHandler.handle(error, "البحث عن العملاء");
    return [];
  }
}
```

### مثال 2: تسجيل دفع آمن
```javascript
function markPaymentAsPosted(installmentId, amount) {
  try {
    // التحقق من البيانات
    if (!installmentId || !amount || amount <= 0) {
      throw new Error("البيانات المدخلة غير صحيحة");
    }

    // البحث عن التقسيط
    const installment = installments.find(i => i.id === installmentId);
    if (!installment) {
      throw new Error("التقسيط غير موجود");
    }

    // التحقق من صحة التقسيط
    const errors = window.ReclaimValidation.validateInstallment(installment);
    if (errors.length > 0) {
      console.warn("تحذيرات:", errors);
    }

    // تحديث الحالة
    installment.status = "paid";
    installment.lateFee = 0;

    // عرض رسالة نجاح
    window.ReclaimNotifications.success(`تم تسجيل الدفع بنجاح: ${amount} EGP`);
    return true;
  } catch (error) {
    window.ReclaimErrorHandler.handle(error, "تسجيل الدفع");
    return false;
  }
}
```

### مثال 3: تحميل صور آمن
```javascript
// في HTML:
// <img id="avatarImg" src="" alt="صورة العميل" />

document.addEventListener("DOMContentLoaded", () => {
  const avatarImg = document.getElementById("avatarImg");
  const customerPhotoUrl = "https://example.com/customer.jpg";
  const fallbackUrl = "https://via.placeholder.com/150";

  window.ReclaimImageLoader.setupImageElement(
    avatarImg,
    customerPhotoUrl,
    fallbackUrl
  );
  // إذا فشل تحميل customerPhotoUrl، سيتم محاولة fallbackUrl
  // إذا فشل الاثنان، سيتم استخدام الصورة الافتراضية (SVG)
});
```

---

## معالجة الأخطاء العامة | Global Error Handling

يتم التقاط الأخطاء العامة تلقائياً:

```javascript
// أخطاء JavaScript العامة
window.addEventListener("error", (event) => {
  console.error("خطأ عام:", event.error);
  window.ReclaimNotifications.error("حدث خطأ غير متوقع");
});

// أخطاء Promise المرفوضة
window.addEventListener("unhandledrejection", (event) => {
  console.error("Promise مرفوضة:", event.reason);
  window.ReclaimNotifications.error("حدث خطأ في العملية");
});
```

---

## أفضل الممارسات | Best Practices

### ✅ افعل (DO)

1. **استخدم try-catch حول العمليات الخطرة**
   ```javascript
   try {
     // عملية قد تفشل
   } catch (error) {
     window.ReclaimErrorHandler.handle(error, "اسم العملية");
   }
   ```

2. **تحقق من البيانات قبل الاستخدام**
   ```javascript
   const errors = window.ReclaimValidation.validateCustomer(customer);
   if (errors.length > 0) {
     window.ReclaimErrorHandler.handle(errors.join(", "), "التحقق");
     return;
   }
   ```

3. **استخدم Safe Wrapper للدوال**
   ```javascript
   const safeFunction = window.ReclaimErrorHandler.wrap(myFunction, "My Operation");
   ```

4. **وفر رسائل خطأ واضحة للمستخدم**
   ```javascript
   window.ReclaimNotifications.error("رقم الهاتف يجب أن يحتوي على 7 أرقام على الأقل");
   ```

### ❌ لا تفعل (DON'T)

1. **لا تتجاهل الأخطاء صامتاً**
   ```javascript
   // ❌ سيء
   try {
     operation();
   } catch (e) {
     // تم التجاهل!
   }
   ```

2. **لا تعرض رسائل خطأ تقنية للمستخدمين**
   ```javascript
   // ❌ سيء
   window.ReclaimNotifications.error(error.stack);
   ```

3. **لا تفترض أن البيانات صحيحة دائماً**
   ```javascript
   // ✅ جيد
   if (data && data.id && typeof data.amount === "number") {
     // استخدم البيانات
   }
   ```

---

## معلومات التطوير | Development Info

### تهيئة النظام
تتم تهيئة نظام معالجة الأخطاء تلقائياً عند تحميل DOM:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  window.ReclaimNotifications.init();
  // ... تهيئة باقي الأنظمة
});
```

### التوافقية | Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### الأداء | Performance
- معالجة فورية للأخطاء (< 1ms)
- عدم التأثير على الأداء العامة للتطبيق
- رسوم متحركة محسنة بـ CSS

---

## الملفات المرتبطة | Related Files

| الملف | الوصف |
|------|--------|
| [assets/error-handler.js](assets/error-handler.js) | نظام معالجة الأخطاء الكامل |
| [assets/data.js](assets/data.js) | البيانات والدوال المساعدة (محدثة بتعليقات شاملة) |
| [assets/index.js](assets/index.js) | منطق لوحة المراقبة (محدثة بمعالجة أخطاء) |
| README.md | التوثيق الرئيسي |

---

## الخلاصة | Summary

تم تطوير نظام معالجة أخطاء شامل يوفر:
- ✅ إشعارات مرئية للمستخدم
- ✅ تحقق من صحة البيانات
- ✅ معالجة آمنة للأخطاء
- ✅ Fallback للصور
- ✅ معالجة أخطاء عامة

هذا يضمن موثوقية التطبيق وحماية تجربة المستخدم.
