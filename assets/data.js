/**
 * ==========================================
 * RECLAIM - Data & Utility Functions
 * نظام إدارة تحصيل الديون - البيانات والدوال المساعدة
 * ==========================================
 * 
 * هذا الملف يحتوي على:
 * 1. البيانات الوهمية (Mock Data) - العملاء والتقسيطات والتحليلات
 * 2. دوال مساعدة عامة (Utility Functions) - تنسيق، بحث، حسابات
 * 
 * This file contains:
 * 1. Mock Data - Customers, Installments, Analytics
 * 2. Utility Functions - Formatting, searching, calculations
 */

// ============================================
// البيانات الرئيسية | PRIMARY DATA
// ============================================
window.ReclaimData = {
  // قائمة العملاء - موزعة على عدة أولويات
  // Customer list - distributed across priority levels
  customers: [
    {
      id: "C-1001",
      name: "Amina Yusuf",
      photo: "https://randomuser.me/api/portraits/women/11.jpg",
      contact: "+234 810 555 1001",
      email: "amina.y@example.com",
      address: "14 Palm Drive, Ikeja",
      overdueAmount: 1320,
      daysPastDue: 27,
      latestComments: "Requested extension until Friday.",
      priority: "high",
      assigned_to: "U-1002",
      summary: { totalOverdue: 1320, openInstallments: 3, paidInstallments: 8 },
      activity: [
        { title: "Call Attempted", detail: "No answer at 10:30 AM.", date: "2026-04-05" },
        { title: "SMS Sent", detail: "Reminder with payment options delivered.", date: "2026-04-03" }
      ],
      attachments: ["Signed_Agreement.pdf", "National_ID.jpg"]
    },
    {
      id: "C-1002",
      name: "David Mensah",
      photo: "https://randomuser.me/api/portraits/men/22.jpg",
      contact: "+233 24 331 8002",
      email: "david.m@example.com",
      address: "22 East Legon Road, Accra",
      overdueAmount: 840,
      daysPastDue: 11,
      latestComments: "Promised partial payment today.",
      priority: "medium",
      assigned_to: "U-1002",
      summary: { totalOverdue: 840, openInstallments: 2, paidInstallments: 10 },
      activity: [
        { title: "Payment Received", detail: "120 EGP posted to account.", date: "2026-04-07" },
        { title: "Follow-up Scheduled", detail: "Assigned to agent Kofi.", date: "2026-04-04" }
      ],
      attachments: ["Repayment_Plan.docx", "Payslip_March.pdf"]
    },
    {
      id: "C-1003",
      name: "Lerato Nkosi",
      photo: "https://randomuser.me/api/portraits/women/33.jpg",
      contact: "+27 71 440 3003",
      email: "lerato.n@example.com",
      address: "8 Sandton View, Johannesburg",
      overdueAmount: 450,
      daysPastDue: 5,
      latestComments: "Email confirmation sent.",
      priority: "low",
      assigned_to: "U-1003",
      summary: { totalOverdue: 450, openInstallments: 1, paidInstallments: 12 },
      activity: [
        { title: "Email Sent", detail: "Balance statement shared.", date: "2026-04-06" },
        { title: "Portal Login", detail: "Customer viewed account details.", date: "2026-04-05" }
      ],
      attachments: ["Proof_of_Address.pdf"]
    },
    {
      id: "C-1004",
      name: "Noah Kamau",
      photo: "https://randomuser.me/api/portraits/men/44.jpg",
      contact: "+254 702 456 004",
      email: "noah.k@example.com",
      address: "45 Riverside, Nairobi",
      overdueAmount: 2100,
      daysPastDue: 43,
      latestComments: "Escalated to legal review queue.",
      priority: "high",
      assigned_to: "U-1003",
      summary: { totalOverdue: 2100, openInstallments: 4, paidInstallments: 6 },
      activity: [
        { title: "Case Escalated", detail: "Legal notice drafted.", date: "2026-04-07" },
        { title: "Call Completed", detail: "Customer requested callback next week.", date: "2026-04-01" }
      ],
      attachments: ["Escalation_Memo.pdf", "Call_Transcript.txt"]
    }
  ],
  
  // قائمة التقسيطات - تتبع جميع المدفوعات والالتزامات
  // Installments list - track all payments and commitments
  installments: [
    { id: "I-2001", customerId: "C-1001", customerName: "Amina Yusuf", dueDate: "2026-03-10", amount: 420, lateFee: 32, status: "overdue", lateDays: 29, details: "Customer unreachable during first call." },
    { id: "I-2002", customerId: "C-1002", customerName: "David Mensah", dueDate: "2026-04-05", amount: 360, lateFee: 11, status: "partial", lateDays: 3, details: "Partial payment received, balance pending." },
    { id: "I-2003", customerId: "C-1003", customerName: "Lerato Nkosi", dueDate: "2026-04-06", amount: 220, lateFee: 0, status: "pending", lateDays: 0, details: "Due soon, reminder sent." },
    { id: "I-2004", customerId: "C-1004", customerName: "Noah Kamau", dueDate: "2026-02-28", amount: 700, lateFee: 75, status: "overdue", lateDays: 40, details: "Escalated case due to repeated delays." },
    { id: "I-2005", customerId: "C-1001", customerName: "Amina Yusuf", dueDate: "2026-03-28", amount: 520, lateFee: 18, status: "pending", lateDays: 8, details: "Promise to pay by end of week." },
    { id: "I-2006", customerId: "C-1002", customerName: "David Mensah", dueDate: "2026-03-15", amount: 480, lateFee: 0, status: "paid", lateDays: 0, details: "Paid in full." }
  ],
  
  // بيانات تحليلية - شهري وفصلي
  // Analytics data - monthly and quarterly views
  analytics: {
    monthly: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      collected: [5400, 7200, 6800, 7900],
      bucket: [7, 11, 5, 3]
    },
    quarterly: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      collected: [18500, 23400, 21900, 25100],
      bucket: [18, 14, 9, 6]
    }
  }
};

// ============================================
// بيانات وهمية إضافية | MOCK DATA POOLS
// ============================================
// قائمة أسماء عملاء مصرية - تستخدم لتوليد بيانات وهمية
// Egyptian customer names - used for generating mock data
const MOCK_CUSTOMER_NAMES = [
  "Omar Adel",
  "Mona Hany",
  "Youssef Emad",
  "Salma Nabil",
  "Karim Tarek",
  "Nour Sami",
  "Hassan Ali",
  "Dina Mostafa",
  "Rami Fathy",
  "Farah Wael",
  "Ahmed Samir",
  "Laila Ashraf",
  "Sherif Magdy",
  "Hoda Kamal",
  "Mariam Fawzy",
  "Ziad Maher",
  "Rana Adel",
  "Mahmoud Nader",
  "Aya Khaled",
  "Tamer Saeed",
  "Nadine Essam"
];

// قائمة مدن - لعناوين العملاء الوهمية
// Cities list - for mock customer addresses
const MOCK_CUSTOMER_CITIES = [
  "Nasr City",
  "Maadi",
  "Heliopolis",
  "Dokki",
  "Zamalek",
  "Alexandria",
  "Mansoura"
];

// قائمة صور عشوائية - روابط API لتوليد صور الملفات الشخصية
// Random photo URLs - API links for profile photo generation
const MOCK_CUSTOMER_PHOTOS = [
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/women/46.jpg",
  "https://randomuser.me/api/portraits/men/47.jpg",
  "https://randomuser.me/api/portraits/women/48.jpg",
  "https://randomuser.me/api/portraits/men/49.jpg",
  "https://randomuser.me/api/portraits/women/50.jpg",
  "https://randomuser.me/api/portraits/men/51.jpg",
  "https://randomuser.me/api/portraits/women/52.jpg",
  "https://randomuser.me/api/portraits/men/53.jpg",
  "https://randomuser.me/api/portraits/women/54.jpg",
  "https://randomuser.me/api/portraits/men/55.jpg",
  "https://randomuser.me/api/portraits/women/56.jpg",
  "https://randomuser.me/api/portraits/men/57.jpg",
  "https://randomuser.me/api/portraits/women/58.jpg",
  "https://randomuser.me/api/portraits/men/59.jpg",
  "https://randomuser.me/api/portraits/women/60.jpg",
  "https://randomuser.me/api/portraits/men/61.jpg",
  "https://randomuser.me/api/portraits/women/62.jpg",
  "https://randomuser.me/api/portraits/men/63.jpg",
  "https://randomuser.me/api/portraits/women/64.jpg",
  "https://randomuser.me/api/portraits/women/65.jpg"
];

// ============================================
// توليد البيانات الوهمية الإضافية
// GENERATING ADDITIONAL MOCK DATA
// ============================================
// توليد 96 عميل إضافي بحيث يصبح الإجمالي 100 عميل
// Generate 96 additional customers so total reaches 100 customers
const TARGET_TOTAL_CUSTOMERS = 100;
const ADDITIONAL_CUSTOMERS_COUNT = Math.max(TARGET_TOTAL_CUSTOMERS - window.ReclaimData.customers.length, 0);
const ASSIGNABLE_STAFF_IDS = ["U-1002", "U-1003"];
const OVERDUE_SEGMENTS = [
  { code: "paid", count: 20, minDays: 0, maxDays: 0 },
  { code: "1-30", count: 24, minDays: 1, maxDays: 30 },
  { code: "30-60", count: 20, minDays: 31, maxDays: 60 },
  { code: "60-90", count: 16, minDays: 61, maxDays: 90 },
  { code: "90+", count: 16, minDays: 91, maxDays: 140 }
];

function dueDateFromDaysPastDue(daysPastDue) {
  const baseDate = new Date("2026-04-09T00:00:00");
  const daysToShift = Number(daysPastDue) || 0;
  baseDate.setDate(baseDate.getDate() - daysToShift);
  return baseDate.toISOString().slice(0, 10);
}

function getSegmentFromIndex(index) {
  let cursor = 0;
  for (const segment of OVERDUE_SEGMENTS) {
    cursor += segment.count;
    if (index < cursor) return segment;
  }
  return OVERDUE_SEGMENTS[OVERDUE_SEGMENTS.length - 1];
}

const mockCustomers = Array.from({ length: ADDITIONAL_CUSTOMERS_COUNT }, (_, index) => {
  const customerNumber = 1005 + index;
  const segment = getSegmentFromIndex(index);
  const nameSeed = MOCK_CUSTOMER_NAMES[index % MOCK_CUSTOMER_NAMES.length];
  const name = `${nameSeed} ${String(index + 1).padStart(2, "0")}`;
  const city = MOCK_CUSTOMER_CITIES[index % MOCK_CUSTOMER_CITIES.length];
  const daysSpan = Math.max(segment.maxDays - segment.minDays + 1, 1);
  const daysPastDue = segment.code === "paid" ? 0 : segment.minDays + (index % daysSpan);
  const overdueAmount = segment.code === "paid" ? 0 : 420 + (index * 37) % 2900;
  const priority = daysPastDue >= 61 ? "high" : daysPastDue >= 31 ? "medium" : "low";
  const isPaid = segment.code === "paid";

  return {
    id: `C-${customerNumber}`,
    name,
    photo: MOCK_CUSTOMER_PHOTOS[index % MOCK_CUSTOMER_PHOTOS.length],
    contact: `+20 10${String(7100000 + index).padStart(7, "0")}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    address: `${20 + (index % 80)} ${city}, Cairo`,
    overdueAmount,
    daysPastDue,
    latestComments: isPaid
      ? "Account fully paid in latest cycle."
      : `Customer falls in ${segment.code} overdue category.`,
    priority,
    assigned_to: ASSIGNABLE_STAFF_IDS[index % ASSIGNABLE_STAFF_IDS.length],
    summary: {
      totalOverdue: overdueAmount,
      openInstallments: isPaid ? 0 : 1 + (index % 4),
      paidInstallments: isPaid ? 10 + (index % 5) : 5 + (index % 6)
    },
    activity: [
      {
        title: isPaid ? "Payment Posted" : "Reminder Sent",
        detail: isPaid ? "Installment paid and reconciled." : "Automated reminder sent to customer.",
        date: "2026-04-08"
      },
      {
        title: "Follow-up Scheduled",
        detail: "Next review planned by collections team.",
        date: "2026-04-07"
      }
    ],
    attachments: ["Installment_Agreement.pdf"]
  };
});

const generatedInstallments = mockCustomers.map((customer, index) => {
  const isPaid = (customer.daysPastDue || 0) === 0;
  let status = "paid";

  if (!isPaid) {
    if (index % 5 === 0) {
      status = "partial";
    } else if (index % 4 === 0) {
      status = "pending";
    } else {
      status = "overdue";
    }
  }

  const lateFee = isPaid ? 0 : Math.round((customer.overdueAmount || 0) * 0.06);
  const installmentAmount = isPaid ? 350 + (index % 9) * 45 : Math.max((customer.overdueAmount || 0) - lateFee, 180);

  return {
    id: `I-${4001 + index}`,
    customerId: customer.id,
    customerName: customer.name,
    dueDate: dueDateFromDaysPastDue(customer.daysPastDue || 0),
    amount: installmentAmount,
    lateFee,
    status,
    lateDays: customer.daysPastDue || 0,
    details: isPaid ? "Customer paid this installment." : `Customer in ${customer.daysPastDue} days overdue bucket.`
  };
});

window.ReclaimData.customers.push(...mockCustomers);
window.ReclaimData.installments.push(...generatedInstallments);

// ============================================
// حفظ البيانات محلياً | LOCAL DATA PERSISTENCE
// ============================================
const RECLAIM_STORAGE_KEY = "reclaim.data.v2";

function loadPersistedReclaimData() {
  try {
    const raw = localStorage.getItem(RECLAIM_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.customers) || !Array.isArray(parsed.installments)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to load persisted ReClaim data:", error);
    return null;
  }
}

function persistReclaimData() {
  try {
    const snapshot = {
      customers: window.ReclaimData.customers,
      installments: window.ReclaimData.installments,
      analytics: window.ReclaimData.analytics
    };
    localStorage.setItem(RECLAIM_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Failed to persist ReClaim data:", error);
  }
}

const persistedReclaimData = loadPersistedReclaimData();
if (persistedReclaimData) {
  window.ReclaimData.customers = persistedReclaimData.customers;
  window.ReclaimData.installments = persistedReclaimData.installments;
  if (persistedReclaimData.analytics) {
    window.ReclaimData.analytics = persistedReclaimData.analytics;
  }
} else {
  persistReclaimData();
}

window.ReclaimDataStore = {
  save: persistReclaimData,
  clear() {
    localStorage.removeItem(RECLAIM_STORAGE_KEY);
  }
};

// ============================================
// الثوابت والإعدادات | CONSTANTS & SETTINGS
// ============================================
// نطاقات حساب العمولة - كلما زادت نسبة التحصيل، زادت العمولة
// Commission calculation bands - higher collection % = higher commission
const COMMISSION_BANDS = [
  { collectedAtLeast: 90, rate: 6 },
  { collectedAtLeast: 50, rate: 5 },
  { collectedAtLeast: 40, rate: 4 },
  { collectedAtLeast: 30, rate: 3 },
  { collectedAtLeast: 20, rate: 2 },
  { collectedAtLeast: 10, rate: 1 }
];

// فئات العمر- تصنيف العملاء حسب تاريخ الاستحقاق الأقدم
// Aging buckets - categorize customers by oldest due date
const AGE_BUCKET_LABELS = [
  { from: "2026-04-05", label: "April 5, 2026" },
  { from: "2026-03-05", label: "March 5, 2026" },
  { from: "2026-02-05", label: "February 5, 2026" },
  { from: "0000-01-01", label: "January 5, 2026 and older" }
];

// ============================================
// الدوال المساعدة الرئيسية
// MAIN UTILITY FUNCTIONS
// ============================================
// كائن يحتوي على جميع الدوال المساعدة المستخدمة في الموقع
// Object containing all utility functions used throughout the application
window.ReclaimUtils = {
  /**
   * الحصول على عنصر DOM بـ ID
   * Get DOM element by ID
   * @param {string} id - معرف العنصر / Element ID
   * @returns {HTMLElement|null}
   */
  byId(id) {
    return document.getElementById(id);
  },
  
  /**
   * تنسيق الأرقام كعملة مصرية
   * Format number as Egyptian currency
   * @param {number} value - القيمة / The value
   * @returns {string} - مثال: "1,320.00 EGP"
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0
    }).format(value);
  },
  
  /**
   * تنسيق الأرقام كنسبة مئوية
   * Format number as percentage
   * @param {number} value - القيمة / The value
   * @returns {string} - مثال: "75%"
   */
  formatPercent(value) {
    return `${Math.round(value)}%`;
  },
  
  /**
   * الحصول على الأحرف الأولى من الاسم
   * Get initials from name
   * @param {string} name - الاسم الكامل / Full name
   * @returns {string} - مثال: "AY" من "Amina Yusuf"
   */
  getInitials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  },
  
  /**
   * جلب جميع التقسيطات لعميل معين
   * Get all installments for a specific customer
   * @param {string} customerId - معرف العميل / Customer ID
   * @returns {Array} - مصفوفة التقسيطات / Array of installments
   */
  getCustomerInstallments(customerId) {
    return window.ReclaimData.installments.filter((installment) => installment.customerId === customerId);
  },
  
  /**
   * حساب نسبة التحصيل لتقسيط واحد
   * Calculate collection share for a single installment
   * @param {Object} installment - التقسيط / The installment
   * @returns {number} - 0 أو 0.5 أو 1 / 0, 0.5, or 1
   */
  getInstallmentCollectionShare(installment) {
    if (installment.status === "paid") return 1;      // مدفوع بالكامل
    if (installment.status === "partial") return 0.5; // دفع جزئي
    return 0;                                          // لم يتم الدفع
  },
  
  /**
   * حساب نسبة العمولة بناءً على نسبة التحصيل والتأخير
   * Calculate commission rate based on collection % and days past due
   * @param {number} collectedPercent - نسبة التحصيل / Collection percentage
   * @param {number} daysPastDue - أيام التأخير / Days past due
   * @returns {number} - نسبة العمولة / Commission rate in percentage
   */
  getCommissionRate(collectedPercent, daysPastDue = 0) {
    // حالة خاصة: تأخير شديد (90+ يوم) = عمولة 20%
    if (daysPastDue >= 90) return 20;

    // تطبيق نطاقات العمولة المعرفة أعلاه
    for (const band of COMMISSION_BANDS) {
      if (collectedPercent >= band.collectedAtLeast) {
        return band.rate;
      }
    }

    return 0; // لا توجد عمولة إذا كانت النسبة أقل من 10%
  },
  
  /**
   * تصنيف التقسيط حسب عمره (من تاريخ الاستحقاق)
   * Categorize installment by age (aging bucket)
   * @param {string} dueDate - تاريخ الاستحقاق / Due date (YYYY-MM-DD)
   * @returns {string} - تسمية الفئة / Bucket label
   */
  getAgingBucket(dueDate) {
    if (!dueDate) return "January 5, 2026 and older";

    for (const bucket of AGE_BUCKET_LABELS) {
      if (dueDate >= bucket.from) {
        return bucket.label;
      }
    }

    return "January 5, 2026 and older";
  },
  
  /**
   * الحصول على ملخص التحصيل الكامل لعميل واحد
   * Get complete collection summary for one customer
   * @param {string} customerId - معرف العميل / Customer ID
   * @returns {Object} - كائن يحتوي على: العميل، التقسيطات، المبالغ، النسب، العمولة
   */
  getCustomerCollectionSummary(customerId) {
    const customer = window.ReclaimData.customers.find((item) => item.id === customerId);
    const installments = window.ReclaimUtils.getCustomerInstallments(customerId);

    // حساب المبالغ الكلية
    const totalPayable = installments.reduce((sum, installment) => sum + installment.amount + installment.lateFee, 0);
    const collectedAmount = installments.reduce((sum, installment) => {
      const installmentTotal = installment.amount + installment.lateFee;
      return sum + installmentTotal * window.ReclaimUtils.getInstallmentCollectionShare(installment);
    }, 0);
    const collectedPercent = totalPayable ? (collectedAmount / totalPayable) * 100 : 0;
    const commissionRate = window.ReclaimUtils.getCommissionRate(collectedPercent, customer?.daysPastDue || 0);
    const commissionAmount = collectedAmount * (commissionRate / 100);
    const oldestDueDate = installments.length
      ? installments.map((installment) => installment.dueDate).sort()[0]
      : null;

    return {
      customer,
      installments,
      totalPayable,
      collectedAmount,
      collectedPercent,
      commissionRate,
      commissionAmount,
      agingBucket: window.ReclaimUtils.getAgingBucket(oldestDueDate)
    };
  },
  
  /**
   * تصنيف جميع العملاء حسب فئات العمر
   * Categorize all customers by aging buckets
   * @returns {Array} - مصفوفة من فئات العمر مع العملاء بداخلها
   */
  getCustomersByAgingBucket() {
    return AGE_BUCKET_LABELS.map((bucket) => ({
      label: bucket.label,
      customers: window.ReclaimData.customers
        .map((customer) => ({ customer, summary: window.ReclaimUtils.getCustomerCollectionSummary(customer.id) }))
        .filter((entry) => entry.summary.agingBucket === bucket.label)
        .sort((a, b) => b.summary.collectedPercent - a.summary.collectedPercent)
    }));
  },
  
  /**
   * الحصول على ملخص العمولات والتحصيل للمحفظة بأكملها
   * Get commission and collection summary for entire portfolio
   * @returns {Object} - {totalCollected, totalCommission, totalCollectedPercent}
   */
  getPortfolioCommissionSummary() {
    const customerSummaries = window.ReclaimData.customers.map((customer) => window.ReclaimUtils.getCustomerCollectionSummary(customer.id));

    return {
      customerSummaries,
      totalCollected: customerSummaries.reduce((sum, item) => sum + item.collectedAmount, 0),
      totalCommission: customerSummaries.reduce((sum, item) => sum + item.commissionAmount, 0),
      totalCollectedPercent: customerSummaries.length
        ? customerSummaries.reduce((sum, item) => sum + item.collectedPercent, 0) / customerSummaries.length
        : 0
    };
  },
  
  /**
   * تحديث جميع المقاييس المشتركة (الكروت في الأعلى)
   * Update all shared metrics (top cards)
   * هذه الدالة تُستدعى عند أي تغيير في البيانات
   * Called whenever data changes
   */
  updateSharedMetrics() {
    const customers = window.ReclaimData.customers;
    const installments = window.ReclaimData.installments;
    const commissionSummary = window.ReclaimUtils.getPortfolioCommissionSummary();

    // حساب المقاييس الأساسية
    const totalOverdueAmount = customers.reduce((sum, c) => sum + c.overdueAmount, 0);
    const totalOverdueAccounts = customers.filter((c) => c.overdueAmount > 0).length;
    const avgDays = customers.length
      ? Math.round(customers.reduce((sum, c) => sum + c.daysPastDue, 0) / customers.length)
      : 0;
    const paidInstallments = installments.filter((i) => i.status === "paid").length;

    // تحديث العناصر في الـ DOM
    const metricOverdueAccounts = window.ReclaimUtils.byId("metricOverdueAccounts");
    const metricOverdueAmount = window.ReclaimUtils.byId("metricOverdueAmount");
    const metricPayments = window.ReclaimUtils.byId("metricPayments");
    const metricAvgDays = window.ReclaimUtils.byId("metricAvgDays");
    const metricCommission = window.ReclaimUtils.byId("metricCommission");

    if (metricOverdueAccounts) metricOverdueAccounts.textContent = totalOverdueAccounts;
    if (metricOverdueAmount) metricOverdueAmount.textContent = window.ReclaimUtils.formatCurrency(totalOverdueAmount);
    if (metricPayments) metricPayments.textContent = paidInstallments;
    if (metricAvgDays) metricAvgDays.textContent = avgDays;
    if (metricCommission) metricCommission.textContent = window.ReclaimUtils.formatCurrency(commissionSummary.totalCommission);

    // حفظ أي تغييرات تمت على البيانات (مثل التعليقات والدفعات)
    if (window.ReclaimDataStore && typeof window.ReclaimDataStore.save === "function") {
      window.ReclaimDataStore.save();
    }
  }
};

