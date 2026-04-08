/**
 * ==========================================
 * RECLAIM - Main Dashboard Logic
 * منطق لوحة المراقبة الرئيسية
 * ==========================================
 * 
 * هذا الملف يتحكم في:
 * 1. عرض وتحديث جدول العملاء المتخلفين
 * 2. عرض وتحديث جدول التقسيطات
 * 3. الملال والنوافذ المنبثقة
 * 4. معالجة الأحداث والنقرات
 * 5. الرسوم البيانية
 * 
 * This file manages:
 * 1. Rendering/updating the overdue customers table
 * 2. Rendering/updating the installments table
 * 3. Modals and popups
 * 4. Event handling and clicks
 * 5. Charts
 */

(() => {
  // ============================================
  // تهيئة المتغيرات والعناصر
  // INITIALIZE VARIABLES & DOM ELEMENTS
  // ============================================
  const { customers, installments, analytics } = window.ReclaimData;
  const { byId, formatCurrency, updateSharedMetrics } = window.ReclaimUtils;

  // أزرار التنقل بين الوحدات
  const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
  const modules = Array.from(document.querySelectorAll("section.module"));

  // المتغيرات الحالية للترتيب والتصفية
  let overdueSort = { key: "daysPastDue", dir: "desc" }; // ترتيب العملاء حسب أيام التأخير تنازلياً
  let modalAction = null;    // الدالة المراد تنفيذها عند تأكيد النافذة
  let collectionChart;       // كائن الرسم البياني للتحصيل
  let bucketChart;           // كائن الرسم البياني للفئات
  let currentRange = "monthly"; // النطاق الزمني الحالي

  // ============================================
  // دوال مساعدة محلية
  // LOCAL HELPER FUNCTIONS
  // ============================================
  
  /**
   * الحصول على رابط صورة العميل مع fallback
   * Get customer avatar URL with fallback
   */
  function getAvatarUrl(customer) {
    if (customer.photo) return customer.photo;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=0f766e&color=ffffff`;
  }

  /**
   * الحصول على سجل الأنشطة لعميل معين
   * Get activity log for customer
   */
  function getActivityLog(customer) {
    const entries = (customer.activity || []).slice(0, 2); // آخر نشاطين فقط
    if (!entries.length && customer.latestComments) {
      return `<li>${customer.latestComments}</li>`;
    }

    return entries
      .map((entry) => `<li>${entry.detail || entry.title}</li>`)
      .join("");
  }

  // ============================================
  // معالجة التنقل بين الوحدات
  // MODULE NAVIGATION HANDLING
  // ============================================
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // إذا كان الزر يحتوي على رابط خارجي، اذهب إليه
      if (btn.dataset.href) {
        window.location.href = btn.dataset.href;
        return;
      }

      // إزالة الفئة "active" من جميع الأزرار
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // إظهار/إخفاء الوحدات المطلوبة
      modules.forEach((module) => {
        module.classList.toggle("active", module.id === btn.dataset.target);
      });
    });
  });

  // ============================================
  // عرض جدول العملاء المتخلفين
  // RENDER OVERDUE CUSTOMERS TABLE
  // ============================================
  /**
   * تصفية وعرض جدول العملاء المتخلفين مع البحث والترتيب
   * Filter and render overdue customers table with search and sorting
   */
  function renderOverdueTable() {
    const q = byId("overdueSearch").value.trim().toLowerCase(); // نص البحث
    const priority = byId("priorityFilter").value; // الأولوية المختارة

    // تصفية العملاء حسب البحث والأولوية
    const filtered = customers
      .filter((c) => {
        const activityText = (c.activity || [])
          .map((entry) => (entry.title + " " + entry.detail).toLowerCase())
          .join(" ");
        const commentsText = (c.latestComments || "").toLowerCase();
        const matchesQuery = q === "" || 
          c.name.toLowerCase().includes(q) || 
          c.contact.toLowerCase().includes(q) || 
          commentsText.includes(q) || 
          activityText.includes(q);
        const matchesPriority = priority === "all" || c.priority === priority;
        return matchesQuery && matchesPriority;
      })
      .sort((a, b) => {
        const factor = overdueSort.dir === "asc" ? 1 : -1;
        return (a[overdueSort.key] - b[overdueSort.key]) * factor;
      });

    // إنشاء صفوف الجدول
    byId("overdueTableBody").innerHTML = filtered
      .map((c) => {
        return `
        <tr>
          <td>
            <div class="customer-media">
              <img class="customer-avatar" src="${getAvatarUrl(c)}" alt="${c.name}" loading="lazy" />
              <div>
                <a class="customer-link" href="installments-history.html?id=${encodeURIComponent(c.id)}"><strong>${c.name}</strong></a><br />
                <small style="color:var(--muted)">${c.id}</small>
              </div>
            </div>
          </td>
          <td>${c.contact}<br /><small style="color:var(--muted)">${c.email}</small></td>
          <td>
            <strong>${formatCurrency(c.overdueAmount)}</strong><br />
            <small style="color:var(--muted)">${c.daysPastDue} days overdue</small>
          </td>
          <td>
            <ul class="activity-preview">
              ${getActivityLog(c)}
            </ul>
          </td>
          <td><span class="pill priority-${c.priority}">${c.priority.toUpperCase()}</span></td>
          <td>
            <div class="controls">
              <button class="btn-warning" data-action="followup" data-id="${c.id}">Follow-up</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  // ============================================
  // عرض جدول التقسيطات
  // RENDER INSTALLMENTS TABLE
  // ============================================
  /**
   * تصفية وعرض جدول التقسيطات
   * Filter and render installments table
   */
  function renderInstallments() {
    const statusFilter = byId("installmentStatusFilter").value;

    const rows = installments
      .filter((inst) => statusFilter === "all" || inst.status === statusFilter)
      .map((inst) => {
        const totalPayable = inst.amount + inst.lateFee;
        return `
          <tr>
            <td><strong>${inst.customerName}</strong><br /><small style="color:var(--muted)">${inst.id}</small></td>
            <td>${inst.dueDate}</td>
            <td>${formatCurrency(inst.amount)}</td>
            <td>${formatCurrency(inst.lateFee)}</td>
            <td><strong>${formatCurrency(totalPayable)}</strong></td>
            <td><span class="pill status-${inst.status}">${inst.status.toUpperCase()}</span></td>
            <td>${inst.lateDays}</td>
            <td>
              <div class="controls">
                <button class="btn-outline" data-action="expandInst" data-inst-id="${inst.id}">Details</button>
                <button class="btn-primary" data-action="markInstPaid" data-inst-id="${inst.id}">Mark Paid</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    byId("installmentTableBody").innerHTML = rows;
  }

  // ============================================
  // إدارة النافذة المنبثقة
  // MODAL MANAGEMENT
  // ============================================
  /**
   * فتح النافذة المنبثقة مع محتوى مخصص
   * Open modal with custom content
   */
  function openModal(title, description, confirmText, actionFn) {
    byId("modalTitle").textContent = title;
    byId("modalDesc").textContent = description;
    byId("modalConfirmBtn").textContent = confirmText;
    byId("modalComment").value = "";
    byId("actionModal").classList.add("open");
    modalAction = actionFn;
  }

  /**
   * إغلاق النافذة المنبثقة
   * Close modal
   */
  function closeModal() {
    byId("actionModal").classList.remove("open");
    modalAction = null;
  }

  //============================================
  // الرسوم البيانية
  // CHARTS
  // ============================================
  /**
   * بناء الرسوم البيانية الأولية
   * Build initial charts
   */
  function buildCharts() {
    const defaultData = analytics.monthly;
    const ctx1 = byId("collectionChart").getContext("2d");
    const ctx2 = byId("bucketChart").getContext("2d");

    // رسم بياني للمبالغ المحصلة
    collectionChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: defaultData.labels,
        datasets: [{
          label: "Amount Collected (EGP)",
          data: defaultData.collected,
          backgroundColor: ["#0f766e", "#14b8a6", "#0b4f6c", "#2a9d8f"],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      }
    });

    // رسم بياني للفئات العمرية
    bucketChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["0-15 days", "16-30 days", "31-45 days", ">45 days"],
        datasets: [{
          data: defaultData.bucket,
          backgroundColor: ["#16a34a", "#f59e0b", "#f97316", "#e11d48"],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  /**
   * تحديث الرسوم البيانية بناءً على النطاق الزمني
   * Update charts based on time range
   */
  function updateCharts(range) {
    const data = analytics[range];
    if (!data) return;

    collectionChart.data.labels = data.labels;
    collectionChart.data.datasets[0].data = data.collected;
    collectionChart.update();

    bucketChart.data.datasets[0].data = data.bucket;
    bucketChart.update();
  }

  // ============================================
  // معالجات الأحداث
  // EVENT HANDLERS
  // ============================================
  
  // البحث والتصفية
  byId("overdueSearch").addEventListener("input", renderOverdueTable);
  byId("priorityFilter").addEventListener("change", renderOverdueTable);
  byId("installmentStatusFilter").addEventListener("change", renderInstallments);

  // الترتيب - معالجة أزرار الترتيب
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      if (overdueSort.key === key) {
        overdueSort.dir = overdueSort.dir === "asc" ? "desc" : "asc";
      } else {
        overdueSort = { key, dir: "desc" };
      }
      renderOverdueTable();
    });
  });

  // إعادة حساب الإجمالي - إعادة حساب الرسوم على التقسيطات المتأخرة
  byId("recalcTotalsBtn").addEventListener("click", () => {
    installments.forEach((inst) => {
      if (inst.status === "overdue") {
        inst.lateFee = Math.max(inst.lateFee, Math.round(inst.amount * 0.1));
      }
    });
    renderInstallments();
    updateSharedMetrics();
  });

  // إدارة النافذة المنبثقة
  byId("modalCloseBtn").addEventListener("click", closeModal);
  byId("actionModal").addEventListener("click", (e) => {
    if (e.target.id === "actionModal") closeModal();
  });
  byId("modalConfirmBtn").addEventListener("click", () => {
    if (typeof modalAction === "function") {
      modalAction(byId("modalComment").value.trim());
    }
    closeModal();
  });

  // ============================================
  // معالجة الإجراءات
  // ACTION HANDLERS
  // ============================================
  document.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    // إجراء: المتابعة
    if (action === "followup") {
      const customer = customers.find((c) => c.id === actionEl.dataset.id);
      if (!customer) return;

      openModal(
        "Schedule Follow-up",
        `Record a follow-up update for ${customer.name}.`,
        "Save Follow-up",
        (comment) => {
          customer.latestComments = comment || "Follow-up logged by agent.";
          customer.activity.unshift({
            title: "Follow-up Logged",
            detail: customer.latestComments,
            date: "2026-04-08"
          });
          renderOverdueTable();
          updateSharedMetrics();
        }
      );
    }

    // إجراء: عرض تفاصيل التقسيط
    if (action === "expandInst") {
      const inst = installments.find((i) => i.id === actionEl.dataset.instId);
      if (!inst) return;

      openModal(
        `Installment ${inst.id}`,
        `${inst.customerName} | Due ${inst.dueDate} | Status ${inst.status.toUpperCase()}`,
        "Close",
        null
      );
    }

    // إجراء: تسجيل دفع
    if (action === "markInstPaid") {
      const inst = installments.find((i) => i.id === actionEl.dataset.instId);
      if (!inst) return;

      openModal(
        "Mark Installment Paid",
        `Confirm payment posting for ${inst.id} (${inst.customerName}).`,
        "Post Payment",
        (comment) => {
          inst.status = "paid";
          inst.lateDays = 0;
          inst.lateFee = 0;

          const customer = customers.find((c) => c.id === inst.customerId);
          if (customer) {
            customer.summary.paidInstallments += 1;
            customer.summary.openInstallments = Math.max(0, customer.summary.openInstallments - 1);
            customer.activity.unshift({
              title: "Installment Paid",
              detail: comment || `Installment ${inst.id} posted as paid.`,
              date: "2026-04-08"
            });
          }

          renderInstallments();
          updateSharedMetrics();
        }
      );
    }
  });

  // ============================================
  // معالجات الرسوم البيانية
  // CHART HANDLERS
  // ============================================
  byId("rangeSelector").addEventListener("change", (e) => {
    currentRange = e.target.value;
    updateCharts(currentRange);
  });

  byId("shuffleDataBtn").addEventListener("click", () => {
    const data = analytics[currentRange];
    if (!data) return;

    data.collected = data.collected.map((v) => Math.max(1000, Math.round(v * (0.9 + Math.random() * 0.24))));
    data.bucket = data.bucket.map((v) => Math.max(1, Math.round(v * (0.85 + Math.random() * 0.35))));
    updateCharts(currentRange);
  });

  // ============================================
  // التهيئة الأولية
  // INITIAL SETUP
  // ============================================
  renderOverdueTable();       // عرض الجدول الأول
  renderInstallments();       // عرض جدول التقسيطات
  updateSharedMetrics();      // تحديث المقاييس العلوية
  buildCharts();              // بناء الرسوم البيانية
})();

