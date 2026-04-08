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
  
  // التحقق من توفر البيانات الأساسية
  if (!window.ReclaimData || !window.ReclaimUtils) {
    console.error("ReclaimData و ReclaimUtils غير متوفرة");
    window.ReclaimNotifications?.error("فشل في تحميل البيانات الأساسية");
    return;
  }

  const { customers, installments, analytics } = window.ReclaimData;
  const { byId, formatCurrency, updateSharedMetrics } = window.ReclaimUtils;
  const { handle: handleError, wrap: wrapErrorHandler } = window.ReclaimErrorHandler;
  const { validateCustomer, validateInstallment } = window.ReclaimValidation;
  const { setupImageElement } = window.ReclaimImageLoader;

  // أزرار التنقل بين الوحدات
  const navButtons = Array.from(document.querySelectorAll(".nav-btn") || []);
  const modules = Array.from(document.querySelectorAll("section.module") || []);

  // المتغيرات الحالية للترتيب والتصفية
  let overdueSort = { key: "daysPastDue", dir: "desc" };
  let modalAction = null;
  let collectionChart = null;
  let bucketChart = null;
  let currentRange = "monthly";

  // ============================================
  // دوال مساعدة محلية
  // LOCAL HELPER FUNCTIONS
  // ============================================
  
  /**
   * الحصول على رابط صورة العميل مع fallback
   * Get customer avatar URL with fallback
   */
  function getAvatarUrl(customer) {
    try {
      if (!customer) return window.ReclaimImageLoader.getDefaultAvatar();
      
      if (customer.photo && typeof customer.photo === "string") {
        return customer.photo;
      }
      
      // توليد صورة عشوائية بناءً على الاسم
      if (customer.name && typeof customer.name === "string") {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=0f766e&color=ffffff`;
      }
      
      return window.ReclaimImageLoader.getDefaultAvatar();
    } catch (error) {
      console.warn("Error getting avatar URL:", error);
      return window.ReclaimImageLoader.getDefaultAvatar();
    }
  }

  /**
   * الحصول على سجل الأنشطة لعميل معين
   * Get activity log for customer
   */
  function getActivityLog(customer) {
    try {
      if (!customer) return "";
      
      const entries = (customer.activity || []).slice(0, 2);
      if (!entries.length && customer.latestComments) {
        const comment = String(customer.latestComments || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<li>${comment}</li>`;
      }

      return entries
        .map((entry) => {
          const detail = String(entry.detail || entry.title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          return `<li>${detail}</li>`;
        })
        .join("");
    } catch (error) {
      console.warn("Error getting activity log:", error);
      return "";
    }
  }

  // ============================================
  // معالجة التنقل بين الوحدات
  // MODULE NAVIGATION HANDLING
  // ============================================
  navButtons.forEach((btn) => {
    btn.addEventListener("click", wrapErrorHandler(() => {
      if (btn.dataset.href) {
        window.location.href = btn.dataset.href;
        return;
      }

      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      modules.forEach((module) => {
        module.classList.toggle("active", module.id === btn.dataset.target);
      });
    }, "التنقل بين الوحدات"));
  });

  // ============================================
  // عرض جدول العملاء المتخلفين
  // RENDER OVERDUE CUSTOMERS TABLE
  // ============================================
  const renderOverdueTable = wrapErrorHandler(function() {
    try {
      const searchEl = byId("overdueSearch");
      const filterEl = byId("priorityFilter");
      const tableBodyEl = byId("overdueTableBody");

      if (!searchEl || !filterEl || !tableBodyEl) {
        handleError("عناصر واجهة المستخدم مفقودة", "عرض الجدول");
        return;
      }

      const q = (searchEl.value || "").trim().toLowerCase();
      const priority = filterEl.value || "all";

      // تصفية العملاء مع التحقق من صحة البيانات
      const filtered = (customers || [])
        .filter((c) => {
          try {
            // التحقق من صحة العميل
            const errors = validateCustomer(c);
            if (errors.length > 0) {
              console.warn(`عميل به أخطاء (${c.id}):`, errors);
              return false;
            }

            const activityText = (c.activity || [])
              .map((entry) => ((entry.title || "") + " " + (entry.detail || "")).toLowerCase())
              .join(" ");
            const commentsText = (c.latestComments || "").toLowerCase();
            const matchesQuery = q === "" || 
              (c.name && c.name.toLowerCase().includes(q)) || 
              (c.contact && c.contact.toLowerCase().includes(q)) || 
              commentsText.includes(q) || 
              activityText.includes(q);
            const matchesPriority = priority === "all" || c.priority === priority;
            return matchesQuery && matchesPriority;
          } catch (error) {
            console.warn("خطأ في تصفية العميل:", error);
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const factor = overdueSort.dir === "asc" ? 1 : -1;
            const aVal = a[overdueSort.key] || 0;
            const bVal = b[overdueSort.key] || 0;
            return (aVal - bVal) * factor;
          } catch (error) {
            console.warn("خطأ في الترتيب:", error);
            return 0;
          }
        });

      // إنشاء صفوف الجدول مع الهروب من HTML
      tableBodyEl.innerHTML = filtered
        .map((c) => {
          try {
            const name = String(c.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const id = String(c.id || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const contact = String(c.contact || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const email = String(c.email || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const avatar = getAvatarUrl(c);
            const safeId = encodeURIComponent(c.id || "");
            
            return `
            <tr>
              <td>
                <div class="customer-media">
                  <img class="customer-avatar" src="${avatar}" alt="${name}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230f766e%22 stroke-width=%222%22%3E%3Cpath d=%22M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2%22%3E%3C/path%3E%3Ccircle cx=%2212%22 cy=%227%22 r=%224%22%3E%3C/circle%3E%3C/svg%3E'" />
                  <div>
                    <a class="customer-link" href="installments-history.html?id=${safeId}"><strong>${name}</strong></a><br />
                    <small style="color:var(--muted)">${id}</small>
                  </div>
                </div>
              </td>
              <td>${contact}<br /><small style="color:var(--muted)">${email}</small></td>
              <td>
                <strong>${formatCurrency(c.overdueAmount || 0)}</strong><br />
                <small style="color:var(--muted)">${c.daysPastDue || 0} أيام متأخرة</small>
              </td>
              <td>
                <ul class="activity-preview">
                  ${getActivityLog(c)}
                </ul>
              </td>
              <td><span class="pill priority-${c.priority || 'low'}">${(c.priority || 'low').toUpperCase()}</span></td>
              <td>
                <div class="controls">
                  <button class="btn-warning" data-action="followup" data-id="${safeId}">متابعة</button>
                </div>
              </td>
            </tr>
          `;
          } catch (error) {
            console.warn("خطأ في عرض صف:", error);
            return "";
          }
        })
        .filter(Boolean)
        .join("");
    } catch (error) {
      handleError(error, "عرض جدول المتخلفين");
    }
  }, "عرض جدول المتخلفين");

  // ============================================
  // عرض جدول التقسيطات
  // RENDER INSTALLMENTS TABLE
  // ============================================
  const renderInstallments = wrapErrorHandler(function() {
    try {
      const filterEl = byId("installmentStatusFilter");
      const tableBodyEl = byId("installmentTableBody");

      if (!filterEl || !tableBodyEl) {
        handleError("عناصر الجدول مفقودة", "عرض التقسيطات");
        return;
      }

      const statusFilter = filterEl.value || "all";

      const rows = (installments || [])
        .filter((inst) => {
          try {
            // التحقق من صحة التقسيط
            const errors = validateInstallment(inst);
            if (errors.length > 0) {
              console.warn(`تقسيط به أخطاء (${inst.id}):`, errors);
              return false;
            }
            return statusFilter === "all" || inst.status === statusFilter;
          } catch (error) {
            console.warn("خطأ في تصفية التقسيط:", error);
            return false;
          }
        })
        .map((inst) => {
          try {
            const totalPayable = (inst.amount || 0) + (inst.lateFee || 0);
            const customerName = String(inst.customerName || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const id = String(inst.id || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const dueDate = String(inst.dueDate || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeInstId = encodeURIComponent(inst.id || "");
            
            return `
              <tr>
                <td><strong>${customerName}</strong><br /><small style="color:var(--muted)">${id}</small></td>
                <td>${dueDate}</td>
                <td>${formatCurrency(inst.amount || 0)}</td>
                <td>${formatCurrency(inst.lateFee || 0)}</td>
                <td><strong>${formatCurrency(totalPayable)}</strong></td>
                <td><span class="pill status-${inst.status || 'pending'}">${(inst.status || 'pending').toUpperCase()}</span></td>
                <td>${inst.lateDays || 0}</td>
                <td>
                  <div class="controls">
                    <button class="btn-outline" data-action="expandInst" data-inst-id="${safeInstId}">التفاصيل</button>
                    <button class="btn-primary" data-action="markInstPaid" data-inst-id="${safeInstId}">تسجيل الدفع</button>
                  </div>
                </td>
              </tr>
            `;
          } catch (error) {
            console.warn("خطأ في عرض صف التقسيط:", error);
            return "";
          }
        })
        .filter(Boolean)
        .join("");

      tableBodyEl.innerHTML = rows;
    } catch (error) {
      handleError(error, "عرض جدول التقسيطات");
    }
  }, "عرض جدول التقسيطات");

  // ============================================
  // إدارة النافذة المنبثقة
  // MODAL MANAGEMENT
  // ============================================
  
  /**
   * فتح النافذة المنبثقة مع محتوى مخصص
   * Open modal with custom content
   */
  const openModal = wrapErrorHandler(function(title, description, confirmText, actionFn) {
    try {
      const modalTitleEl = byId("modalTitle");
      const modalDescEl = byId("modalDesc");
      const modalConfirmBtnEl = byId("modalConfirmBtn");
      const modalCommentEl = byId("modalComment");
      const actionModalEl = byId("actionModal");

      if (!modalTitleEl || !modalDescEl || !modalConfirmBtnEl || !modalCommentEl || !actionModalEl) {
        handleError("عناصر النافذة المنبثقة مفقودة", "فتح النافذة");
        return;
      }

      modalTitleEl.textContent = String(title || "");
      modalDescEl.textContent = String(description || "");
      modalConfirmBtnEl.textContent = String(confirmText || "تأكيد");
      modalCommentEl.value = "";
      actionModalEl.classList.add("open");
      modalAction = typeof actionFn === "function" ? actionFn : null;
    } catch (error) {
      handleError(error, "فتح النافذة المنبثقة");
    }
  }, "فتح النافذة");

  /**
   * إغلاق النافذة المنبثقة
   * Close modal
   */
  const closeModal = wrapErrorHandler(function() {
    try {
      const actionModalEl = byId("actionModal");
      if (actionModalEl) {
        actionModalEl.classList.remove("open");
      }
      modalAction = null;
    } catch (error) {
      handleError(error, "إغلاق النافذة");
    }
  }, "إغلاق النافذة");

  // ============================================
  // الرسوم البيانية مع معالجة الأخطاء
  // CHARTS WITH ERROR HANDLING
  // ============================================
  
  /**
   * بناء الرسوم البيانية الأولية
   * Build initial charts
   */
  const buildCharts = wrapErrorHandler(function() {
    try {
      if (!analytics || !analytics.monthly) {
        console.warn("بيانات التحليلات غير متوفرة");
        return;
      }

      const ctx1 = byId("collectionChart")?.getContext("2d");
      const ctx2 = byId("bucketChart")?.getContext("2d");

      if (!ctx1 || !ctx2 || typeof Chart === "undefined") {
        console.warn("عناصر الرسوم البيانية غير متوفرة أو Chart.js غير محمل");
        return;
      }

      const defaultData = analytics.monthly;

      // رسم بياني للمبالغ المحصلة
      collectionChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: defaultData.labels || [],
          datasets: [{
            label: "المبلغ المحصل (EGP)",
            data: defaultData.collected || [],
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
          labels: ["0-15 يوم", "16-30 يوم", "31-45 يوم", ">45 يوم"],
          datasets: [{
            data: defaultData.bucket || [],
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
    } catch (error) {
      handleError(error, "بناء الرسوم البيانية");
    }
  }, "بناء الرسوم البيانية");

  /**
   * تحديث الرسوم البيانية بناءً على النطاق الزمني
   * Update charts based on time range
   */
  const updateCharts = wrapErrorHandler(function(range) {
    try {
      if (!analytics || !analytics[range]) {
        handleError("البيانات غير متوفرة للنطاق المحدد", "تحديث الرسوم البيانية");
        return;
      }

      const data = analytics[range];

      if (collectionChart && collectionChart.data) {
        collectionChart.data.labels = data.labels || [];
        if (collectionChart.data.datasets[0]) {
          collectionChart.data.datasets[0].data = data.collected || [];
        }
        collectionChart.update();
      }

      if (bucketChart && bucketChart.data) {
        if (bucketChart.data.datasets[0]) {
          bucketChart.data.datasets[0].data = data.bucket || [];
        }
        bucketChart.update();
      }
    } catch (error) {
      handleError(error, "تحديث الرسوم البيانية");
    }
  }, "تحديث الرسوم البيانية");

  // ============================================
  // معالجات الأحداث
  // EVENT HANDLERS
  // ============================================
  
  // البحث والتصفية
  byId("overdueSearch")?.addEventListener("input", renderOverdueTable);
  byId("priorityFilter")?.addEventListener("change", renderOverdueTable);
  byId("installmentStatusFilter")?.addEventListener("change", renderInstallments);

  // الترتيب
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", wrapErrorHandler(() => {
      const key = button.dataset.sort;
      if (!key) return;

      if (overdueSort.key === key) {
        overdueSort.dir = overdueSort.dir === "asc" ? "desc" : "asc";
      } else {
        overdueSort = { key, dir: "desc" };
      }
      renderOverdueTable();
    }, "الترتيب"));
  });

  // إعادة حساب الإجمالي
  byId("recalcTotalsBtn")?.addEventListener("click", wrapErrorHandler(() => {
    (installments || []).forEach((inst) => {
      try {
        if (inst && inst.status === "overdue") {
          inst.lateFee = Math.max(inst.lateFee || 0, Math.round((inst.amount || 0) * 0.1));
        }
      } catch (error) {
        console.warn("خطأ في إعادة حساب الرسوم:", error);
      }
    });
    renderInstallments();
    updateSharedMetrics?.();
    window.ReclaimNotifications.success("تم إعادة حساب الرسوم بنجاح");
  }, "إعادة حساب الرسوم"));

  // إدارة النافذة المنبثقة
  byId("modalCloseBtn")?.addEventListener("click", closeModal);
  byId("actionModal")?.addEventListener("click", (e) => {
    if (e.target.id === "actionModal") closeModal();
  });
  byId("modalConfirmBtn")?.addEventListener("click", wrapErrorHandler(() => {
    if (typeof modalAction === "function") {
      const comment = (byId("modalComment")?.value || "").trim();
      modalAction(comment);
    }
    closeModal();
  }, "تأكيد الإجراء"));

  // ============================================
  // معالجة الإجراءات
  // ACTION HANDLERS
  // ============================================
  document.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    const customerId = actionEl.dataset.id;
    const instId = actionEl.dataset.instId;

    // إجراء: المتابعة
    if (action === "followup") {
      wrapErrorHandler(() => {
        if (!customerId) {
          handleError("معرف العميل مفقود", "جدولة المتابعة");
          return;
        }

        const customer = (customers || []).find((c) => c.id === customerId);
        if (!customer) {
          handleError("العميل غير موجود", "جدولة المتابعة");
          return;
        }

        openModal(
          `جدولة المتابعة - ${customer.name}`,
          `سجل تحديث متابعة لـ ${customer.name}.`,
          "حفظ المتابعة",
          (comment) => {
            try {
              customer.latestComments = comment || "تم تسجيل المتابعة بواسطة الوكيل.";
              if (!customer.activity) customer.activity = [];
              customer.activity.unshift({
                title: "تم تسجيل المتابعة",
                detail: customer.latestComments,
                date: new Date().toISOString().split("T")[0]
              });
              renderOverdueTable();
              updateSharedMetrics?.();
              window.ReclaimNotifications.success("تم حفظ المتابعة بنجاح");
            } catch (error) {
              handleError(error, "حفظ المتابعة");
            }
          }
        );
      }, "جدولة المتابعة")();
    }

    // إجراء: عرض تفاصيل التقسيط
    if (action === "expandInst") {
      wrapErrorHandler(() => {
        if (!instId) {
          handleError("معرف التقسيط مفقود", "عرض التفاصيل");
          return;
        }

        const inst = (installments || []).find((i) => i.id === instId);
        if (!inst) {
          handleError("التقسيط غير موجود", "عرض التفاصيل");
          return;
        }

        const errors = validateInstallment(inst);
        if (errors.length > 0) {
          console.warn("تحذيرات في بيانات التقسيط:", errors);
        }

        openModal(
          `التقسيط ${inst.id}`,
          `${inst.customerName} | الاستحقاق ${inst.dueDate} | الحالة ${(inst.status || "PENDING").toUpperCase()}`,
          "إغلاق",
          null
        );
      }, "عرض تفاصيل التقسيط")();
    }

    // إجراء: تسجيل دفع
    if (action === "markInstPaid") {
      wrapErrorHandler(() => {
        if (!instId) {
          handleError("معرف التقسيط مفقود", "تسجيل الدفع");
          return;
        }

        const inst = (installments || []).find((i) => i.id === instId);
        if (!inst) {
          handleError("التقسيط غير موجود", "تسجيل الدفع");
          return;
        }

        openModal(
          "تسجيل دفع التقسيط",
          `تأكيد تسجيل الدفع لـ ${inst.id} (${inst.customerName}).`,
          "تسجيل الدفع",
          (comment) => {
            try {
              inst.status = "paid";
              inst.lateDays = 0;
              inst.lateFee = 0;

              const customer = (customers || []).find((c) => c.id === inst.customerId);
              if (customer && customer.summary) {
                customer.summary.paidInstallments = (customer.summary.paidInstallments || 0) + 1;
                customer.summary.openInstallments = Math.max(0, (customer.summary.openInstallments || 0) - 1);
                
                if (!customer.activity) customer.activity = [];
                customer.activity.unshift({
                  title: "تم دفع التقسيط",
                  detail: comment || `تم تسجيل التقسيط ${inst.id} كمدفوع.`,
                  date: new Date().toISOString().split("T")[0]
                });
              }

              renderInstallments();
              updateSharedMetrics?.();
              window.ReclaimNotifications.success("تم تسجيل الدفع بنجاح");
            } catch (error) {
              handleError(error, "تسجيل الدفع");
            }
          }
        );
      }, "تسجيل دفع التقسيط")();
    }
  });

  // ============================================
  // معالجات الرسوم البيانية
  // CHART HANDLERS
  // ============================================
  byId("rangeSelector")?.addEventListener("change", wrapErrorHandler((e) => {
    currentRange = e.target?.value || "monthly";
    updateCharts(currentRange);
  }, "تغيير النطاق الزمني"));

  byId("shuffleDataBtn")?.addEventListener("click", wrapErrorHandler(() => {
    const data = analytics?.[currentRange];
    if (!data) return;

    try {
      if (data.collected) {
        data.collected = data.collected.map((v) => Math.max(1000, Math.round(v * (0.9 + Math.random() * 0.24))));
      }
      if (data.bucket) {
        data.bucket = data.bucket.map((v) => Math.max(1, Math.round(v * (0.85 + Math.random() * 0.35))));
      }
      updateCharts(currentRange);
      window.ReclaimNotifications.info("تم تحديث البيانات التجريبية");
    } catch (error) {
      handleError(error, "تحديث البيانات");
    }
  }, "تحديث البيانات"));

  // ============================================
  // التهيئة الأولية
  // INITIAL SETUP
  // ============================================
  try {
    renderOverdueTable();
    renderInstallments();
    updateSharedMetrics?.();
    buildCharts();
    window.ReclaimNotifications.success("تم تحميل لوحة المراقبة بنجاح");
  } catch (error) {
    handleError(error, "التهيئة الأولية");
  }
})();

