/**
 * @namespace Dashboard
 * Presentation controller for the management dashboard in AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Utilizes Utils.gs and Reports.gs for data aggregation.
 */
const Dashboard = (function() {

  // --- Constants ---
  const DASHBOARD_SHEET_NAME = 'Dashboard';
  const REPORTS_SHEET_NAME = 'Reports';
  
  const RANGES = {
    FILTERS: 'DASHBOARD_FILTERS',
    KPI_AREA: 'DASHBOARD_KPI_AREA',
    PENDING_AREA: 'DASHBOARD_PENDING_AREA',
    CHART_SOURCE: 'DASHBOARD_CHART_SOURCE',
    REPORT_FILTERS: 'REPORT_FILTERS'
  };

  // Centralized Report Name Mapping (Matches WorkbookDesign.md exactly)
  const _REPORT_NAMES = {
    PO_SUMMARY: 'PO Summary',
    PO_DETAIL: 'PO Detail (Item-wise)',
    SUPPLIER_PURCHASE: 'Supplier-wise Purchase',
    BIDDER_PURCHASE: 'Bidder-wise Purchase',
    ITEM_PURCHASE: 'Item-wise Purchase',
    ITEM_PENDING_QTY: 'Item Pending Quantity',
    ITEM_SUPPLY_HISTORY: 'Item Supply History',
    PENDING_DELIVERY: 'Pending Delivery',
    PENDING_RECEIPT: 'Pending Receipt',
    PENDING_INSPECTION: 'Pending Inspection',
    RC_REGISTER: 'RC Register',
    RC_EXPIRY: 'RC Expiry',
    RC_PURCHASE: 'RC-wise Purchase'
  };

  // Centralized Widget Navigation Mapping (Matches Section 5.1 Drill-down Widgets)
  const _WIDGET_NAVIGATION_MAP = {
    'Active RC': {
      targetReport: _REPORT_NAMES.RC_REGISTER,
      defaultFilters: { 'Status': 'Active' }
    },
    'RC Expiry': {
      targetReport: _REPORT_NAMES.RC_EXPIRY,
      defaultFilters: {}
    },
    'Pending Delivery': {
      targetReport: _REPORT_NAMES.PENDING_DELIVERY,
      defaultFilters: {}
    },
    'Pending Receipt': {
      targetReport: _REPORT_NAMES.PENDING_RECEIPT,
      defaultFilters: {}
    },
    'Pending Inspection': {
      targetReport: _REPORT_NAMES.PENDING_INSPECTION,
      defaultFilters: {}
    },
    'Supplier Purchase': {
      targetReport: _REPORT_NAMES.SUPPLIER_PURCHASE,
      defaultFilters: {}
    },
    'Item Purchase': {
      targetReport: _REPORT_NAMES.ITEM_PURCHASE,
      defaultFilters: {}
    },
    'Purchase Summary': {
      targetReport: _REPORT_NAMES.PO_SUMMARY,
      defaultFilters: {}
    }
  };

  // --- Private Helper Functions ---

  /**
   * Reads the current filter values from the DASHBOARD_FILTERS named range.
   * @private
   * @returns {Object} Key-value pairs of active filters.
   */
  function _readDashboardFilters() {
    const sheet = Utils.getSheet(DASHBOARD_SHEET_NAME);
    const filterRange = sheet.getRange(RANGES.FILTERS);
    if (!filterRange) return {};

    const data = filterRange.getValues();
    const filters = {};
    
    // Assuming DASHBOARD_FILTERS is a 2-column range: [Filter Name, Filter Value]
    data.forEach(row => {
      const key = String(row[0]).trim();
      const value = row[1];
      if (key && value !== '') {
        filters[key] = value;
      }
    });
    
    return filters;
  }

  /**
   * Calculates PO-related KPIs from the PO Summary report data.
   * @private
   * @param {Object} filters - Active dashboard filters.
   * @returns {Object} Calculated PO KPIs.
   */
  function _calculatePO_KPIs(filters) {
    const kpis = {
      totalPOs: 0,
      pendingPOs: 0,
      partialPOs: 0,
      completedPOs: 0,
      closedPOs: 0,
      totalPOValue: 0
    };

    try {
      const reportData = Reports.getReportData(_REPORT_NAMES.PO_SUMMARY, filters);
      const rows = reportData.rows;
      
      if (rows.length > 0 && rows[0][0] !== 'No data found for the selected filters.') {
        // Assuming PO Summary columns: ['PO No', 'PO Date', 'Bidder', 'Distributor', 'RC No', 'PO Value', 'Status']
        // Note: PO Value was added to PO Summary in WorkbookDesign.md Section 5.2
        const statusIdx = reportData.headers.indexOf('Status');
        const valueIdx = reportData.headers.indexOf('PO Value');

        rows.forEach(row => {
          kpis.totalPOs++;
          
          const status = row[statusIdx];
          if (status === 'Pending') kpis.pendingPOs++;
          else if (status === 'Partial') kpis.partialPOs++;
          else if (status === 'Completed') kpis.completedPOs++;
          else if (status === 'Closed') kpis.closedPOs++;

          if (valueIdx !== -1) {
            kpis.totalPOValue += Number(row[valueIdx]) || 0;
          }
        });
      }
    } catch (e) {
      console.warn("Failed to calculate PO KPIs: " + e.message);
    }

    return kpis;
  }

  /**
   * Calculates Receipt-related KPIs from the Receipt Register report data.
   * @private
   * @param {Object} filters - Active dashboard filters.
   * @returns {Object} Calculated Receipt KPIs.
   */
  function _calculateReceipt_KPIs(filters) {
    const kpis = {
      totalReceiptCount: 0,
      totalReceivedValue: 0
    };

    try {
      const reportData = Reports.getReportData('Receipt Register', filters); // Assuming this report exists per standard pattern
      const rows = reportData.rows;
      
      if (rows.length > 0 && rows[0][0] !== 'No data found for the selected filters.') {
        const valueIdx = reportData.headers.indexOf('Total Value'); // Assuming standard column name
        
        rows.forEach(row => {
          kpis.totalReceiptCount++;
          if (valueIdx !== -1) {
            kpis.totalReceivedValue += Number(row[valueIdx]) || 0;
          }
        });
      }
    } catch (e) {
      console.warn("Failed to calculate Receipt KPIs: " + e.message);
    }

    return kpis;
  }

  /**
   * Calculates Pending Action counts.
   * @private
   * @param {Object} filters - Active dashboard filters.
   * @returns {Object} Calculated Pending Action counts.
   */
  function _calculatePendingActions(filters) {
    const kpis = {
      pendingDelivery: 0,
      pendingReceipt: 0,
      pendingInspection: 0
    };

    try {
      const deliveryData = Reports.getReportData(_REPORT_NAMES.PENDING_DELIVERY, filters);
      if (deliveryData.rows.length > 0 && deliveryData.rows[0][0] !== 'No data found for the selected filters.') {
        kpis.pendingDelivery = deliveryData.rows.length;
      }

      const receiptData = Reports.getReportData(_REPORT_NAMES.PENDING_RECEIPT, filters);
      if (receiptData.rows.length > 0 && receiptData.rows[0][0] !== 'No data found for the selected filters.') {
        kpis.pendingReceipt = receiptData.rows.length;
      }

      const inspectionData = Reports.getReportData(_REPORT_NAMES.PENDING_INSPECTION, filters);
      if (inspectionData.rows.length > 0 && inspectionData.rows[0][0] !== 'No data found for the selected filters.') {
        kpis.pendingInspection = inspectionData.rows.length;
      }
    } catch (e) {
      console.warn("Failed to calculate Pending Actions: " + e.message);
    }

    return kpis;
  }

  /**
   * Calculates RC Expiry alerts.
   * @private
   * @param {Object} filters - Active dashboard filters.
   * @returns {number} Count of RCs expiring within 30 days.
   */
  function _calculateRCExpiryAlerts(filters) {
    let expiryCount = 0;
    try {
      const reportData = Reports.getReportData(_REPORT_NAMES.RC_EXPIRY, filters);
      const rows = reportData.rows;
      
      if (rows.length > 0 && rows[0][0] !== 'No data found for the selected filters.') {
        const endDateIdx = reportData.headers.indexOf('End Date');
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        rows.forEach(row => {
          if (endDateIdx !== -1) {
            const endDate = new Date(row[endDateIdx]);
            if (endDate >= now && endDate <= thirtyDaysFromNow) {
              expiryCount++;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Failed to calculate RC Expiry Alerts: " + e.message);
    }
    return expiryCount;
  }

  /**
   * Prepares aggregated data for dashboard charts.
   * @private
   * @param {Object} filters - Active dashboard filters.
   * @returns {Array<Array>} 2D array formatted for DASHBOARD_CHART_SOURCE.
   */
  function _prepareChartData(filters) {
    // This function aggregates data for charts (e.g., RC-wise purchase, Bidder-wise purchase).
    // It calls the respective reports, extracts the summary data, and formats it into a single 
    // contiguous 2D array that the Google Sheets charts are bound to.
    
    const chartData = [];
    chartData.push(['Category', 'Sub-Category', 'Value']); // Standardized chart source headers

    try {
      // Example: RC-wise Purchase
      const rcData = Reports.getReportData(_REPORT_NAMES.RC_PURCHASE, filters);
      if (rcData.rows.length > 0 && rcData.rows[0][0] !== 'No data found for the selected filters.') {
        const rcNoIdx = rcData.headers.indexOf('RC No');
        const valueIdx = rcData.headers.indexOf('Value'); // Assuming report outputs 'Value'
        
        if (rcNoIdx !== -1 && valueIdx !== -1) {
          rcData.rows.forEach(row => {
            chartData.push(['RC Purchase', row[rcNoIdx], Number(row[valueIdx]) || 0]);
          });
        }
      }

      // Example: Bidder-wise Purchase
      const bidderData = Reports.getReportData(_REPORT_NAMES.BIDDER_PURCHASE, filters);
      if (bidderData.rows.length > 0 && bidderData.rows[0][0] !== 'No data found for the selected filters.') {
        const bidderIdx = bidderData.headers.indexOf('Bidder');
        const valueIdx = bidderData.headers.indexOf('Value');
        
        if (bidderIdx !== -1 && valueIdx !== -1) {
          bidderData.rows.forEach(row => {
            chartData.push(['Bidder Purchase', row[bidderIdx], Number(row[valueIdx]) || 0]);
          });
        }
      }
      
      // Note: Additional chart data (Item-wise, Month-wise) would be appended here 
      // following the exact same pattern, ensuring a single data source range for all charts.

    } catch (e) {
      console.warn("Failed to prepare Chart Data: " + e.message);
    }

    return chartData;
  }

  /**
   * Writes the calculated data to the Dashboard named ranges.
   * @private
   * @param {Object} kpis - Aggregated KPI data.
   * @param {Object} pending - Aggregated Pending Action data.
   * @param {number} rcExpiry - RC Expiry count.
   * @param {Array<Array>} chartData - 2D array for charts.
   */
  function _writeToDashboard(kpis, pending, rcExpiry, chartData) {
    const sheet = Utils.getSheet(DASHBOARD_SHEET_NAME);
    
    // 1. Write KPIs (Assuming DASHBOARD_KPI_AREA is a 2-column range: [KPI Name, Value])
    const kpiRange = sheet.getRange(RANGES.KPI_AREA);
    if (kpiRange) {
      const kpiOutput = [
        ['Total Purchase Orders', kpis.totalPOs],
        ['Pending Purchase Orders', kpis.pendingPOs],
        ['Partially Received Purchase Orders', kpis.partialPOs],
        ['Completed Purchase Orders', kpis.completedPOs],
        ['Closed Purchase Orders', kpis.closedPOs],
        ['Total PO Value', kpis.totalPOValue],
        ['Total Receipt Count', kpis.totalReceiptCount],
        ['Total Received Value', kpis.totalReceivedValue],
        ['RC Expiry Alert Count', rcExpiry]
      ];
      
      // Pad output to match range size if necessary, or clear and set
      kpiRange.clearContent();
      sheet.getRange(kpiRange.getRow(), kpiRange.getColumn(), kpiOutput.length, 2).setValues(kpiOutput);
    }

    // 2. Write Pending Actions
    const pendingRange = sheet.getRange(RANGES.PENDING_AREA);
    if (pendingRange) {
      const pendingOutput = [
        ['Pending Delivery Count', pending.pendingDelivery],
        ['Pending Receipt Count', pending.pendingReceipt],
        ['Pending Inspection Count', pending.pendingInspection]
      ];
      
      pendingRange.clearContent();
      sheet.getRange(pendingRange.getRow(), pendingRange.getColumn(), pendingOutput.length, 2).setValues(pendingOutput);
    }

    // 3. Write Chart Data
    const chartRange = sheet.getRange(RANGES.CHART_SOURCE);
    if (chartRange && chartData.length > 0) {
      chartRange.clearContent();
      sheet.getRange(chartRange.getRow(), chartRange.getColumn(), chartData.length, chartData[0].length).setValues(chartData);
    }
  }

  // --- Public API ---

  return {
    /**
     * Refreshes the Dashboard by reading filters, calculating KPIs, 
     * and updating the dashboard named ranges.
     * 
     * @returns {boolean} True if successful.
     */
    refreshDashboard: function() {
      try {
        const filters = _readDashboardFilters();
        
        // Calculate all metrics in memory by reusing Reports.gs
        const poKPIs = _calculatePO_KPIs(filters);
        const receiptKPIs = _calculateReceipt_KPIs(filters);
        const pendingActions = _calculatePendingActions(filters);
        const rcExpiryCount = _calculateRCExpiryAlerts(filters);
        const chartData = _prepareChartData(filters);

        // Merge PO and Receipt KPIs for the writer function
        const combinedKPIs = { ...poKPIs, ...receiptKPIs };

        // Write to sheet
        _writeToDashboard(combinedKPIs, pendingActions, rcExpiryCount, chartData);
        
        return true;
      } catch (error) {
        console.error("Dashboard Refresh Failed: " + error.message);
        return false;
      }
    },

    /**
     * Handles a click on a dashboard widget.
     * Maps the widget to a target report, applies filters, and activates the Reports sheet.
     * 
     * @param {string} widgetName - The name of the clicked widget (must match _WIDGET_NAVIGATION_MAP).
     * @returns {boolean} True if navigation was successful.
     * @throws {Error} If the widgetName is not recognized.
     */
    handleWidgetClick: function(widgetName) {
      if (!widgetName) throw new Error("widgetName is required.");

      const mapping = _WIDGET_NAVIGATION_MAP[widgetName];
      if (!mapping) {
        throw new Error(`Widget '${widgetName}' is not recognized or has no drill-down mapping.`);
      }

      // 1. Read current Dashboard filters
      const dashboardFilters = _readDashboardFilters();

      // 2. Merge with widget-specific default filters
      const combinedFilters = { ...dashboardFilters, ...mapping.defaultFilters };

      // 3. Write combined filters to the Reports sheet filter area
      const reportsSheet = Utils.getSheet(REPORTS_SHEET_NAME);
      const reportFilterRange = reportsSheet.getRange(RANGES.REPORT_FILTERS);
      
      if (reportFilterRange) {
        reportFilterRange.clearContent();
        
        // Convert filter object back to 2D array [Key, Value]
        const filterArray = Object.keys(combinedFilters).map(key => [key, combinedFilters[key]]);
        
        if (filterArray.length > 0) {
          reportsSheet.getRange(reportFilterRange.getRow(), reportFilterRange.getColumn(), filterArray.length, 2).setValues(filterArray);
        }
      }

      // 4. Generate the target report
      Reports.generateReport(mapping.targetReport, combinedFilters);

      // 5. Activate the Reports sheet to show the user the result
      reportsSheet.activate();

      return true;
    }
  };

})();