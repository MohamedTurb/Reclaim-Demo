(() => {
  const { installments, customers } = window.ReclaimData;
  const { byId, formatCurrency, formatPercent, getCommissionRate } = window.ReclaimUtils;

  let installmentsChart, valueChart, collectionRateChart, commissionChart, staffPerformanceChart;

  const bucketDefinitions = [
    { label: "April 5, 2026", start: "2026-04-05", end: "2026-05-05" },
    { label: "March 5, 2026", start: "2026-03-05", end: "2026-04-04" },
    { label: "February 5, 2026", start: "2026-02-05", end: "2026-03-04" },
    { label: "January 5, 2026 and older", start: null, end: "2026-02-04" }
  ];

  const periodRanges = {
    "2026-04-06_2026-05-05": { label: "April 6, 2026 - May 5, 2026", start: "2026-04-06", end: "2026-05-05" },
    "2026-03-06_2026-04-05": { label: "March 6, 2026 - April 5, 2026", start: "2026-03-06", end: "2026-04-05" },
    "2026-02-06_2026-03-05": { label: "February 6, 2026 - March 5, 2026", start: "2026-02-06", end: "2026-03-05" },
    "2026-01-06_2026-02-05": { label: "January 6, 2026 - February 5, 2026", start: "2026-01-06", end: "2026-02-05" }
  };

  function parseDate(value) {
    return new Date(`${value}T00:00:00`);
  }

  function isWithin(dateValue, startValue, endValue) {
    const date = parseDate(dateValue);
    if (startValue && date < parseDate(startValue)) return false;
    if (endValue && date > parseDate(endValue)) return false;
    return true;
  }

  function getBucketInstallments(bucket) {
    return installments.filter((installment) => {
      if (!isWithin(installment.dueDate, bucket.start, bucket.end)) return false;
      return true;
    });
  }

  function buildBucketRow(bucket) {
    const rows = getBucketInstallments(bucket);
    const installmentsDue = rows.length;
    const installmentsCollected = rows.filter((row) => row.status === "paid" || row.status === "partial").length;
    const installmentsPercent = installmentsDue ? (installmentsCollected / installmentsDue) * 100 : 0;

    const totalValueDue = rows.reduce((sum, row) => sum + row.amount + row.lateFee, 0);
    const totalValueCollected = rows.reduce((sum, row) => {
      const share = window.ReclaimUtils.getInstallmentCollectionShare(row);
      return sum + (row.amount + row.lateFee) * share;
    }, 0);
    const valuePercent = totalValueDue ? (totalValueCollected / totalValueDue) * 100 : 0;

    const daysPastDue = rows.length ? Math.max(...rows.map((row) => row.lateDays || 0)) : 0;
    const commissionRate = getCommissionRate(valuePercent, daysPastDue);
    const compensation = totalValueCollected * (commissionRate / 100);

    return {
      label: bucket.label,
      installmentsDue,
      installmentsCollected,
      installmentsPercent,
      totalValueDue,
      totalValueCollected,
      valuePercent,
      commissionRate,
      compensation
    };
  }

  function isAssignableRole(role) {
    return role === "collector" || role === "manager";
  }

  function getUsersDirectory() {
    try {
      const parsed = JSON.parse(localStorage.getItem("reclaim.users.v1") || "[]");
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch (_) {
      // Ignore and fallback to assignment-derived users.
    }

    const assignedIds = Array.from(new Set((customers || []).map((customer) => customer.assigned_to).filter(Boolean)));
    return assignedIds.map((id) => ({ id, name: id, role: "collector", active: true }));
  }

  function getStaffAnalyticsRows(selectedPeriod) {
    const users = getUsersDirectory().filter((user) => isAssignableRole(user.role));

    return users
      .map((user) => {
        const assignedCustomers = (customers || []).filter((customer) => customer.assigned_to === user.id);
        const customerIds = new Set(assignedCustomers.map((customer) => customer.id));

        const staffInstallments = (installments || []).filter((installment) => {
          if (!customerIds.has(installment.customerId)) return false;
          return isWithin(installment.dueDate, selectedPeriod.start, selectedPeriod.end);
        });

        const totalDue = staffInstallments.reduce((sum, installment) => sum + (installment.amount || 0) + (installment.lateFee || 0), 0);
        const totalCollected = staffInstallments.reduce((sum, installment) => {
          const share = window.ReclaimUtils.getInstallmentCollectionShare(installment);
          return sum + ((installment.amount || 0) + (installment.lateFee || 0)) * share;
        }, 0);
        const collectionRate = totalDue ? (totalCollected / totalDue) * 100 : 0;
        const overdueLoad = assignedCustomers.reduce((sum, customer) => sum + (customer.overdueAmount || 0), 0);

        return {
          id: user.id,
          name: user.name || user.id,
          assignedCount: assignedCustomers.length,
          overdueLoad,
          totalDue,
          totalCollected,
          collectionRate
        };
      })
      .filter((row) => row.assignedCount > 0)
      .sort((a, b) => b.overdueLoad - a.overdueLoad);
  }

  function renderStaffAnalyticsChart(selectedPeriod) {
    const chartCanvas = byId("staffPerformanceChart");
    const noteEl = byId("staffAnalyticsNote");
    const periodEl = byId("staffAnalyticsPeriodLabel");
    if (!chartCanvas || typeof Chart === "undefined") return;

    if (periodEl) {
      periodEl.textContent = `Period: ${selectedPeriod.label}`;
    }

    const rows = getStaffAnalyticsRows(selectedPeriod);
    if (!rows.length) {
      if (noteEl) {
        noteEl.textContent = "No assigned staff data is available for the selected period.";
      }

      if (staffPerformanceChart) {
        staffPerformanceChart.destroy();
        staffPerformanceChart = null;
      }
      return;
    }

    if (noteEl) {
      noteEl.textContent = "Overdue load and collection rate per staff member for the selected period.";
    }

    const labels = rows.map((row) => row.name);
    const overdueLoads = rows.map((row) => row.overdueLoad);
    const collectionRates = rows.map((row) => Number(row.collectionRate.toFixed(1)));

    if (staffPerformanceChart) staffPerformanceChart.destroy();
    const ctx = chartCanvas.getContext("2d");
    staffPerformanceChart = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Overdue Load (EGP)",
            data: overdueLoads,
            backgroundColor: "rgba(239, 68, 68, 0.7)",
            borderColor: "#ef4444",
            borderWidth: 1,
            yAxisID: "y"
          },
          {
            type: "line",
            label: "Collection Rate %",
            data: collectionRates,
            borderColor: "#0f766e",
            backgroundColor: "rgba(15, 118, 110, 0.15)",
            tension: 0.35,
            fill: false,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label(context) {
                if (context.dataset.yAxisID === "y") {
                  return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                }
                return `${context.dataset.label}: ${context.raw}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: "left"
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: "right",
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  function initializeCharts(bucketRows) {
    const labels = bucketRows.map((row) => row.label);
    const dueCounts = bucketRows.map((row) => row.installmentsDue);
    const collectedCounts = bucketRows.map((row) => row.installmentsCollected);
    const dueValues = bucketRows.map((row) => row.totalValueDue);
    const collectedValues = bucketRows.map((row) => row.totalValueCollected);
    const collectionPercents = bucketRows.map((row) => row.valuePercent);
    const commissions = bucketRows.map((row) => row.compensation);

    // Installments Chart
    if (installmentsChart) installmentsChart.destroy();
    const ctxInst = byId("installmentsChart").getContext("2d");
    installmentsChart = new Chart(ctxInst, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Due",
            data: dueCounts,
            backgroundColor: "#ef4444",
            borderRadius: 4
          },
          {
            label: "Collected",
            data: collectedCounts,
            backgroundColor: "#10b981",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Value Chart
    if (valueChart) valueChart.destroy();
    const ctxVal = byId("valueChart").getContext("2d");
    valueChart = new Chart(ctxVal, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Due (EGP)",
            data: dueValues,
            backgroundColor: "#f59e0b",
            borderRadius: 4
          },
          {
            label: "Collected (EGP)",
            data: collectedValues,
            backgroundColor: "#0f766e",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // Collection Rate Chart (Line)
    if (collectionRateChart) collectionRateChart.destroy();
    const ctxRate = byId("collectionRateChart").getContext("2d");
    collectionRateChart = new Chart(ctxRate, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Collection Rate %",
            data: collectionPercents,
            borderColor: "#0284c7",
            backgroundColor: "rgba(2, 132, 199, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    // Commission Chart (Doughnut)
    if (commissionChart) commissionChart.destroy();
    const ctxComm = byId("commissionChart").getContext("2d");
    commissionChart = new Chart(ctxComm, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: commissions,
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  function renderAnalysis() {
    const selector = byId("collectionPeriodSelector");
    const selectedPeriod = periodRanges[selector.value] || periodRanges[Object.keys(periodRanges)[0]];
    const search = byId("analysisSearch").value.trim().toLowerCase();
    const sortBy = byId("analysisSort").value;

    const bucketRows = bucketDefinitions
      .map(buildBucketRow)
      .filter((row) => !search || row.label.toLowerCase().includes(search));

    bucketRows.sort((a, b) => {
      switch (sortBy) {
        case "installmentsDue":
          return b.installmentsDue - a.installmentsDue;
        case "valueCollected":
          return b.totalValueCollected - a.totalValueCollected;
        case "commission":
          return b.compensation - a.compensation;
        default:
          return a.label.localeCompare(b.label);
      }
    });

    if (!bucketRows.length) {
      byId("analysisBody").innerHTML = '<tr><td colspan="8" class="row-muted">No buckets match the current search.</td></tr>';
      byId("analysisFoot").innerHTML = "";
      byId("analysisHeading").textContent = `Collection Period | ${selectedPeriod.label}`;
      return;
    }

    const totalDue = bucketRows.reduce((sum, row) => sum + row.installmentsDue, 0);
    const totalCollected = bucketRows.reduce((sum, row) => sum + row.installmentsCollected, 0);
    const totalValueDue = bucketRows.reduce((sum, row) => sum + row.totalValueDue, 0);
    const totalValueCollected = bucketRows.reduce((sum, row) => sum + row.totalValueCollected, 0);
    const totalCompensation = bucketRows.reduce((sum, row) => sum + row.compensation, 0);
    const totalInstallmentPercent = totalDue ? (totalCollected / totalDue) * 100 : 0;
    const totalValuePercent = totalValueDue ? (totalValueCollected / totalValueDue) * 100 : 0;

    byId("analysisBody").innerHTML = bucketRows
      .map((row) => `
        <tr>
          <td><strong>${row.label}</strong></td>
          <td>${row.installmentsDue}</td>
          <td>${row.installmentsCollected}</td>
          <td>${formatPercent(row.installmentsPercent)}</td>
          <td>${formatCurrency(row.totalValueDue)}</td>
          <td>${formatCurrency(row.totalValueCollected)}</td>
          <td>${formatPercent(row.valuePercent)}</td>
          <td class="compensation-cell">${formatCurrency(row.compensation)}</td>
        </tr>
      `)
      .join("");

    byId("analysisFoot").innerHTML = `
      <tr class="analysis-total-row">
        <td><strong>Total</strong></td>
        <td><strong>${totalDue}</strong></td>
        <td><strong>${totalCollected}</strong></td>
        <td><strong>${formatPercent(totalInstallmentPercent)}</strong></td>
        <td><strong>${formatCurrency(totalValueDue)}</strong></td>
        <td><strong>${formatCurrency(totalValueCollected)}</strong></td>
        <td><strong>${formatPercent(totalValuePercent)}</strong></td>
        <td><strong class="compensation-cell">${formatCurrency(totalCompensation)}</strong></td>
      </tr>
    `;

    byId("analysisHeading").textContent = `Collection Period | ${selectedPeriod.label}`;
    
    // Initialize charts with data
    initializeCharts(bucketRows);
    renderStaffAnalyticsChart(selectedPeriod);
  }

  byId("collectionPeriodSelector").addEventListener("change", renderAnalysis);
  byId("analysisSearch").addEventListener("input", renderAnalysis);
  byId("analysisSort").addEventListener("change", renderAnalysis);

  renderAnalysis();
})();
