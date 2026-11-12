# GreenMetrica - Carbon Footprint Calculator & Geospatial Tracker

GreenMetrica is a clean, modern web application designed to calculate, track, and geospatially visualize carbon footprints on an open-source **Leaflet Map**.

The calculation engine uses the exact formulas from [Ajinkj/CFPC](https://github.com/Ajinkj/CFPC) and is preloaded with the **Green Metrica Monthly Carbon Summary** (25 student records organically clustered around `Lat: 10.9069, Lng: 76.4094`).

---

## 🔬 Conversion Formulas & Factors

| Activity / Parameter | Unit | Emission Factor | Formula |
| :--- | :--- | :--- | :--- |
| **Grid Electricity** | kWh | $0.50\text{ kg CO}_2\text{e / kWh}$ | $\text{Electricity} = \text{kWh} \times 0.50$ |
| **Solar Electricity** | kWh | $0.05\text{ kg CO}_2\text{e / kWh}$ | $\text{Electricity} = \text{kWh} \times 0.05$ |
| **Car Travel (Petrol)** | Liters | $2.31\text{ kg CO}_2\text{e / L}$ | $\text{Car} = \text{Liters} \times 2.31$ |
| **Car Travel (Diesel)** | Liters | $2.68\text{ kg CO}_2\text{e / L}$ | $\text{Car} = \text{Liters} \times 2.68$ |
| **Bike Travel** | Liters | $2.31\text{ kg CO}_2\text{e / L}$ | $\text{Bike} = \text{Liters} \times 2.31$ |
| **LPG Gas** | kg (14.2 kg cyl.) | $2.983\text{ kg CO}_2\text{e / kg}$ | $\text{LPG} = \text{kg} \times 2.983$ |
| **Meat Diet** | kg | $10.30\text{ kg CO}_2\text{e / kg}$ | $\text{Meat} = \text{kg} \times 10.30$ |
| **Dairy** | kg | $3.20\text{ kg CO}_2\text{e / kg}$ | $\text{Dairy} = \text{kg} \times 3.20$ |
| **Solid Waste** | kg | $0.45\text{ kg CO}_2\text{e / kg}$ | $\text{Waste} = \text{kg} \times 0.45$ |
| **Recycling Offset** | kg | $-0.50\text{ kg CO}_2\text{e / kg}$ | $\text{Recycling Offset} = \text{kg} \times (-0.50)$ |

**Net Carbon Footprint:**
$$\text{Net Emission (kg CO}_2\text{e)} = \sum \text{Gross Emissions} - (\text{Recycled kg} \times 0.50)$$

---

## 🌟 Application Features

1. **Top Dashboard Analytics Cards**:
   - **Total Carbon Footprint:** Dynamic net sum across all entries ($13,510.4\text{ kg CO}_2\text{e}$ across 25 default records).
   - **Primary Emission Cause:** Dynamic top emission contributor ($24.7\%$ from Electricity).
   - **Average per Person:** Dynamic per-student average benchmarked against India's monthly baseline ($315\text{ kg CO}_2\text{e}$).
2. **Interactive Leaflet Map**:
   - Free, open-source OpenStreetMap tiles (no API keys required).
   - Centered around `(10.9069, 76.4094)`.
   - 25 student records situated organically with randomized scatter across residential communities (no patterns or lines).
   - Colored by emission intensity (Green: <350 kg, Amber: 350-600 kg, Coral Red: >600 kg).
   - Minimal popups showing only Name, Class, and Total Footprint.
   - Fixed anchor positioning with zero drift on zooming.
   - Proper stacking context and `isolation: isolate` ensuring map never scrolls over the navbar.
3. **Interactive Charts**:
   - **Carbon Footprint by Category** (Donut chart).
   - **Carbon Footprint by Cohort** (Class IX, X, XI, XII comparison bar chart).
4. **Excel Import & Export (Home Dashboard)**:
   - **Import Excel Modal:** Clicking "Import Excel" opens a modal containing:
     - **Sample Excel Template Download:** `GreenMetrica_Student_Template.xlsx` containing the exact column structure and the 25 current students.
     - **Upload Zone:** Drop or browse `.xlsx` / `.xls` files. Users can add more students and upload directly.
   - **Export Excel:** Downloads `GreenMetrica_Emissions_[DATE].xlsx` with all student inputs, coordinates, plus calculated carbon footprints, emission breakdowns, and tiers.
5. **Administration Page (`/admin.html` or `/admin`)**:
   - **Full Database JSON Export:** Download raw database backup including nested objects.
   - **Full Database JSON Import:** Restore database from `.json` backups.
   - **Reset to 25 Default Records:** Re-seed standard dataset centered around `(10.9069, 76.4094)`.
   - **Clear Database:** Empty all entries.
   - **Live Database Inspector:** Search and delete individual records.

---

## 🚀 How to Run

```powershell
python -m http.server 8080
```
- Open `http://localhost:8080/` in any web browser for the Main Dashboard.
- Open `http://localhost:8080/admin.html` (or `http://localhost:8080/admin`) for the Admin Console.
