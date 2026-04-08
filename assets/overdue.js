(() => {
  const { customers, installments } = window.ReclaimData;
  const { byId, formatCurrency, formatPercent, updateSharedMetrics, getCustomersByAgingBucket } = window.ReclaimUtils;

  let overdueSort = { key: "daysPastDue", dir: "desc" };
  let modalAction = null;

  function dateDiffInDays(fromDate, toDate) {
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    const diff = end - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function getTodayDate() {
    return "2026-04-08";
  }

  function showSmartAlerts() {
    if (!window.ReclaimNotifications) return;

    const today = getTodayDate();
    const sessionKey = `reclaim.overdue.alerts.${today}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const notContacted = customers
      .map((customer) => {
        const lastActivityDate = (customer.activity || [])
          .map((item) => item.date)
          .filter(Boolean)
          .sort()
          .slice(-1)[0];

        if (!lastActivityDate) return { customer, days: 999 };
        return { customer, days: dateDiffInDays(lastActivityDate, today) };
      })
      .filter((item) => item.days >= 3)
      .sort((a, b) => b.days - a.days);

    notContacted.slice(0, 2).forEach((item) => {
      window.ReclaimNotifications.warning(`Alert: ${item.customer.name} has not been contacted for ${item.days} days`);
    });

    if (notContacted.length > 2) {
      window.ReclaimNotifications.info(`${notContacted.length} customers need urgent follow-up.`);
    }

    const paidCustomers = customers.filter((customer) =>
      installments.some((inst) => inst.customerId === customer.id && inst.status === "paid")
    );

    if (paidCustomers.length) {
      window.ReclaimNotifications.success(`Great: ${paidCustomers[0].name} has recorded payments.`);
    }

    sessionStorage.setItem(sessionKey, "1");
  }

  function getAvatarUrl(customer) {
    if (customer.photo) return customer.photo;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=0f766e&color=ffffff`;
  }

  function getActivityLog(customer) {
    const entries = (customer.activity || []).slice(0, 2);
    if (!entries.length && customer.latestComments) {
      return `<li>${customer.latestComments}</li>`;
    }

    return entries
      .map((entry) => `<li>${entry.detail || entry.title}</li>`)
      .join("");
  }

  function renderOverdueTable() {
    const q = byId("overdueSearch").value.trim().toLowerCase();
    const priority = byId("priorityFilter").value;

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
            <button class="btn-warning" data-action="followup" data-id="${c.id}">Follow-up</button>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  function renderAgingBuckets() {
    const agingBucketsEl = byId("agingBuckets");
    if (!agingBucketsEl) return;

    const buckets = getCustomersByAgingBucket();

    agingBucketsEl.innerHTML = buckets
      .map((bucket) => {
        const bucketTotalCommission = bucket.customers.reduce((sum, entry) => sum + entry.summary.commissionAmount, 0);
        const bucketTotalCollected = bucket.customers.reduce((sum, entry) => sum + entry.summary.collectedAmount, 0);

        return `
          <article class="aging-card">
            <h4>${bucket.label}</h4>
            <div class="aging-meta">
              <span>${bucket.customers.length} customers</span>
              <span>${formatCurrency(bucketTotalCollected)} collected</span>
              <span class="commission-pill${bucket.label === "January 5, 2026 and older" ? " high-risk" : ""}">${formatCurrency(bucketTotalCommission)} commission</span>
            </div>
            <ul class="customer-stack">
              ${bucket.customers
                .map((entry) => `
                  <li>
                    <strong><a class="customer-link" href="installments-history.html?id=${encodeURIComponent(entry.customer.id)}">${entry.customer.name}</a></strong>
                    <span>${formatPercent(entry.summary.collectedPercent)} collected | ${formatPercent(entry.summary.commissionRate)} commission</span>
                  </li>
                `)
                .join("")}
            </ul>
          </article>
        `;
      })
      .join("");
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

  byId("overdueSearch").addEventListener("input", renderOverdueTable);
  byId("priorityFilter").addEventListener("change", renderOverdueTable);

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

    if (actionEl.dataset.action === "followup") {
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
          renderAgingBuckets();
          updateSharedMetrics();
          if (window.ReclaimNotifications) {
            window.ReclaimNotifications.success(`A new comment was added for ${customer.name}`);
          }
        }
      );
    }
  });

  renderOverdueTable();
  renderAgingBuckets();
  updateSharedMetrics();
  showSmartAlerts();
})();
