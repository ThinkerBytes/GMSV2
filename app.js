/**
 * GreenMetrica - Streamlined Carbon Footprint Calculator & Geospatial Tracker
 */

const STORAGE_KEY = 'greenmetrica_entries_v7';
const DEFAULT_CENTER = [10.9069, 76.4094];

class GreenMetricaApp {
  constructor() {
    this.entries = [];
    this.filteredEntries = [];
    this.currentEditingId = null;
    this.pendingExcelRows = null;

    // Map & Charts
    this.map = null;
    this.markersLayer = null;
    this.categoryChart = null;
    this.cohortChart = null;
  }

  init() {
    this.loadData();
    this.initMap();
    this.bindEvents();
    this.updateDashboard();
    this.renderCharts();
    this.renderTable();
  }

  /* ================= LOCAL STORAGE & CACHE ================= */
  loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const raw = JSON.parse(stored);
        if (Array.isArray(raw) && raw.length > 0) {
          this.entries = raw.map(item => {
            const calc = calculateEmissionBreakdown(item);
            return { ...item, ...calc };
          });
          this.filteredEntries = [...this.entries];
          return;
        }
      } catch (e) {}
    }

    // Initialize with verified 25 student records centered around (10.9069, 76.4094)
    this.seedInitialData();
  }

  seedInitialData() {
    this.entries = INITIAL_STUDENT_DATA.map(item => {
      const calc = calculateEmissionBreakdown(item);
      return { ...item, ...calc };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    this.filteredEntries = [...this.entries];
  }

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    this.filteredEntries = [...this.entries];
    this.updateDashboard();
    this.renderMapMarkers();
    this.renderCharts();
    this.renderTable();
  }

  /* ================= EXCEL TEMPLATE & EXPORT ================= */
  downloadExcelTemplate() {
    if (typeof XLSX === 'undefined') {
      alert('Excel library is loading, please try again in a moment.');
      return;
    }

    // Build template using the 25 student records
    const templateRows = INITIAL_STUDENT_DATA.map((s, idx) => ({
      'SL No': idx + 1,
      'Name': s.name,
      'Class': s.class,
      'Latitude': s.lat,
      'Longitude': s.lng,
      'Electricity (kWh)': s.electricity,
      'Solar': s.solar ? 'Yes' : 'No',
      'Car Fuel (Liters)': s.car || s.carLiters || 0,
      'Car Fuel Type': (s.carFuelType || 'Petrol').toUpperCase(),
      'Bike Fuel (Liters)': s.bike || s.bikeLiters || 0,
      'LPG (kg)': s.lpg || 0,
      'Meat (kg)': s.meat || 0,
      'Dairy (kg)': s.dairy || 0,
      'Solid Waste (kg)': s.waste || 0,
      'Recycling (kg)': s.recycling || 0
    }));

    const ws = XLSX.utils.json_to_sheet(templateRows);

    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 8 },  // SL No
      { wch: 24 }, // Name
      { wch: 10 }, // Class
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 18 }, // Electricity
      { wch: 8 },  // Solar
      { wch: 16 }, // Car Fuel
      { wch: 14 }, // Car Fuel Type
      { wch: 16 }, // Bike Fuel
      { wch: 10 }, // LPG
      { wch: 10 }, // Meat
      { wch: 10 }, // Dairy
      { wch: 16 }, // Solid Waste
      { wch: 14 }  // Recycling
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Template');
    XLSX.writeFile(wb, 'GreenMetrica_Student_Template.xlsx');
    this.showToast('Downloaded sample Excel template.');
  }

  exportExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Excel library is loading, please try again in a moment.');
      return;
    }
    if (this.entries.length === 0) {
      this.showToast('No entries to export.');
      return;
    }

    const exportRows = this.entries.map((s, idx) => {
      const calc = s.breakdown ? s : calculateEmissionBreakdown(s);
      return {
        'SL No': idx + 1,
        'Name': s.name,
        'Class': s.class,
        'Latitude': parseFloat(s.lat) || DEFAULT_CENTER[0],
        'Longitude': parseFloat(s.lng) || DEFAULT_CENTER[1],
        'Electricity (kWh)': s.electricity || 0,
        'Solar': s.solar || s.isSolar ? 'Yes' : 'No',
        'Car Fuel (Liters)': s.carLiters || s.car || 0,
        'Car Fuel Type': (s.carFuelType || 'Petrol').toUpperCase(),
        'Bike Fuel (Liters)': s.bikeLiters || s.bike || 0,
        'LPG (kg)': s.lpg || 0,
        'Meat (kg)': s.meat || 0,
        'Dairy (kg)': s.dairy || 0,
        'Solid Waste (kg)': s.waste || 0,
        'Recycling (kg)': s.recycling || 0,

        // Calculated Emission Results
        'Total Footprint (kg CO2e)': parseFloat(calc.totalEmission.toFixed(2)),
        'Emission Tier': calc.tierLabel || (calc.totalEmission < 350 ? 'Low' : calc.totalEmission > 600 ? 'High' : 'Moderate'),
        'Electricity Emission (kg CO2e)': calc.breakdown.electricity,
        'Car Emission (kg CO2e)': calc.breakdown.car,
        'Bike Emission (kg CO2e)': calc.breakdown.bike,
        'LPG Emission (kg CO2e)': calc.breakdown.lpg,
        'Meat Emission (kg CO2e)': calc.breakdown.meat,
        'Dairy Emission (kg CO2e)': calc.breakdown.dairy,
        'Waste Emission (kg CO2e)': calc.breakdown.waste,
        'Recycling Offset (kg CO2e)': calc.breakdown.recycling
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = [
      { wch: 8 },  // SL No
      { wch: 24 }, // Name
      { wch: 10 }, // Class
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 18 }, // Electricity
      { wch: 8 },  // Solar
      { wch: 16 }, // Car Fuel
      { wch: 14 }, // Car Fuel Type
      { wch: 16 }, // Bike Fuel
      { wch: 10 }, // LPG
      { wch: 10 }, // Meat
      { wch: 10 }, // Dairy
      { wch: 16 }, // Solid Waste
      { wch: 14 }, // Recycling
      { wch: 26 }, // Total Footprint
      { wch: 14 }, // Tier
      { wch: 26 }, // Electricity Emission
      { wch: 22 }, // Car Emission
      { wch: 22 }, // Bike Emission
      { wch: 22 }, // LPG Emission
      { wch: 22 }, // Meat Emission
      { wch: 22 }, // Dairy Emission
      { wch: 24 }, // Waste Emission
      { wch: 24 }  // Recycling Offset
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emissions Summary');
    const filename = `GreenMetrica_Emissions_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    this.showToast(`Exported ${this.entries.length} student records to Excel.`);
  }

  /* ================= EXCEL IMPORT MODAL & HANDLER ================= */
  openImportExcelModal() {
    const modal = document.getElementById('excelImportModal');
    if (modal) {
      modal.classList.remove('hidden');
      const fileInput = document.getElementById('excelFileInput');
      if (fileInput) fileInput.value = '';
      const preview = document.getElementById('excelFilePreview');
      if (preview) preview.classList.add('hidden');
      const btn = document.getElementById('btnConfirmExcelImport');
      if (btn) btn.disabled = true;
    }
  }

  closeImportExcelModal() {
    const modal = document.getElementById('excelImportModal');
    if (modal) modal.classList.add('hidden');
    this.pendingExcelRows = null;
  }

  handleExcelFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      alert('Excel library is loading, please try again.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
          alert('Uploaded Excel sheet is empty. Please check the file.');
          return;
        }

        this.pendingExcelRows = rows;

        // Show file preview
        const preview = document.getElementById('excelFilePreview');
        const filenameEl = document.getElementById('excelPreviewFilename');
        const rowCountEl = document.getElementById('excelPreviewRowCount');
        const btn = document.getElementById('btnConfirmExcelImport');

        if (preview && filenameEl && rowCountEl) {
          filenameEl.textContent = file.name;
          rowCountEl.textContent = `${rows.length} student rows detected`;
          preview.classList.remove('hidden');
        }
        if (btn) btn.disabled = false;
      } catch (err) {
        alert('Could not parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  confirmExcelImport() {
    if (!this.pendingExcelRows || this.pendingExcelRows.length === 0) {
      alert('Please select a valid Excel file first.');
      return;
    }

    const imported = [];
    this.pendingExcelRows.forEach((row, idx) => {
      // Find row keys flexibly
      const getVal = (...keys) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== '') return row[k];
          for (const actualKey of Object.keys(row)) {
            if (actualKey.trim().toLowerCase() === k.trim().toLowerCase() && row[actualKey] !== '') {
              return row[actualKey];
            }
          }
        }
        return '';
      };

      const name = getVal('Name', 'Student Name', 'Student', 'NAME') || `Student ${idx + 1}`;
      const cls = getVal('Class', 'Grade', 'CLASS') || 'General';

      // Parse coordinates or assign organic random scatter around (10.9069, 76.4094)
      let lat = parseFloat(getVal('Latitude', 'Lat', 'LATITUDE', 'lat'));
      let lng = parseFloat(getVal('Longitude', 'Lng', 'Long', 'LONGITUDE', 'lng'));
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        const rAng = Math.random() * Math.PI * 2;
        const rDist = 0.4 + Math.random() * 2.2;
        lat = parseFloat((DEFAULT_CENTER[0] + (rDist * Math.cos(rAng)) / 111.0).toFixed(4));
        lng = parseFloat((DEFAULT_CENTER[1] + (rDist * Math.sin(rAng)) / (111.0 * Math.cos(DEFAULT_CENTER[0] * Math.PI / 180))).toFixed(4));
      }

      const elec = parseFloat(getVal('Electricity (kWh)', 'Electricity', 'ELECTRICITY', 'Elec (kWh)')) || 0;
      const solarVal = String(getVal('Solar', 'SOLAR', 'Is Solar')).toLowerCase();
      const isSolar = solarVal === 'yes' || solarVal === 'true' || solarVal === '1';

      const car = parseFloat(getVal('Car Fuel (Liters)', 'Car', 'Car (Ltrs)', 'Car Fuel')) || 0;
      const carFuelType = String(getVal('Car Fuel Type', 'Fuel Type', 'Fuel', 'Car Type')).toLowerCase().includes('diesel') ? 'diesel' : 'petrol';

      const bike = parseFloat(getVal('Bike Fuel (Liters)', 'Bike', 'Bike (Ltrs)', 'Bike Fuel')) || 0;
      const lpg = parseFloat(getVal('LPG (kg)', 'LPG', 'LPG (KG)')) || 0;
      const meat = parseFloat(getVal('Meat (kg)', 'Meat', 'MEAT')) || 0;
      const dairy = parseFloat(getVal('Dairy (kg)', 'Dairy', 'DAIRY')) || 0;
      const waste = parseFloat(getVal('Solid Waste (kg)', 'Waste (kg)', 'Waste', 'WASTE')) || 0;
      const recycling = parseFloat(getVal('Recycling (kg)', 'Recycling', 'RECYCLING')) || 0;
      const otherFood = parseFloat(getVal('Other Food (kg)', 'Other Food')) || 0;

      const rawItem = {
        id: 'gm-xl-' + Date.now() + '-' + idx,
        no: idx + 1,
        name: String(name).trim(),
        class: String(cls).trim(),
        lat: lat,
        lng: lng,
        electricity: elec,
        solar: isSolar,
        car: car,
        carLiters: car,
        carFuelType: carFuelType,
        bike: bike,
        bikeLiters: bike,
        lpg: lpg,
        meat: meat,
        dairy: dairy,
        waste: waste,
        recycling: recycling,
        otherFood: otherFood
      };

      const calc = calculateEmissionBreakdown(rawItem);
      imported.push({ ...rawItem, ...calc });
    });

    if (imported.length === 0) {
      alert('Could not extract any student records from the Excel file.');
      return;
    }

    this.entries = imported;
    this.saveData();
    this.closeImportExcelModal();
    if (this.map) {
      this.renderMapMarkers(true);
    }
    this.showToast(`Successfully imported & plotted ${imported.length} student records!`);
  }

  /* ================= JSON EXPORT & IMPORT (FOR ADMIN) ================= */
  exportJSON() {
    if (this.entries.length === 0) {
      this.showToast('No entries to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `greenmetrica_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Exported complete JSON database.');
  }

  // Alias for backward compatibility
  exportData() {
    this.exportJSON();
  }

  handleImportJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          alert('Invalid file format. Please upload a JSON array of entries.');
          return;
        }

        this.entries = imported.map((item, idx) => {
          const calc = calculateEmissionBreakdown(item);
          return {
            id: item.id || 'gm-' + Date.now() + '-' + idx,
            name: item.name || 'Student',
            class: item.class || 'N/A',
            lat: parseFloat(item.lat) || DEFAULT_CENTER[0],
            lng: parseFloat(item.lng) || DEFAULT_CENTER[1],
            electricity: parseFloat(item.electricity) || 0,
            solar: Boolean(item.solar),
            car: parseFloat(item.car) || parseFloat(item.carLiters) || 0,
            carLiters: parseFloat(item.carLiters) || parseFloat(item.car) || 0,
            carDistance: parseFloat(item.carDistance) || 0,
            carMileage: parseFloat(item.carMileage) || 0,
            carFuelType: item.carFuelType || 'petrol',
            bike: parseFloat(item.bike) || parseFloat(item.bikeLiters) || 0,
            bikeLiters: parseFloat(item.bikeLiters) || parseFloat(item.bike) || 0,
            bikeDistance: parseFloat(item.bikeDistance) || 0,
            bikeMileage: parseFloat(item.bikeMileage) || 0,
            meat: parseFloat(item.meat) || 0,
            dairy: parseFloat(item.dairy) || 0,
            lpg: parseFloat(item.lpg) || 0,
            otherFood: parseFloat(item.otherFood) || 0,
            waste: parseFloat(item.waste) || 0,
            recycling: parseFloat(item.recycling) || 0,
            ...calc
          };
        });

        this.saveData();
        this.showToast(`Imported ${this.entries.length} entries from JSON!`);
      } catch (err) {
        alert('Could not read JSON file: ' + err.message);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  // Alias
  handleImportFile(event) {
    this.handleImportJSON(event);
  }

  resetToDefaultData() {
    if (confirm('Reset database to the 25 default verified student records?')) {
      this.seedInitialData();
      this.updateDashboard();
      this.renderMapMarkers(true);
      this.renderCharts();
      this.renderTable();
      this.showToast('Database reset to 25 default records.');
    }
  }

  clearAllData() {
    if (confirm('Are you sure you want to delete ALL records? This cannot be undone.')) {
      this.entries = [];
      this.saveData();
      this.showToast('All records cleared.');
    }
  }

  /* ================= FREE OPENSTREETMAP LEAFLET MAP ================= */
  initMap() {
    const mapEl = document.getElementById('mapContainer');
    if (!mapEl) return;

    // Centered on the student community cluster (Lat: 10.9069, Lng: 76.4094)
    this.map = L.map('mapContainer', {
      center: DEFAULT_CENTER,
      zoom: 14,
      zoomControl: true
    });

    // 100% Free OpenStreetMap tilelayer with zero API keys required
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.renderMapMarkers(true);
  }

  renderMapMarkers(shouldFitBounds = false) {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const bounds = [];
    const mapCountEl = document.getElementById('mapActiveCount');
    if (mapCountEl) {
      mapCountEl.textContent = `${this.entries.length} active student markers plotted`;
    }

    this.entries.forEach(entry => {
      const lat = parseFloat(entry.lat);
      const lng = parseFloat(entry.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      const color = entry.tier === 'eco-hero' ? '#10b981' : (entry.tier === 'high' ? '#f43f5e' : '#f59e0b');

      // Strict pixel-anchored custom pulse marker (iconAnchor at exact center [14, 14])
      const customIcon = L.divIcon({
        className: '',
        html: `
          <div class="map-pulse-marker">
            <div class="marker-ring" style="color: ${color}"></div>
            <div class="marker-dot" style="background-color: ${color}; color: ${color}"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Clean, minimal popup showing only name, class, and emission data
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px 6px; text-align: center; color: #0f172a; min-width: 130px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${entry.name}</div>
          <div style="font-size: 11px; font-weight: 600; color: #059669; margin-bottom: 6px;">Class ${entry.class}</div>
          <div style="font-weight: 800; font-size: 16px; color: ${color}; font-family: monospace;">
            ${entry.totalEmission.toFixed(1)} <span style="font-size: 11px; font-weight: normal; color: #64748b;">kg CO₂e</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.entryData = entry;
      this.markersLayer.addLayer(marker);
    });

    if (shouldFitBounds && bounds.length > 0) {
      try {
        this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch (e) {}
    }
  }

  focusEntry(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry || !this.map) return;

    this.map.flyTo([entry.lat, entry.lng], 15, { duration: 1.0 });
    document.getElementById('mapContainer').scrollIntoView({ behavior: 'smooth', block: 'center' });

    this.markersLayer.eachLayer(layer => {
      if (layer.entryData && layer.entryData.id === id) {
        layer.openPopup();
      }
    });
  }

  /* ================= TOP 3 DASHBOARD METRICS ================= */
  updateDashboard() {
    const totalEl = document.getElementById('metricTotal');
    const totalSubEl = document.getElementById('metricTotalSub');
    const causeEl = document.getElementById('metricCause');
    const causeBadgeEl = document.getElementById('metricCauseBadge');
    const causeSubEl = document.getElementById('metricCauseSub');
    const avgEl = document.getElementById('metricAverage');
    const avgBadgeEl = document.getElementById('metricAvgBadge');
    const avgSubEl = document.getElementById('metricAverageSub');

    if (!totalEl) return;

    if (this.entries.length === 0) {
      totalEl.textContent = '0.0';
      if (totalSubEl) totalSubEl.textContent = '0 reported entries';
      if (causeEl) causeEl.textContent = 'None';
      if (causeBadgeEl) causeBadgeEl.textContent = '0%';
      if (causeSubEl) causeSubEl.textContent = 'No emissions recorded';
      if (avgEl) avgEl.textContent = '0.0';
      if (avgBadgeEl) avgBadgeEl.textContent = '0%';
      if (avgSubEl) avgSubEl.textContent = 'No data available';
      return;
    }

    let netEmissions = 0;
    let grossEmissions = 0;
    const catSums = {
      'Electricity': 0,
      'Car Travel': 0,
      'Bike Travel': 0,
      'Meat Diet': 0,
      'Dairy': 0,
      'LPG Gas': 0,
      'Other Food': 0,
      'Solid Waste': 0
    };

    this.entries.forEach(e => {
      netEmissions += e.totalEmission || 0;
      if (e.breakdown) {
        catSums['Electricity'] += e.breakdown.electricity || 0;
        catSums['Car Travel'] += e.breakdown.car || 0;
        catSums['Bike Travel'] += e.breakdown.bike || 0;
        catSums['Meat Diet'] += e.breakdown.meat || 0;
        catSums['Dairy'] += e.breakdown.dairy || 0;
        catSums['LPG Gas'] += e.breakdown.lpg || 0;
        catSums['Other Food'] += e.breakdown.otherFood || 0;
        catSums['Solid Waste'] += e.breakdown.waste || 0;
      }
    });

    grossEmissions = Object.values(catSums).reduce((a, b) => a + b, 0);

    const count = this.entries.length;
    const avg = netEmissions / count;

    // Sort categories descending
    const sortedCats = Object.keys(catSums)
      .map(k => ({ name: k, val: catSums[k] }))
      .sort((a, b) => b.val - a.val);

    const topCause = sortedCats[0];
    const topCausePct = grossEmissions > 0 ? ((topCause.val / grossEmissions) * 100).toFixed(1) : '0';

    // Card 1: Total Footprint
    totalEl.textContent = netEmissions.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (totalSubEl) {
      totalSubEl.textContent = `Across ${count} student records (${(netEmissions / 1000).toFixed(2)} tonnes)`;
    }

    // Card 2: Primary Emission Cause
    if (causeEl) causeEl.textContent = topCause.name;
    if (causeBadgeEl) causeBadgeEl.textContent = `${topCausePct}%`;
    if (causeSubEl) {
      causeSubEl.textContent = `${topCause.val.toLocaleString('en-US', { maximumFractionDigits: 0 })} kg CO₂e from ${topCause.name.toLowerCase()}`;
    }

    // Card 3: Average per Person
    if (avgEl) avgEl.textContent = avg.toFixed(1);
    const benchmark = 315.0; // India national monthly average per person
    const diffPct = (((avg - benchmark) / benchmark) * 100).toFixed(1);
    if (avgBadgeEl) {
      if (avg > benchmark) {
        avgBadgeEl.textContent = `+${diffPct}%`;
        avgBadgeEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800';
      } else {
        avgBadgeEl.textContent = `${diffPct}%`;
        avgBadgeEl.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800';
      }
    }
    if (avgSubEl) {
      avgSubEl.textContent = `vs India monthly avg (315 kg CO₂e)`;
    }
  }

  /* ================= CHARTS ================= */
  renderCharts() {
    // 1. Category Donut Chart
    const catCtx = document.getElementById('categoryChart');
    if (catCtx) {
      const catTotals = {
        'Electricity': 0,
        'Car Fuel': 0,
        'Bike Fuel': 0,
        'Meat Diet': 0,
        'Dairy': 0,
        'LPG Gas': 0,
        'Other Food': 0,
        'Waste': 0
      };

      this.entries.forEach(e => {
        if (e.breakdown) {
          catTotals['Electricity'] += e.breakdown.electricity || 0;
          catTotals['Car Fuel'] += e.breakdown.car || 0;
          catTotals['Bike Fuel'] += e.breakdown.bike || 0;
          catTotals['Meat Diet'] += e.breakdown.meat || 0;
          catTotals['Dairy'] += e.breakdown.dairy || 0;
          catTotals['LPG Gas'] += e.breakdown.lpg || 0;
          catTotals['Other Food'] += e.breakdown.otherFood || 0;
          catTotals['Waste'] += e.breakdown.waste || 0;
        }
      });

      if (this.categoryChart) this.categoryChart.destroy();
      this.categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(catTotals),
          datasets: [{
            data: Object.values(catTotals).map(v => parseFloat(v.toFixed(1))),
            backgroundColor: [
              '#0284c7', '#f59e0b', '#10b981', '#f43f5e',
              '#8b5cf6', '#ea580c', '#84cc16', '#64748b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#334155', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 10 }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` ${context.label}: ${context.raw} kg CO₂e`;
                }
              }
            }
          }
        }
      });
    }

    // 2. Cohort Chart (Class)
    const cohortCtx = document.getElementById('cohortChart');
    if (cohortCtx) {
      const cohortMap = {
        'Class IX': { total: 0, count: 0 },
        'Class X': { total: 0, count: 0 },
        'Class XI': { total: 0, count: 0 },
        'Class XII': { total: 0, count: 0 }
      };

      this.entries.forEach(e => {
        const cls = (e.class || '').toUpperCase();
        let key = 'Class X';
        if (cls.includes('IX')) key = 'Class IX';
        else if (cls.includes('XII')) key = 'Class XII';
        else if (cls.includes('XI')) key = 'Class XI';

        cohortMap[key].total += e.totalEmission || 0;
        cohortMap[key].count += 1;
      });

      const labels = Object.keys(cohortMap);
      const avgs = labels.map(k => cohortMap[k].count ? parseFloat((cohortMap[k].total / cohortMap[k].count).toFixed(1)) : 0);

      if (this.cohortChart) this.cohortChart.destroy();
      this.cohortChart = new Chart(cohortCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Avg kg CO₂e / Student',
            data: avgs,
            backgroundColor: '#0284c7',
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b', font: { size: 11, family: 'Inter' } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#334155', font: { weight: '600', family: 'Inter' } }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` Avg: ${context.raw} kg CO₂e/student`;
                }
              }
            }
          }
        }
      });
    }
  }

  /* ================= TABLE ================= */
  renderTable() {
    const tbody = document.getElementById('tableBody');
    const countEl = document.getElementById('tableCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${this.filteredEntries.length} records`;

    tbody.innerHTML = this.filteredEntries.map((e, idx) => {
      const tierBadge = e.tier === 'eco-hero' 
        ? '<span class="text-emerald-600 font-bold">&bull; Low</span>'
        : (e.tier === 'high' ? '<span class="text-rose-600 font-bold">&bull; High</span>' : '<span class="text-amber-600 font-bold">&bull; Mid</span>');

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="py-3 px-3 text-slate-400">${idx + 1}</td>
          <td class="py-3 px-3 font-sans font-semibold text-slate-900">${e.name}</td>
          <td class="py-3 px-3 text-emerald-700 font-bold">${e.class}</td>
          <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${parseFloat(e.lat).toFixed(4)}, ${parseFloat(e.lng).toFixed(4)}</td>
          <td class="py-3 px-3 text-slate-600">${e.electricity} kWh${e.isSolar ? ' <span class="text-[10px] text-amber-600 font-sans font-bold">(Solar)</span>' : ''}</td>
          <td class="py-3 px-3 text-slate-600">${e.carLiters}L / ${e.bikeLiters}L</td>
          <td class="py-3 px-3 text-slate-600">${e.lpg} kg</td>
          <td class="py-3 px-3 text-slate-600">${e.meat}kg / ${e.dairy}kg</td>
          <td class="py-3 px-3 font-extrabold text-slate-900">
            ${e.totalEmission.toFixed(1)} <span class="text-[10px] text-slate-400 font-normal">kg</span> ${tierBadge}
          </td>
          <td class="py-3 px-3 text-right">
            <button onclick="window.GreenMetricaApp.focusEntry('${e.id}')" class="text-emerald-600 hover:text-emerald-700 mr-2.5 p-1 rounded hover:bg-emerald-50 transition" title="Locate on Map">
              <i class="fas fa-location-crosshairs"></i>
            </button>
            <button onclick="window.GreenMetricaApp.openEditModal('${e.id}')" class="text-sky-600 hover:text-sky-700 mr-2.5 p-1 rounded hover:bg-sky-50 transition" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="window.GreenMetricaApp.deleteEntry('${e.id}')" class="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ================= REPO-STYLE PARAMETER TOGGLE ================= */
  toggleParameter(param) {
    const params = ['electricity', 'car', 'bike', 'meat', 'dairy', 'otherFood', 'waste', 'recycling'];

    params.forEach(p => {
      const g = document.getElementById(p + 'Form');
      const b = document.getElementById('btnParam_' + p);
      if (p === param) {
        if (g) g.classList.remove('hidden');
        if (b) {
          b.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-xs');
          b.classList.remove('bg-slate-100', 'text-slate-700', 'border-slate-200');
        }
        const firstInput = g ? g.querySelector('input') : null;
        if (firstInput) firstInput.focus();
      } else {
        if (g) g.classList.add('hidden');
        if (b) {
          b.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-xs');
          b.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
        }
      }
    });

    this.updateFormLivePreview();
  }

  /* ================= ADD / EDIT MODAL ================= */
  openAddModal() {
    this.currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Carbon Footprint Calculator';
    document.getElementById('carbonForm').reset();

    // Reset all parameter buttons and groups
    const params = ['electricity', 'car', 'bike', 'meat', 'dairy', 'otherFood', 'waste', 'recycling'];
    params.forEach(p => {
      const g = document.getElementById(p + 'Form');
      if (g) g.classList.add('hidden');
      const b = document.getElementById('btnParam_' + p);
      if (b) {
        b.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600', 'shadow-xs');
        b.classList.add('bg-slate-100', 'text-slate-700', 'border-slate-200');
      }
    });

    // Inputs start completely empty
    document.getElementById('userName').value = '';
    document.getElementById('userClass').value = '';
    document.getElementById('userLat').value = '';
    document.getElementById('userLng').value = '';
    document.getElementById('electricityConsumption').value = '';
    document.getElementById('carDistance').value = '';
    document.getElementById('carMileage').value = '';
    document.getElementById('carLiters').value = '';
    document.getElementById('bikeDistance').value = '';
    document.getElementById('bikeMileage').value = '';
    document.getElementById('bikeLiters').value = '';
    document.getElementById('meatConsumption').value = '';
    document.getElementById('dairyConsumption').value = '';
    document.getElementById('otherFoodConsumption').value = '';
    document.getElementById('wasteGeneration').value = '';
    document.getElementById('recyclingAmount').value = '';

    // Show first parameter (Electricity) by default
    this.toggleParameter('electricity');

    this.updateFormLivePreview();
    document.getElementById('entryModal').classList.remove('hidden');
  }

  openEditModal(entryId) {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return;

    this.currentEditingId = entryId;
    document.getElementById('modalTitle').textContent = `Edit Entry: ${entry.name}`;

    document.getElementById('userName').value = entry.name || '';
    document.getElementById('userClass').value = entry.class || '';
    document.getElementById('userLat').value = entry.lat || '';
    document.getElementById('userLng').value = entry.lng || '';

    document.getElementById('electricityConsumption').value = entry.electricity || '';
    document.getElementById('carLiters').value = entry.carLiters || entry.car || '';
    document.getElementById('carDistance').value = entry.carDistance || '';
    document.getElementById('carMileage').value = entry.carMileage || '';
    if (entry.carFuelType) document.getElementById('carFuel').value = entry.carFuelType;

    document.getElementById('bikeLiters').value = entry.bikeLiters || entry.bike || '';
    document.getElementById('bikeDistance').value = entry.bikeDistance || '';
    document.getElementById('bikeMileage').value = entry.bikeMileage || '';

    document.getElementById('meatConsumption').value = entry.meat || '';
    document.getElementById('dairyConsumption').value = entry.dairy || '';
    document.getElementById('otherFoodConsumption').value = entry.lpg || '';
    document.getElementById('wasteGeneration').value = entry.waste || '';
    document.getElementById('recyclingAmount').value = entry.recycling || '';

    // Open first active parameter group
    const paramsOrder = ['electricity', 'car', 'bike', 'meat', 'dairy', 'otherFood', 'waste', 'recycling'];
    let firstParam = 'electricity';
    for (const p of paramsOrder) {
      if (p === 'electricity' && entry.electricity > 0) { firstParam = p; break; }
      if (p === 'car' && (entry.carLiters > 0 || entry.car > 0)) { firstParam = p; break; }
      if (p === 'bike' && (entry.bikeLiters > 0 || entry.bike > 0)) { firstParam = p; break; }
      if (p === 'meat' && entry.meat > 0) { firstParam = p; break; }
      if (p === 'dairy' && entry.dairy > 0) { firstParam = p; break; }
      if (p === 'otherFood' && entry.lpg > 0) { firstParam = p; break; }
      if (p === 'waste' && entry.waste > 0) { firstParam = p; break; }
      if (p === 'recycling' && entry.recycling > 0) { firstParam = p; break; }
    }

    this.toggleParameter(firstParam);
    this.updateFormLivePreview();
    document.getElementById('entryModal').classList.remove('hidden');
  }

  closeModal() {
    document.getElementById('entryModal').classList.add('hidden');
  }

  getFormData() {
    let carLiters = parseFloat(document.getElementById('carLiters').value) || 0;
    const carDist = parseFloat(document.getElementById('carDistance').value) || 0;
    const carMil = parseFloat(document.getElementById('carMileage').value) || 0;
    if (!carLiters && carDist && carMil) {
      carLiters = carDist / carMil;
    }

    let bikeLiters = parseFloat(document.getElementById('bikeLiters').value) || 0;
    const bikeDist = parseFloat(document.getElementById('bikeDistance').value) || 0;
    const bikeMil = parseFloat(document.getElementById('bikeMileage').value) || 0;
    if (!bikeLiters && bikeDist && bikeMil) {
      bikeLiters = bikeDist / bikeMil;
    }

    return {
      name: document.getElementById('userName').value.trim() || 'Student',
      class: document.getElementById('userClass').value.trim() || 'General',
      lat: parseFloat(document.getElementById('userLat').value) || DEFAULT_CENTER[0],
      lng: parseFloat(document.getElementById('userLng').value) || DEFAULT_CENTER[1],
      electricity: parseFloat(document.getElementById('electricityConsumption').value) || 0,
      carLiters: carLiters,
      carDistance: carDist,
      carMileage: carMil,
      carFuelType: document.getElementById('carFuel').value || 'petrol',
      bikeLiters: bikeLiters,
      bikeDistance: bikeDist,
      bikeMileage: bikeMil,
      lpg: parseFloat(document.getElementById('otherFoodConsumption').value) || 0,
      meat: parseFloat(document.getElementById('meatConsumption').value) || 0,
      dairy: parseFloat(document.getElementById('dairyConsumption').value) || 0,
      otherFood: 0,
      waste: parseFloat(document.getElementById('wasteGeneration').value) || 0,
      recycling: parseFloat(document.getElementById('recyclingAmount').value) || 0
    };
  }

  updateFormLivePreview() {
    const data = this.getFormData();
    const calc = calculateEmissionBreakdown(data);
    const liveEl = document.getElementById('formLiveTotal');
    if (liveEl) {
      liveEl.textContent = `${calc.totalEmission.toFixed(2)} kg CO₂e`;
    }
  }

  saveFormSubmission() {
    const raw = this.getFormData();
    if (!raw.name) {
      alert('Please enter a name.');
      return;
    }

    const calc = calculateEmissionBreakdown(raw);
    const item = { ...raw, ...calc };

    if (this.currentEditingId) {
      const idx = this.entries.findIndex(e => e.id === this.currentEditingId);
      if (idx !== -1) {
        item.id = this.currentEditingId;
        this.entries[idx] = item;
        this.showToast(`Updated entry for ${item.name}`);
      }
    } else {
      item.id = 'gm-' + Date.now();
      this.entries.unshift(item);
      this.showToast(`Added entry for ${item.name}`);
    }

    this.saveData();
    this.closeModal();

    if (this.map) {
      this.map.flyTo([item.lat, item.lng], 15, { duration: 1.0 });
    }
  }

  deleteEntry(id) {
    const item = this.entries.find(e => e.id === id);
    if (!item) return;

    if (typeof window !== 'undefined' && window.confirm && !window.confirm(`Delete emission record for ${item.name}?`)) {
      return;
    }
    this.entries = this.entries.filter(e => e.id !== id);
    this.saveData();
    this.showToast(`Deleted ${item.name}`);
  }

  /* ================= BROWSER GEOLOCATION ================= */
  useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Browser geolocation is not supported.');
      return;
    }
    this.showToast('Detecting current GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        document.getElementById('userLat').value = lat.toFixed(4);
        document.getElementById('userLng').value = lng.toFixed(4);
        this.showToast(`Coordinates set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        alert('Could not retrieve browser location: ' + err.message + '\nYou can enter coordinates manually.');
      },
      { timeout: 8000 }
    );
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  bindEvents() {
    // Search
    const search = document.getElementById('searchInput');
    if (search) {
      search.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        this.filteredEntries = this.entries.filter(entry => 
          !q ||
          entry.name.toLowerCase().includes(q) ||
          entry.class.toLowerCase().includes(q)
        );
        this.renderTable();
      });
    }

    // Form live preview inputs
    const inputIds = [
      'electricityConsumption', 'carDistance', 'carMileage', 'carLiters', 'carFuel',
      'bikeDistance', 'bikeMileage', 'bikeLiters',
      'meatConsumption', 'dairyConsumption', 'otherFoodConsumption',
      'wasteGeneration', 'recyclingAmount'
    ];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateFormLivePreview());
        el.addEventListener('change', () => this.updateFormLivePreview());
      }
    });

    // Form submit
    const form = document.getElementById('carbonForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveFormSubmission();
      });
    }
  }
}

window.GreenMetricaApp = new GreenMetricaApp();
document.addEventListener('DOMContentLoaded', () => {
  window.GreenMetricaApp.init();
});
