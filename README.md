# ReClaim - Debt Collection Front-End Prototype

## نظرة عامة | Overview
ReClaim هو نظام إدارة تحصيل ديون حديث ويوفر واجهة مستخدم شاملة لإدارة العملاء المتخلفين، تتبع التقسيطات، والتحليلات المتقدمة.

**ReClaim** is a modern debt collection management system providing a comprehensive user interface for managing overdue customers, tracking installments, and advanced analytics.

---

## المميزات الرئيسية | Key Features

### ✨ المودولات الأساسية (Core Modules)
- **العملاء المتخلفين** - Overdue Customers Management
  - البحث والتصفية المتقدمة بالأولوية
  - تتبع أنشطة العملاء والتعليقات
  - جدولة المتابعات والتحديثات

- **تتبع التقسيطات** - Installment Tracking
  - إدارة حالات التقسيطات (مدفوع، معلق، متأخر، جزئي)
  - حساب الرسوم المتأخرة تلقائياً
  - تسجيل الدفعات والتحديثات

- **لوحة التحليلات** - Analytics Dashboard
  - رسوم بيانية لمعدلات التحصيل
  - تحليل الفترات الزمنية المختلفة
  - حساب العمولات والأداء

- **ملف العميل** - Customer Profile
  - معلومات شاملة عن العميل
  - سجل التقسيطات والدفعات
  - المستندات والملفات المرفقة

---

## بنية المشروع | Project Structure

```
Reclaim meta/
├── index.html                 # الصفحة الرئيسية مع التبويبات
├── overdue.html              # صفحة العملاء المتخلفين
├── installments.html         # صفحة التقسيطات
├── analytics.html            # صفحة التحليلات
├── installments-history.html # صفحة ملف العميل
├── assets/
│   ├── styles.css           # الأنماط الأساسية
│   ├── theme-overrides.css  # تجاوزات التصميم والمظهر
│   ├── data.js              # بيانات وهمية ودوال مساعدة
│   ├── index.js             # منطق الصفحة الرئيسية
│   ├── overdue.js           # منطق صفحة المتخلفين
│   ├── installments.js      # منطق صفحة التقسيطات
│   ├── analytics.js         # منطق صفحة التحليلات
│   └── installments-history.js # منطق ملف العميل
├── README.md                # هذا الملف
├── package.json             # معلومات المشروع والمكتبات
└── .gitignore              # الملفات المستثناة من Git
```

---

## التقنيات المستخدمة | Technologies

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Charts:** Chart.js (CDN)
- **Fonts:** Google Fonts (Space Grotesk, IBM Plex Sans)
- **Icons/Avatars:** randomuser.me API, ui-avatars API
- **Design Pattern:** Module-based Architecture
- **Accessibility:** ARIA labels, semantic HTML

---

## البدء السريع | Quick Start

### 1. فتح الموقع
```bash
# افتح index.html في متصفح الويب
# أو استخدم local server:
python -m http.server 8000
# ثم اذهب إلى http://localhost:8000
```

### 2. البيانات الوهمية
- البيانات محفوظة في `assets/data.js`
- 25+ عميل وهمي برسم
- 15+ تقسيط تجريبي
- بيانات تحليلية شهرية وفصلية

---

## المتغيرات والثوابت | Variables & Constants

### في `assets/data.js`:
- `window.ReclaimData` - البيانات الرئيسية (العملاء، التقسيطات، التحليلات)
- `window.ReclaimUtils` - دوال مساعدة (تنسيق، بحث، حسابات)

### الألوان الأساسية:
```css
--brand: #0f766e        /* أخضر رئيسي */
--brand-2: #0b4f6c      /* أزرق داكن */
--warn: #f59e0b         /* برتقالي تحذير */
--danger: #e11d48       /* أحمر رسائل الخطأ */
--ok: #16a34a           /* أخضر نجاح */
```

---

## نماذج البيانات | Data Models

### العميل (Customer)
```javascript
{
  id: "C-1001",
  name: "Amina Yusuf",
  photo: "URL",
  contact: "+234 810 555 1001",
  email: "amina.y@example.com",
  address: "14 Palm Drive, Ikeja",
  overdueAmount: 1320,
  daysPastDue: 27,
  latestComments: "...",
  priority: "high"|"medium"|"low",
  summary: { totalOverdue, openInstallments, paidInstallments },
  activity: [ { title, detail, date } ],
  attachments: ["file1.pdf", "file2.jpg"]
}
```

### التقسيط (Installment)
```javascript
{
  id: "I-2001",
  customerId: "C-1001",
  customerName: "Amina Yusuf",
  dueDate: "2026-03-10",
  amount: 420,
  lateFee: 32,
  status: "overdue"|"paid"|"pending"|"partial",
  lateDays: 29,
  details: "..."
}
```

---

## الدوال المساعدة | Utility Functions

جميع الدوال محفوظة في `window.ReclaimUtils`:

| الدالة | الوصف |
|-------|-------|
| `byId(id)` | اختيار عنصر بـ ID |
| `formatCurrency(amount)` | تنسيق العملة (EGP) |
| `formatPercent(value)` | تنسيق النسب المئوية |
| `getCustomerInstallments(customerId)` | جلب تقسيطات العميل |
| `getCustomerCollectionSummary(customerId)` | ملخص التحصيل |
| `getCommissionRate(collected%, daysPastDue)` | حساب نسبة العمولة |
| `getAgingBucket(date)` | تصنيف العمر (0-15, 16-30, إلخ) |

---

## الحالات والحدود | States & Edge Cases

### حالات التقسيط:
- **paid** - مدفوع بالكامل
- **partial** - دفع جزئي
- **overdue** - متأخر عن الموعد
- **pending** - قيد الانتظار

### مستويات الأولوية:
- **high** - عالي الأولوية
- **medium** - متوسط
- **low** - منخفض

---

## التطوير المستقبلي | Future Enhancements

- [ ] إضافة معالجة الأخطاء الشاملة (Error Handling)
- [ ] Dark Mode
- [ ] Export to CSV/Excel
- [ ] Print functionality
- [ ] Mobile-first responsive design
- [ ] Pagination للجداول الكبيرة
- [ ] User authentication & roles
- [ ] Real database backend
- [ ] الإشعارات والنبهات (Notifications)
- [ ] Rich text editor للتعليقات

---

## ملاحظات حول الأداء | Performance Notes

- الصور محملة من خدمات خارجية (lazy loading مُوصى به)
- الجداول حالياً تحمل جميع البيانات (هناك حاجة pagination للبيانات الكبيرة)
- Charts.js تستخدم CDN (تأكد من الاتصال بالإنترنت)

---

## المتطلبات | Requirements

- متصفح حديث يدعم:
  - ES6+ JavaScript
  - CSS Grid & Flexbox
  - LocalStorage (اختياري)
- الوصول للإنترنت (للخطوط والـ CDN)

---

## الترخيص | License
Prototype - All Rights Reserved

---

## التواصل التقني | Technical Support
هذا المشروع نموذج أولي. للإبلاغ عن الأخطاء أو الاقتراحات، يرجى إنشاء issue.

**ReClaim © 2026** - Debt Collection Management System
