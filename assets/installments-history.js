(() => {
  const { customers, installments } = window.ReclaimData;
  const { byId, formatCurrency, formatPercent, getCustomerCollectionSummary } = window.ReclaimUtils;

  function parseCustomerId() {
    const id = new URLSearchParams(window.location.search).get("id");
    return id || customers[0].id;
  }

  const customerId = parseCustomerId();
  const customer = customers.find((c) => c.id === customerId) || customers[0];
  const customerInstallments = installments.filter((i) => i.customerId === customer.id);
  let historySort = { key: "dueDate", dir: "asc" };
  let activeDocIndex = 0;

  function getTodayDate() {
    return "2026-04-08";
  }

  function getCustomerPhotoUrl() {
    if (customer.photo) return customer.photo;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=0f766e&color=ffffff&size=160`;
  }

  function getNormalizedDocuments() {
    const rawAttachments = customer.attachments || [];
    const normalized = rawAttachments.map((name) => {
      const lower = name.toLowerCase();

      let type = "other";
      let label = "Supporting Document";

      if (/id|national|card/.test(lower)) {
        type = "id";
        label = "ID Card";
      } else if (/proof|address|utility|residence/.test(lower)) {
        type = "proof";
        label = "Proof of Address";
      }

      return {
        name,
        type,
        label,
        status: "available"
      };
    });

    const idDoc = normalized.find((doc) => doc.type === "id") || {
      name: "National_ID.jpg",
      type: "id",
      label: "ID Card",
      status: "missing"
    };

    const proofDoc = normalized.find((doc) => doc.type === "proof") || {
      name: "Proof_of_Address.pdf",
      type: "proof",
      label: "Proof of Address",
      status: "missing"
    };

    const extras = normalized.filter((doc) => doc.type === "other");
    return [idDoc, proofDoc, ...extras];
  }

  function renderProfile() {
    const summary = getCustomerCollectionSummary(customer.id);

    byId("pageTitle").textContent = `Customer Profile - ${customer.name}`;
    byId("customerAvatar").innerHTML = `<img src="${getCustomerPhotoUrl()}" alt="${customer.name}" loading="lazy" />`;
    byId("customerAvatar").setAttribute("aria-label", `${customer.name} avatar`);
    byId("customerName").textContent = customer.name;
    byId("customerMeta").textContent = `${customer.id} | ${customer.priority.toUpperCase()} PRIORITY`;
    byId("customerContact").textContent = `${customer.contact} | ${customer.email}`;
    byId("customerDebt").textContent = `${formatCurrency(customer.overdueAmount)} | ${customer.daysPastDue} days overdue`;

    const priorityBadge = byId("customerPriority");
    priorityBadge.textContent = customer.priority.toUpperCase();
    priorityBadge.className = `badge ${customer.priority}`;

    byId("profileCustomerId").textContent = customer.id;
    byId("profileTotalOverdue").textContent = formatCurrency(customer.overdueAmount);
    byId("profileDaysPastDue").textContent = `${customer.daysPastDue} days`;
    byId("profileOpenInstallments").textContent = customer.summary?.openInstallments ?? 0;
    byId("profilePaidInstallments").textContent = customer.summary?.paidInstallments ?? 0;
    byId("profileCollectedPercent").textContent = formatPercent(summary.collectedPercent);
    byId("profilePhone").textContent = customer.contact;
    byId("profileEmail").textContent = customer.email;
    byId("profileAddress").textContent = customer.address;
  }

  function renderTimeline() {
    const timelineHtml = customerInstallments
      .slice()
      .sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)))
      .map((inst) => {
        const total = inst.amount + inst.lateFee;

        return `
          <article class="activity-item">
            <div><strong>${inst.id}</strong> <span class="status ${inst.status}">${inst.status.toUpperCase()}</span></div>
            <div class="row-muted">Due ${inst.dueDate} | Late ${inst.lateDays} days</div>
            <div>${formatCurrency(total)} total payable</div>
            <div class="row-muted">${inst.details || "No extra details."}</div>
          </article>
        `;
      })
      .join("");

    byId("timelineList").innerHTML = timelineHtml || '<p class="row-muted">No installments available for this customer.</p>';
  }

  function renderActivity() {
    const rows = (customer.activity || []).map((entry) => `
      <article class="activity-item">
        <strong>${entry.title || "Activity Update"}</strong>
        <div class="row-muted">${entry.date || getTodayDate()}</div>
        <div>${entry.detail || "No comment"}</div>
      </article>
    `);

    byId("activityList").innerHTML = rows.join("") || '<p class="row-muted">No activity logs yet.</p>';
  }

  function renderDocuments() {
    const docs = getNormalizedDocuments();
    activeDocIndex = Math.min(activeDocIndex, Math.max(0, docs.length - 1));

    byId("docList").innerHTML = docs
      .map((doc, index) => `
        <li>
          <button type="button" class="doc-btn ${index === activeDocIndex ? "active" : ""}" data-doc-index="${index}">
            ${doc.label} ${doc.status === "missing" ? "(Missing)" : ""}
            <div class="row-muted">${doc.name}</div>
          </button>
        </li>
      `)
      .join("");

    const selected = docs[activeDocIndex];
    byId("docPreviewTitle").textContent = selected?.label || "Document Preview";

    if (!selected) {
      byId("docPreview").innerHTML = "No documents found.";
      return;
    }

    byId("docPreview").innerHTML = selected.status === "available"
      ? `
        <div>
          <strong>${selected.label}</strong>
          <p class="row-muted">${selected.name}</p>
          <p>Document available and attached to customer profile.</p>
        </div>
      `
      : `
        <div>
          <strong>${selected.label}</strong>
          <p class="row-muted">${selected.name}</p>
          <p>Missing document. Please collect and upload during next follow-up.</p>
        </div>
      `;
  }

  function renderHistory() {
    const search = byId("historySearch").value.trim().toLowerCase();
    const statusFilter = byId("historyStatusFilter").value;
    const summary = getCustomerCollectionSummary(customer.id);

    const filteredRows = customerInstallments
      .filter((i) => statusFilter === "all" || i.status === statusFilter)
      .filter((i) => {
        if (!search) return true;
        return i.id.toLowerCase().includes(search) || (i.details || "").toLowerCase().includes(search);
      })
      .sort((a, b) => {
        const factor = historySort.dir === "asc" ? 1 : -1;
        const left = historySort.key === "amount" || historySort.key === "lateDays" ? a[historySort.key] : String(a[historySort.key]).toLowerCase();
        const right = historySort.key === "amount" || historySort.key === "lateDays" ? b[historySort.key] : String(b[historySort.key]).toLowerCase();

        if (typeof left === "string" && typeof right === "string") {
          return left.localeCompare(right) * factor;
        }

        return (left - right) * factor;
      });

    byId("instBody").innerHTML = filteredRows.length
      ? filteredRows
          .map((r) => {
      const total = r.amount + r.lateFee;
      return `
        <tr>
          <td>
            <strong>${r.id}</strong><br />
            <span class="row-muted">${customer.id}</span>
          </td>
          <td>${r.dueDate}</td>
          <td>${formatCurrency(r.amount)}</td>
          <td>${formatCurrency(r.lateFee)}</td>
          <td><strong>${formatCurrency(total)}</strong></td>
          <td><span class="status ${r.status}">${r.status.toUpperCase()}</span></td>
          <td>${r.lateDays}</td>
          <td>${formatCurrency(total * (summary.commissionRate / 100))}<br /><span class="row-muted">${formatPercent(summary.commissionRate)}</span></td>
          <td>${r.details || "-"}</td>
        </tr>
      `;
          })
          .join("")
      : '<tr><td colspan="9" class="row-muted">No installments match the current search or filter.</td></tr>';

    const totalPayable = filteredRows.reduce((sum, i) => sum + i.amount + i.lateFee, 0);
    const overdueCount = filteredRows.filter((i) => i.status === "overdue").length;
    const pendingCount = filteredRows.filter((i) => i.status === "pending" || i.status === "partial").length;

    byId("mTotal").textContent = filteredRows.length;
    byId("mPayable").textContent = formatCurrency(totalPayable);
    byId("mOverdue").textContent = overdueCount;
    byId("mPending").textContent = pendingCount;
    byId("mCollected").textContent = formatPercent(summary.collectedPercent);
    byId("mCommissionRate").textContent = formatPercent(summary.commissionRate);
    byId("mCommission").textContent = formatCurrency(summary.commissionAmount);
  }

  function addActivityComment() {
    const comment = byId("activityComment").value.trim();
    if (!comment) return;

    const entry = {
      title: "Agent Note",
      detail: comment,
      date: getTodayDate()
    };

    customer.activity = customer.activity || [];
    customer.activity.unshift(entry);
    customer.latestComments = comment;
    byId("activityComment").value = "";
    renderActivity();
  }

  byId("historySearch").addEventListener("input", renderHistory);
  byId("historyStatusFilter").addEventListener("change", renderHistory);
  byId("historySort").addEventListener("change", (event) => {
    historySort = { key: event.target.value, dir: event.target.value === "dueDate" ? "asc" : "desc" };
    renderHistory();
  });
  byId("historySortId").addEventListener("click", () => {
    historySort = historySort.key === "id" ? { key: "id", dir: historySort.dir === "asc" ? "desc" : "asc" } : { key: "id", dir: "asc" };
    renderHistory();
  });
  byId("historySortDueDate").addEventListener("click", () => {
    historySort = historySort.key === "dueDate" ? { key: "dueDate", dir: historySort.dir === "asc" ? "desc" : "asc" } : { key: "dueDate", dir: "asc" };
    renderHistory();
  });
  byId("historySortAmount").addEventListener("click", () => {
    historySort = historySort.key === "amount" ? { key: "amount", dir: historySort.dir === "asc" ? "desc" : "asc" } : { key: "amount", dir: "desc" };
    renderHistory();
  });
  byId("historySortStatus").addEventListener("click", () => {
    historySort = historySort.key === "status" ? { key: "status", dir: historySort.dir === "asc" ? "desc" : "asc" } : { key: "status", dir: "asc" };
    renderHistory();
  });
  byId("historySortLateDays").addEventListener("click", () => {
    historySort = historySort.key === "lateDays" ? { key: "lateDays", dir: historySort.dir === "asc" ? "desc" : "asc" } : { key: "lateDays", dir: "desc" };
    renderHistory();
  });

  byId("addCommentBtn").addEventListener("click", addActivityComment);
  byId("docList").addEventListener("click", (event) => {
    const target = event.target.closest("[data-doc-index]");
    if (!target) return;

    activeDocIndex = Number(target.dataset.docIndex);
    renderDocuments();
  });

  renderProfile();
  renderTimeline();
  renderActivity();
  renderDocuments();
  renderHistory();
})();
