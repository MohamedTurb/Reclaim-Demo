(() => {
  if (!window.ReclaimData || !window.ReclaimUtils) {
    console.error("Reclaim core dependencies are missing");
    return;
  }

  const { customers, installments } = window.ReclaimData;
  const { byId } = window.ReclaimUtils;

  const USERS_KEY = "reclaim.users.v1";
  const SETTINGS_KEY = "reclaim.admin.settings.v1";
  const AUDIT_KEY = "reclaim.admin.audit.v1";
  const NOTIFICATION_LOG_KEY = "reclaim.notifications.log.v1";

  const demoUsers = [
    { id: "U-1001", name: "System Admin", email: "admin@reclaim.com", role: "admin", active: true, lastLogin: "2026-04-09 09:20" },
    { id: "U-1002", name: "Lead Collector", email: "collector@reclaim.com", role: "collector", active: true, lastLogin: "2026-04-09 08:40" },
    { id: "U-1003", name: "Operations Manager", email: "manager@reclaim.com", role: "manager", active: true, lastLogin: "2026-04-08 16:10" },
    { id: "U-1004", name: "Read-Only Auditor", email: "viewer@reclaim.com", role: "viewer", active: false, lastLogin: "2026-04-05 11:15" }
  ];

  function getRoleLabel(role) {
    const map = {
      admin: "Admin",
      manager: "Manager",
      collector: "Collector",
      viewer: "Viewer"
    };
    return map[role] || "Viewer";
  }

  function isAssignableStaff(user) {
    return user && (user.role === "collector" || user.role === "manager");
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeedUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
      writeJson(USERS_KEY, demoUsers);
    }
  }

  function getUsers() {
    return readJson(USERS_KEY, demoUsers.slice());
  }

  function setUsers(users) {
    writeJson(USERS_KEY, users);
  }

  function getSettings() {
    return readJson(SETTINGS_KEY, {
      graceDays: 3,
      autoReminderDays: 2,
      legalEscalationEnabled: true
    });
  }

  function setSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
  }

  function getOverdueDays(customer) {
    return Number(customer?.daysPastDue || 0);
  }

  function matchesOverdueRange(customer, rangeValue) {
    const days = getOverdueDays(customer);

    switch (rangeValue) {
      case "1-30":
        return days >= 1 && days <= 30;
      case "30-60":
        return days >= 31 && days <= 60;
      case "60-90":
        return days >= 61 && days <= 90;
      case "90+":
        return days >= 91;
      default:
        return true;
    }
  }

  function getBulkFilteredCustomers() {
    const rangeFilter = byId("bulkOverdueRangeFilter")?.value || "all";
    return customers.filter((customer) => matchesOverdueRange(customer, rangeFilter));
  }

  function updateOverdueRangeFilterOptions() {
    const rangeSelect = byId("bulkOverdueRangeFilter");
    if (!rangeSelect) return;

    const currentValue = rangeSelect.value || "all";
    const counts = {
      all: customers.length,
      "1-30": customers.filter((customer) => matchesOverdueRange(customer, "1-30")).length,
      "30-60": customers.filter((customer) => matchesOverdueRange(customer, "30-60")).length,
      "60-90": customers.filter((customer) => matchesOverdueRange(customer, "60-90")).length,
      "90+": customers.filter((customer) => matchesOverdueRange(customer, "90+")).length
    };

    const labels = {
      all: `All Customers (${counts.all})`,
      "1-30": `1-30 days overdue (${counts["1-30"]})`,
      "30-60": `30-60 days overdue (${counts["30-60"]})`,
      "60-90": `60-90 days overdue (${counts["60-90"]})`,
      "90+": `+90 days overdue (${counts["90+"]})`
    };

    Array.from(rangeSelect.options || []).forEach((option) => {
      if (labels[option.value]) {
        option.textContent = labels[option.value];
      }
    });

    rangeSelect.value = labels[currentValue] ? currentValue : "all";
  }

  function getAuditEntries() {
    return readJson(AUDIT_KEY, []);
  }

  function pushAudit(message, type = "info") {
    const entries = getAuditEntries();
    entries.push({
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      message,
      type,
      at: new Date().toISOString()
    });
    writeJson(AUDIT_KEY, entries.slice(-120));
  }

  function createAuditFromNotifications() {
    const logs = readJson(NOTIFICATION_LOG_KEY, []);
    return logs.slice(-10).map((item) => ({
      id: item.id,
      message: item.message,
      type: item.type,
      at: item.at
    }));
  }

  function formatTimestamp(isoTime) {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString();
  }

  function refreshMetrics() {
    const users = getUsers();
    const activeUsers = users.filter((user) => user.active).length;
    const overdueCases = customers.filter((customer) => (customer.daysPastDue || 0) > 0).length;
    const pendingInstallments = installments.filter((installment) => installment.status !== "paid").length;

    byId("metricUsers").textContent = String(users.length);
    byId("metricActiveUsers").textContent = String(activeUsers);
    byId("metricAdminOverdue").textContent = String(overdueCases);
    byId("metricAdminPending").textContent = String(pendingInstallments);
  }

  function renderUsers() {
    const body = byId("adminUsersBody");
    if (!body) return;

    const searchQuery = (byId("adminUserSearch")?.value || "").trim().toLowerCase();
    const roleFilter = byId("adminRoleFilter")?.value || "all";

    const rows = getUsers()
      .filter((user) => {
        const matchesSearch =
          !searchQuery ||
          user.name.toLowerCase().includes(searchQuery) ||
          user.email.toLowerCase().includes(searchQuery);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .map((user) => {
        const statusClass = user.active ? "status-paid" : "status-overdue";
        const statusLabel = user.active ? "ACTIVE" : "INACTIVE";

        return `
          <tr>
            <td>
              <strong>${user.name}</strong><br />
              <small style="color:var(--muted)">${user.email}</small>
            </td>
            <td><span class="pill status-partial">${getRoleLabel(user.role).toUpperCase()}</span></td>
            <td><span class="pill ${statusClass}">${statusLabel}</span></td>
            <td>${user.lastLogin || "Never"}</td>
            <td>
              <div class="controls">
                <button class="btn-outline" data-action="toggle-user" data-id="${user.id}">${user.active ? "Deactivate" : "Activate"}</button>
                <button class="btn-warning" data-action="delete-user" data-id="${user.id}">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    body.innerHTML = rows || '<tr><td colspan="5" class="row-muted">No users match your filters.</td></tr>';
  }

  function renderSettings() {
    const settings = getSettings();

    byId("settingGraceDays").value = String(settings.graceDays ?? 3);
    byId("settingAutoReminder").value = String(settings.autoReminderDays ?? 2);
    byId("settingEscalation").checked = Boolean(settings.legalEscalationEnabled);
  }

  function renderAudit() {
    const auditList = byId("auditList");
    const updatedLabel = byId("lastUpdatedAt");
    if (!auditList || !updatedLabel) return;

    const saved = getAuditEntries();
    const fromNotifications = createAuditFromNotifications();
    const merged = [...saved, ...fromNotifications]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20);

    auditList.innerHTML = merged.length
      ? merged
          .map((item) => {
            const tone = item.type === "error" ? "priority-high" : item.type === "warning" ? "priority-medium" : "priority-low";
            return `
              <article class="activity-entry">
                <div class="activity-meta">
                  <span class="pill ${tone}">${item.type.toUpperCase()}</span>
                  <small>${formatTimestamp(item.at)}</small>
                </div>
                <p>${String(item.message).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </article>
            `;
          })
          .join("")
      : '<p class="row-muted">No audit events yet.</p>';

    updatedLabel.textContent = `Last updated: ${new Date().toLocaleString()}`;
  }

  function handleCreateUser(event) {
    event.preventDefault();

    const nameInput = byId("newUserName");
    const emailInput = byId("newUserEmail");
    const roleInput = byId("newUserRole");

    const name = (nameInput.value || "").trim();
    const email = (emailInput.value || "").trim().toLowerCase();
    const role = roleInput.value || "collector";

    if (!name || !email) {
      window.ReclaimNotifications?.warning("Please enter user name and email.");
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      window.ReclaimNotifications?.error("A user with this email already exists.");
      return;
    }

    users.push({
      id: `U-${1000 + users.length + 1}`,
      name,
      email,
      role,
      active: true,
      lastLogin: "Never"
    });

    setUsers(users);
    pushAudit(`User created: ${name} (${email})`, "success");
    window.ReclaimNotifications?.success("User created successfully.");

    event.target.reset();
    renderUsers();
    refreshMetrics();
    renderAudit();
  }

  function handleUsersTableClick(event) {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;
    const users = getUsers();
    const target = users.find((user) => user.id === id);

    if (!target) {
      window.ReclaimNotifications?.error("Selected user was not found.");
      return;
    }

    if (action === "toggle-user") {
      target.active = !target.active;
      setUsers(users);
      pushAudit(`User status changed: ${target.email} is now ${target.active ? "active" : "inactive"}.`, "info");
      window.ReclaimNotifications?.success("User status updated.");
    }

    if (action === "delete-user") {
      if (target.role === "admin") {
        window.ReclaimNotifications?.warning("Cannot delete an admin account.");
        return;
      }

      const updatedUsers = users.filter((user) => user.id !== id);
      setUsers(updatedUsers);
      pushAudit(`User deleted: ${target.email}`, "warning");
      window.ReclaimNotifications?.warning("User removed.");
    }

    renderUsers();
    refreshMetrics();
    renderAudit();
  }

  function handleSaveSettings(event) {
    event.preventDefault();

    const graceDays = Number(byId("settingGraceDays").value || 0);
    const autoReminderDays = Number(byId("settingAutoReminder").value || 0);
    const legalEscalationEnabled = byId("settingEscalation").checked;

    setSettings({
      graceDays,
      autoReminderDays,
      legalEscalationEnabled
    });

    pushAudit("Admin settings updated.", "success");
    window.ReclaimNotifications?.success("System settings saved.");
    renderAudit();
  }

  function handleExportSnapshot() {
    const payload = {
      exportedAt: new Date().toISOString(),
      users: getUsers(),
      settings: getSettings(),
      customers: customers.length,
      installments: installments.length
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reclaim-admin-snapshot-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    pushAudit("Admin data snapshot exported.", "info");
    window.ReclaimNotifications?.info("Snapshot exported as JSON.");
    renderAudit();
  }

  function handleSeedUsers() {
    setUsers(demoUsers.slice());
    pushAudit("User directory reset to demo defaults.", "warning");
    window.ReclaimNotifications?.warning("Users reset to demo defaults.");
    renderUsers();
    refreshMetrics();
    renderAudit();
  }

  function handleClearNotifications() {
    localStorage.setItem(NOTIFICATION_LOG_KEY, "[]");
    window.ReclaimNotifications?.info("Notification center cleared.");
    pushAudit("Notification log cleared by admin.", "info");
    renderAudit();
  }

  function getStaffPerformance() {
    const users = getUsers().filter((user) => isAssignableStaff(user));
    const staffMetrics = users.map((user) => {
      const assigned = customers.filter((cust) => cust.assigned_to === user.id);
      const totalOverdue = assigned.reduce((sum, cust) => sum + (cust.overdueAmount || 0), 0);
      const totalInstallments = installments.filter((inst) => assigned.some((cust) => cust.id === inst.customerId));
      const paidCount = totalInstallments.filter((inst) => inst.status === "paid" || inst.status === "partial").length;
      const collectionRate = totalInstallments.length ? Math.round((paidCount / totalInstallments.length) * 100) : 0;
      const avgDaysPastDue = assigned.length ? Math.round(assigned.reduce((sum, cust) => sum + (cust.daysPastDue || 0), 0) / assigned.length) : 0;
      const totalCollected = totalInstallments.filter((inst) => inst.status === "paid" || inst.status === "partial").reduce((sum, inst) => sum + inst.amount, 0);

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        assignedCount: assigned.length,
        totalOverdue,
        totalCollected,
        collectionRate,
        avgDaysPastDue,
        assignedCustomers: assigned
      };
    });

    return staffMetrics.sort((a, b) => b.totalOverdue - a.totalOverdue);
  }

  function renderStaffPerformance() {
    const body = byId("staffPerformanceBody");
    if (!body) return;

    const staffMetrics = getStaffPerformance();
    if (!staffMetrics.length) {
      body.innerHTML = '<tr><td colspan="7" class="row-muted">No assignable staff found.</td></tr>';
      return;
    }

    body.innerHTML = staffMetrics
      .map((staff) => {
        const rateClass = staff.collectionRate >= 70 ? "status-paid" : staff.collectionRate >= 40 ? "status-partial" : "status-overdue";
        return `
          <tr>
            <td><strong>${staff.name}</strong><br/><small style="color:var(--muted)">${staff.email}</small></td>
            <td><strong>${staff.assignedCount}</strong> customers</td>
            <td>${window.ReclaimUtils.formatCurrency(staff.totalOverdue)}</td>
            <td>${window.ReclaimUtils.formatCurrency(staff.totalCollected)}</td>
            <td><span class="pill ${rateClass}">${staff.collectionRate}%</span></td>
            <td>${staff.avgDaysPastDue} days</td>
            <td>
              <button class="btn-outline" data-action="view-staff-details" data-staff-id="${staff.userId}">View</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function openStaffModal(title, description, detailsText) {
    const modal = byId("actionModal");
    const modalTitle = byId("modalTitle");
    const modalDesc = byId("modalDesc");
    const modalComment = byId("modalComment");
    const modalConfirm = byId("modalConfirmBtn");

    if (!modal || !modalTitle || !modalDesc || !modalComment || !modalConfirm) {
      window.ReclaimNotifications?.info(description);
      return;
    }

    modalTitle.textContent = title;
    modalDesc.textContent = description;
    modalComment.value = detailsText;
    modalConfirm.textContent = "Close";
    modal.classList.add("open");
  }

  function closeStaffModal() {
    const modal = byId("actionModal");
    if (!modal) return;
    modal.classList.remove("open");
  }

  function handleStaffPerformanceClick(event) {
    const button = event.target.closest("button[data-action='view-staff-details']");
    if (!button) return;

    const staffId = button.dataset.staffId;
    const staff = getStaffPerformance().find((entry) => entry.userId === staffId);
    if (!staff) {
      window.ReclaimNotifications?.warning("Staff details are unavailable.");
      return;
    }

    const topCustomers = staff.assignedCustomers
      .slice()
      .sort((a, b) => (b.overdueAmount || 0) - (a.overdueAmount || 0))
      .slice(0, 8)
      .map((customer) => `${customer.name} (${customer.id}) - ${window.ReclaimUtils.formatCurrency(customer.overdueAmount || 0)} overdue`)
      .join("\n");

    const details = [
      `Assigned Customers: ${staff.assignedCount}`,
      `Total Overdue: ${window.ReclaimUtils.formatCurrency(staff.totalOverdue)}`,
      `Collected: ${window.ReclaimUtils.formatCurrency(staff.totalCollected)}`,
      `Collection Rate: ${staff.collectionRate}%`,
      `Average Days Overdue: ${staff.avgDaysPastDue}`,
      "",
      "Top Assigned Customers by Overdue:",
      topCustomers || "No customers assigned"
    ].join("\n");

    openStaffModal(
      `Performance Details - ${staff.name}`,
      "Detailed staff performance and assigned customers.",
      details
    );
  }

  function populateReassignDropdowns() {
    const custSelect = byId("customerToReassign");
    const bulkCustSelect = byId("customersToReassignMany");
    const collectorSelect = byId("newAssignedCollector");

    updateOverdueRangeFilterOptions();

    if (custSelect) {
      const options = customers.map((cust) => `<option value="${cust.id}">${cust.name} (${cust.id})</option>`).join("");
      custSelect.innerHTML = '<option value="">-- Select Customer --</option>' + options;
    }

    if (bulkCustSelect) {
      const filteredCustomers = getBulkFilteredCustomers();
      const options = filteredCustomers
        .map((cust) => `<option value="${cust.id}">${cust.name} (${cust.id}) - ${window.ReclaimUtils.formatCurrency(cust.overdueAmount || 0)}</option>`)
        .join("");
      bulkCustSelect.innerHTML = options || "";
      updateBulkSelectedCount();
    }

    if (collectorSelect) {
      const collectors = getUsers().filter((user) => isAssignableStaff(user));
      const options = collectors.map((collector) => `<option value="${collector.id}">${collector.name}</option>`).join("");
      collectorSelect.innerHTML = '<option value="">-- Assign To Staff --</option>' + options;
    }
  }

  function setAllBulkCustomerSelections(selectAll) {
    const bulkCustSelect = byId("customersToReassignMany");
    const overdueToggle = byId("bulkSelectOverdueToggle");
    if (!bulkCustSelect) return;

    Array.from(bulkCustSelect.options || []).forEach((option) => {
      option.selected = Boolean(selectAll);
    });

    if (overdueToggle && selectAll) {
      overdueToggle.checked = false;
    }

    if (overdueToggle && !selectAll) {
      overdueToggle.checked = false;
    }

    updateBulkSelectedCount();
  }

  function setOverdueBulkSelections(selectOverdueOnly) {
    const bulkCustSelect = byId("customersToReassignMany");
    const selectAllToggle = byId("bulkSelectAllToggle");
    if (!bulkCustSelect) return;

    Array.from(bulkCustSelect.options || []).forEach((option) => {
      const customer = customers.find((cust) => String(cust.id) === String(option.value));
      const isOverdue = Boolean(customer && ((customer.daysPastDue || 0) > 0 || (customer.overdueAmount || 0) > 0));
      option.selected = selectOverdueOnly ? isOverdue : false;
    });

    if (selectAllToggle) {
      selectAllToggle.checked = false;
    }

    updateBulkSelectedCount();
  }

  function syncBulkSelectAllState() {
    const bulkCustSelect = byId("customersToReassignMany");
    const selectAllToggle = byId("bulkSelectAllToggle");
    const overdueToggle = byId("bulkSelectOverdueToggle");
    if (!bulkCustSelect || !selectAllToggle) return;

    const total = bulkCustSelect.options.length;
    const selected = Array.from(bulkCustSelect.selectedOptions || []).length;
    selectAllToggle.checked = total > 0 && selected === total;

    if (overdueToggle) {
      const overdueCount = Array.from(bulkCustSelect.options || []).filter((option) => {
        const customer = customers.find((cust) => String(cust.id) === String(option.value));
        return Boolean(customer && ((customer.daysPastDue || 0) > 0 || (customer.overdueAmount || 0) > 0));
      }).length;
      overdueToggle.checked = overdueCount > 0 && selected === overdueCount && !selectAllToggle.checked;
    }
  }

  function updateBulkSelectedCount() {
    const bulkCustSelect = byId("customersToReassignMany");
    const countLabel = byId("bulkSelectedCount");
    if (!bulkCustSelect || !countLabel) return;

    const selectedCount = Array.from(bulkCustSelect.selectedOptions || []).length;
    countLabel.textContent = `${selectedCount} selected`;
    syncBulkSelectAllState();
  }

  function handleReassignCustomer() {
    const custId = byId("customerToReassign")?.value;
    const newAssigneeId = byId("newAssignedCollector")?.value;

    if (!custId || !newAssigneeId) {
      window.ReclaimNotifications?.warning("Please select both customer and collector.");
      return;
    }

    const customer = customers.find((c) => c.id === custId);
    const oldAssignee = customer ? getUsers().find((u) => u.id === customer.assigned_to) : null;
    const newAssignee = getUsers().find((u) => u.id === newAssigneeId);

    if (!customer || !newAssignee) {
      window.ReclaimNotifications?.error("Customer or collector not found.");
      return;
    }

    customer.assigned_to = newAssigneeId;
    window.ReclaimDataStore?.save?.();

    pushAudit(`Customer reassigned: ${customer.name} from ${oldAssignee?.name || 'Unassigned'} to ${newAssignee.name}.`, "info");
    window.ReclaimNotifications?.success(`${customer.name} reassigned to ${newAssignee.name}.`);

    renderStaffPerformance();
    populateReassignDropdowns();
    byId("customerToReassign").value = "";
    byId("newAssignedCollector").value = "";
    renderAudit();
  }

  function handleBulkReassignCustomers() {
    const bulkCustSelect = byId("customersToReassignMany");
    const newAssigneeId = byId("newAssignedCollector")?.value;

    if (!bulkCustSelect || !newAssigneeId) {
      window.ReclaimNotifications?.warning("Select staff and at least one customer.");
      return;
    }

    const selectedIds = Array.from(bulkCustSelect.selectedOptions || []).map((opt) => opt.value).filter(Boolean);
    if (!selectedIds.length) {
      window.ReclaimNotifications?.warning("Select at least one customer for bulk reassignment.");
      return;
    }

    const newAssignee = getUsers().find((u) => u.id === newAssigneeId);
    if (!newAssignee) {
      window.ReclaimNotifications?.error("Selected staff member was not found.");
      return;
    }

    let changedCount = 0;
    const movedNames = [];

    selectedIds.forEach((customerId) => {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return;

      if (customer.assigned_to !== newAssigneeId) {
        customer.assigned_to = newAssigneeId;
        changedCount += 1;
      }

      movedNames.push(customer.name);
    });

    if (!changedCount) {
      window.ReclaimNotifications?.info("Selected customers are already assigned to this staff member.");
      return;
    }

    window.ReclaimDataStore?.save?.();
    pushAudit(`Bulk reassignment: ${changedCount} customers moved to ${newAssignee.name}.` + (movedNames.length ? ` Customers: ${movedNames.slice(0, 8).join(", ")}${movedNames.length > 8 ? "..." : ""}` : ""), "info");
    window.ReclaimNotifications?.success(`${changedCount} customers reassigned to ${newAssignee.name}.`);

    renderStaffPerformance();
    populateReassignDropdowns();
    byId("customerToReassign").value = "";
    byId("newAssignedCollector").value = "";
    updateBulkSelectedCount();
    renderAudit();
  }

  function handleAutoDistributeAllCustomers() {
    const assignableStaff = getUsers().filter((user) => isAssignableStaff(user) && user.active);
    const staffPool = assignableStaff.length ? assignableStaff : getUsers().filter((user) => isAssignableStaff(user));

    if (!staffPool.length) {
      window.ReclaimNotifications?.warning("No assignable staff available for distribution.");
      return;
    }

    const confirmed = window.confirm(`This will redistribute all ${customers.length} customers across ${staffPool.length} staff members as evenly as possible. Continue?`);
    if (!confirmed) {
      return;
    }

    // Deterministic order keeps distribution stable between runs.
    const sortedCustomers = customers.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
    let changedCount = 0;

    sortedCustomers.forEach((customer, index) => {
      const targetStaff = staffPool[index % staffPool.length];
      if (customer.assigned_to !== targetStaff.id) {
        changedCount += 1;
      }
      customer.assigned_to = targetStaff.id;
    });

    window.ReclaimDataStore?.save?.();
    pushAudit(`Auto distribution completed: ${customers.length} customers distributed across ${staffPool.length} staff. Reassigned: ${changedCount}.`, "info");
    window.ReclaimNotifications?.success(`Auto distribution completed. ${customers.length} customers spread across ${staffPool.length} staff.`);

    renderStaffPerformance();
    populateReassignDropdowns();
    byId("customerToReassign").value = "";
    byId("newAssignedCollector").value = "";
    updateBulkSelectedCount();
    renderAudit();
  }

  function handleResetAllData() {
    const confirmed = window.confirm("This will clear all saved demo data and reload the app. Continue?");
    if (!confirmed) return;

    window.ReclaimDataStore?.clear?.();
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(AUDIT_KEY);
    pushAudit("Full data reset requested.", "error");
    window.location.reload();
  }

  function bindEvents() {
    byId("reassignCustomerBtn")?.addEventListener("click", handleReassignCustomer);
    byId("bulkReassignBtn")?.addEventListener("click", handleBulkReassignCustomers);
    byId("autoDistributeAllBtn")?.addEventListener("click", handleAutoDistributeAllCustomers);
    byId("customersToReassignMany")?.addEventListener("change", updateBulkSelectedCount);
    byId("bulkOverdueRangeFilter")?.addEventListener("change", () => {
      populateReassignDropdowns();
      byId("bulkSelectAllToggle").checked = false;
      byId("bulkSelectOverdueToggle").checked = false;
    });
    byId("bulkSelectAllToggle")?.addEventListener("change", (event) => {
      setAllBulkCustomerSelections(event.target.checked);
    });
    byId("bulkSelectOverdueToggle")?.addEventListener("change", (event) => {
      setOverdueBulkSelections(event.target.checked);
    });
    byId("staffPerformanceBody")?.addEventListener("click", handleStaffPerformanceClick);

    byId("modalCloseBtn")?.addEventListener("click", closeStaffModal);
    byId("modalConfirmBtn")?.addEventListener("click", closeStaffModal);
    byId("actionModal")?.addEventListener("click", (event) => {
      if (event.target?.id === "actionModal") {
        closeStaffModal();
      }
    });

    byId("adminUserSearch")?.addEventListener("input", renderUsers);
    byId("adminRoleFilter")?.addEventListener("change", renderUsers);
    byId("createUserForm")?.addEventListener("submit", handleCreateUser);
    byId("adminUsersBody")?.addEventListener("click", handleUsersTableClick);
    byId("settingsForm")?.addEventListener("submit", handleSaveSettings);

    byId("exportSnapshotBtn")?.addEventListener("click", handleExportSnapshot);
    byId("seedDemoUsersBtn")?.addEventListener("click", handleSeedUsers);
    byId("clearNotificationsBtn")?.addEventListener("click", handleClearNotifications);
    byId("resetDataBtn")?.addEventListener("click", handleResetAllData);
  }

  function init() {
    const role = sessionStorage.getItem("reclaimUserRole") || "collector";
    if (role !== "admin") {
      window.ReclaimNotifications?.warning("Admin access required. Redirecting to dashboard.");
      window.location.replace("index.html");
      return;
    }

    ensureSeedUsers();
    bindEvents();
    renderUsers();
    renderStaffPerformance();
    populateReassignDropdowns();
    renderSettings();
    renderAudit();
    refreshMetrics();
  }

  init();
})();
