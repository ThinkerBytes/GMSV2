/**
 * GreenMetrica - Admin Management & JSON Utilities
 */

const STORAGE_KEY = 'greenmetrica_entries_v7';

class GreenMetricaAdmin {
  constructor() {
    this.entries = [];
    this.filteredEntries = [];
  }

  init() {
    this.loadData();
    this.bindEvents();
    this.render();
  }

  loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const raw = JSON.parse(stored);
        if (Array.isArray(raw)) {
          this.entries = raw.map(item => {
            const calc = calculateEmissionBreakdown(item);
            return { ...item, ...calc };
          });
          this.filteredEntries = [...this.entries];
          return;
        }
      } catch (e) {}
    }

    // Default to INITIAL_STUDENT_DATA if empty
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
    this.render();
  }

  render() {
    // Top stats
    const countEl = document.getElementById('adminRecordCount');
    const totalEl = document.getElementById('adminTotalEmissions');
    const avgEl = document.getElementById('adminAvgEmissions');
    const tableBody = document.getElementById('adminTableBody');
    const tableCount = document.getElementById('adminTableCount');

    let totalEmissions = 0;
    this.entries.forEach(e => {
      totalEmissions += e.totalEmission || 0;
    });

    const count = this.entries.length;
    const avg = count > 0 ? (totalEmissions / count) : 0;

    if (countEl) countEl.textContent = count;
    if (totalEl) totalEl.textContent = `${totalEmissions.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
    if (avgEl) avgEl.textContent = `${avg.toFixed(1)} kg`;
    if (tableCount) tableCount.textContent = `${this.filteredEntries.length} of ${count} records`;

    // Render Table
    if (tableBody) {
      if (this.filteredEntries.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">No records found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = this.filteredEntries.map((e, idx) => {
        const tierBadge = e.tier === 'eco-hero' 
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Low</span>'
          : (e.tier === 'high' ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">High</span>' : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Mid</span>');

        return `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100 font-mono text-xs">
            <td class="py-3 px-3 text-slate-400 font-sans">${idx + 1}</td>
            <td class="py-3 px-3 font-sans font-semibold text-slate-900">${e.name}</td>
            <td class="py-3 px-3 font-sans text-emerald-700 font-bold">${e.class}</td>
            <td class="py-3 px-3 text-slate-500 text-[11px]">${parseFloat(e.lat).toFixed(4)}, ${parseFloat(e.lng).toFixed(4)}</td>
            <td class="py-3 px-3 text-slate-700 font-extrabold">${(e.totalEmission || 0).toFixed(1)} kg CO₂e</td>
            <td class="py-3 px-3 font-sans">${tierBadge}</td>
            <td class="py-3 px-3 text-right">
              <button onclick="window.GreenMetricaAdmin.deleteEntry('${e.id}')" class="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition" title="Delete Entry">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  exportJSON() {
    if (this.entries.length === 0) {
      this.showToast('No entries to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `greenmetrica_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Exported complete JSON database backup.');
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
            lat: parseFloat(item.lat) || 10.9069,
            lng: parseFloat(item.lng) || 76.4094,
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

  resetToDefaultData() {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm('Are you sure you want to reset the database to the 25 verified default records centered around (10.9069, 76.4094)? This will overwrite current entries.')) {
      return;
    }
    this.entries = INITIAL_STUDENT_DATA.map(item => {
      const calc = calculateEmissionBreakdown(item);
      return { ...item, ...calc };
    });
    this.saveData();
    this.showToast('Database reset to 25 default records.');
  }

  clearAllData() {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm('WARNING: Are you sure you want to permanently clear ALL entries in the database? This action cannot be undone.')) {
      return;
    }
    this.entries = [];
    this.saveData();
    this.showToast('All records cleared.');
  }

  deleteEntry(id) {
    const item = this.entries.find(e => e.id === id);
    if (!item) return;

    if (typeof window !== 'undefined' && window.confirm && !window.confirm(`Delete entry for ${item.name}?`)) {
      return;
    }
    this.entries = this.entries.filter(e => e.id !== id);
    this.saveData();
    this.showToast(`Deleted ${item.name}`);
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  bindEvents() {
    const search = document.getElementById('adminSearchInput');
    if (search) {
      search.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        this.filteredEntries = this.entries.filter(entry => 
          !q ||
          entry.name.toLowerCase().includes(q) ||
          entry.class.toLowerCase().includes(q)
        );
        this.render();
      });
    }

    const importInput = document.getElementById('adminJsonFileInput');
    if (importInput) {
      importInput.addEventListener('change', (e) => this.handleImportJSON(e));
    }
  }
}

window.GreenMetricaAdmin = new GreenMetricaAdmin();
document.addEventListener('DOMContentLoaded', () => {
  window.GreenMetricaAdmin.init();
});
