(() => {
  const { customers, installments } = window.ReclaimData;
  const { byId, formatCurrency, formatPercent, updateSharedMetrics, getCustomerCollectionSummary } = window.ReclaimUtils;

  let installmentSort = { key: "dueDate", dir: "asc" };
  let modalAction = null;

  function getTodayDate() {
    return "2026-04-08";
  }

  function showPaymentSummaryAlert() {
    if (!window.ReclaimNotifications) return;

    const today = getTodayDate();
    const sessionKey = `reclaim.installments.alerts.${today}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const paidCount = installments.filter((inst) => inst.status === "paid").length;
    if (paidCount > 0) {
      window.ReclaimNotifications.info(`Notice: ${paidCount} payments were recorded in the system.`);
    }

    const overdueCount = installments.filter((inst) => inst.status === "overdue").length;
    if (overdueCount > 0) {
      window.ReclaimNotifications.warning(`Alert: ${overdueCount} overdue installments need follow-up.`);
    }

    sessionStorage.setItem(sessionKey, "1");
  }

  function renderInstallments() {
    const search = byId("installmentSearch").value.trim().toLowerCase();
    const statusFilter = byId("installmentStatusFilter").value;

    const filteredRows = installments
      .filter((inst) => statusFilter === "all" || inst.status === statusFilter)
      .filter((inst) => {
        if (!search) return true;
        return inst.customerName.toLowerCase().includes(search) || inst.customerId.toLowerCase().includes(search) || inst.id.toLowerCase().includes(search);
      })
      .sort((a, b) => {
        const factor = installmentSort.dir === "asc" ? 1 : -1;
        const left = installmentSort.key === "customerName" || installmentSort.key === "status" ? String(a[installmentSort.key]).toLowerCase() : a[installmentSort.key];
        const right = installmentSort.key === "customerName" || installmentSort.key === "status" ? String(b[installmentSort.key]).toLowerCase() : b[installmentSort.key];

        if (typeof left === "string" && typeof right === "string") {
          return left.localeCompare(right) * factor;
        }

        return (left - right) * factor;
      });

    const rows = filteredRows
      .map((inst) => {
        const totalPayable = inst.amount + inst.lateFee;
        const summary = getCustomerCollectionSummary(inst.customerId);
        return `
          <tr>
            <td><a class="customer-link" href="installments-history.html?id=${encodeURIComponent(inst.customerId)}"><strong>${inst.customerName}</strong></a><br /><small style="color:var(--muted)">${inst.id}</small></td>
            <td>${inst.dueDate}</td>
            <td>${formatCurrency(inst.amount)}</td>
            <td>${formatCurrency(inst.lateFee)}</td>
            <td><strong>${formatCurrency(totalPayable)}</strong></td>
            <td><strong>${formatCurrency(totalPayable * (summary.commissionRate / 100))}</strong><br /><small style="color:var(--muted)">${formatPercent(summary.commissionRate)}</small></td>
            <td><span class="pill status-${inst.status}">${inst.status.toUpperCase()}</span></td>
            <td>${inst.lateDays}</td>
            <td>
              <div class="controls">
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    byId("installmentTableBody").innerHTML = rows || '<tr><td colspan="9" class="row-muted">No installments match the current search or filter.</td></tr>';
  }

  function openModal(title, description, confirmText, actionFn) {
    byId("modalTitle").textContent = title;
    byId("modalDesc").textContent = description;
    byId("modalConfirmBtn").textContent = confirmText;
    byId("modalComment").value = "";
    byId("actionModal").classList.add("open");
    modalAction = actionFn;
  }

  function closeModal() {
    byId("actionModal").classList.remove("open");
    modalAction = null;
  }

  byId("installmentStatusFilter").addEventListener("change", renderInstallments);
  byId("installmentSearch").addEventListener("input", renderInstallments);

  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      if (installmentSort.key === key) {
        installmentSort.dir = installmentSort.dir === "asc" ? "desc" : "asc";
      } else {
        installmentSort = { key, dir: key === "dueDate" ? "asc" : "desc" };
      }
      renderInstallments();
    });
  });

  byId("recalcTotalsBtn").addEventListener("click", () => {
    installments.forEach((inst) => {
      if (inst.status === "overdue") {
        inst.lateFee = Math.max(inst.lateFee, Math.round(inst.amount * 0.1));
      }
    });
    renderInstallments();
    updateSharedMetrics();
  });

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

  document.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;

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
          if (window.ReclaimNotifications) {
            window.ReclaimNotifications.success(`Payment posted: ${inst.customerName} - ${inst.id}`);
          }
        }
      );
    }
  });

  renderInstallments();
  updateSharedMetrics();
  showPaymentSummaryAlert();
})();
