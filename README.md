# GreenMetrica - Carbon Footprint Calculator & Geospatial Tracker

GreenMetrica is a clean, modern web application designed to calculate, track, and geospatially visualize carbon footprints on an open-source **Leaflet Map**.

The calculation engine uses the exact formulas from [Ajinkj/CFPC](https://github.com/Ajinkj/CFPC) and is preloaded with the **Green Metrica Monthly Carbon Summary** (25 student records).

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
   - Centered on coordinates `(10.7867, 76.6548)`.
   - 25 student records situated organically across residential communities.
   - Colored by emission intensity (Green: <350 kg, Amber: 350-600 kg, Coral Red: >600 kg).
   - Minimal popups showing only Name, Class, and Total Footprint.
   - Fixed anchor positioning with zero drift on zooming.
   - Proper stacking context and `isolation: isolate` ensuring map never scrolls over the navbar.
3. **Interactive Charts**:
   - **Carbon Footprint by Category** (Donut chart).
   - **Carbon Footprint by Cohort** (Class IX, X, XI, XII comparison bar chart).
4. **Interactive Form (Identical to GitHub Repo Format)**:
   - Click parameter icon buttons (`Electricity`, `Car`, `Bike`, `Meat`, `Dairy`, `LPG`, `Waste`, `Recycling`) to reveal only that parameter's input fields.
   - Values are **not pre-filled** (starts empty with clear placeholders).
   - Clean fuel toggle (Petrol and Diesel options without numbers).
   - **Browser Geolocation:** Click "Get Browser Location" to grab current GPS coordinates without external APIs, or enter coordinates manually (available in both Add and Edit modes).
   - Real-time live calculation of total footprint.
5. **Data Management & Cache**:
   - All records are saved to `localStorage`, so page refresh does not lose any entries.
   - **Export Data** downloads a `.json` backup.
   - **Import Data** populates the app from any JSON file.

---

## 🚀 How to Run

```powershell
python -m http.server 8080
```
Open `http://localhost:8080/` in any web browser.
