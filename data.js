/**
 * GreenMetrica - Data & Emission Calculation Engine
 * Extracted and enhanced from Ajinkj/CFPC (Carbon FootPrint Calculator)
 * Preloaded with 25 records from GREEN METRICA - MONTHLY CARBON EMISSION SUMMARY
 */

var EMISSION_FACTORS = {
  electricity: 0.5,        // kg CO2e per kWh
  solarDiscountFactor: 0.05,// kg CO2e per kWh
  carPetrol: 2.31,         // kg CO2e per liter of petrol
  carDiesel: 2.68,         // kg CO2e per liter of diesel
  bikePetrol: 2.31,        // kg CO2e per liter of petrol
  meat: 10.3,              // kg CO2e per kg
  dairy: 3.2,              // kg CO2e per kg/liter
  lpg: 2.983,              // kg CO2e per kg of LPG
  otherFood: 0.20,         // kg CO2e per kg
  waste: 0.45,             // kg CO2e per kg
  recycling: -0.50         // kg CO2e per kg (negative offset)
};

var BENCHMARKS = {
  indiaMonthlyAvg: 315.0,  // kg CO2e per month
  globalMonthlyAvg: 400.0, // kg CO2e per month
  targetMonthlyGoal: 250.0 // kg CO2e per month
};

/**
 * Calculates itemized emissions and total net footprint
 */
function calculateEmissionBreakdown(entry) {
  // Electricity
  var elecKwh = parseFloat(entry.electricity) || 0;
  var isSolar = Boolean(entry.solar);
  var elecFactor = isSolar ? EMISSION_FACTORS.solarDiscountFactor : EMISSION_FACTORS.electricity;
  var elecEmission = elecKwh * elecFactor;

  // Car: direct liters or distance / mileage
  var carLiters = 0;
  if (entry.carLiters !== undefined && entry.carLiters !== null && entry.carLiters !== '') {
    carLiters = parseFloat(entry.carLiters) || 0;
  } else if (entry.carDistance && entry.carMileage) {
    carLiters = parseFloat(entry.carDistance) / parseFloat(entry.carMileage);
  } else {
    carLiters = parseFloat(entry.car) || 0;
  }
  var carFuelType = entry.carFuelType || 'petrol';
  var carFactor = carFuelType === 'diesel' ? EMISSION_FACTORS.carDiesel : EMISSION_FACTORS.carPetrol;
  var carEmission = carLiters * carFactor;

  // Bike: direct liters or distance / mileage
  var bikeLiters = 0;
  if (entry.bikeLiters !== undefined && entry.bikeLiters !== null && entry.bikeLiters !== '') {
    bikeLiters = parseFloat(entry.bikeLiters) || 0;
  } else if (entry.bikeDistance && entry.bikeMileage) {
    bikeLiters = parseFloat(entry.bikeDistance) / parseFloat(entry.bikeMileage);
  } else {
    bikeLiters = parseFloat(entry.bike) || 0;
  }
  var bikeEmission = bikeLiters * EMISSION_FACTORS.bikePetrol;

  // Food & Diet
  var meatKg = parseFloat(entry.meat) || 0;
  var meatEmission = meatKg * EMISSION_FACTORS.meat;

  var dairyKg = parseFloat(entry.dairy) || 0;
  var dairyEmission = dairyKg * EMISSION_FACTORS.dairy;

  var lpgKg = parseFloat(entry.lpg) || 0;
  var lpgEmission = lpgKg * EMISSION_FACTORS.lpg;

  var otherFoodKg = parseFloat(entry.otherFood) || 0;
  var otherFoodEmission = otherFoodKg * EMISSION_FACTORS.otherFood;

  // Waste & Recycling
  var wasteKg = parseFloat(entry.waste) || 0;
  var wasteEmission = wasteKg * EMISSION_FACTORS.waste;

  var recyclingKg = parseFloat(entry.recycling) || 0;
  var recyclingEmission = recyclingKg * EMISSION_FACTORS.recycling;
  var offsetSavings = Math.abs(recyclingEmission);

  // Gross and Net
  var grossEmissions = elecEmission + carEmission + bikeEmission + meatEmission + dairyEmission + lpgEmission + otherFoodEmission + wasteEmission;
  var netEmissions = grossEmissions + recyclingEmission;

  // Status Tier
  var tier = 'moderate';
  var tierLabel = 'Moderate';
  var tierColor = '#f59e0b';
  if (netEmissions < 350) {
    tier = 'eco-hero';
    tierLabel = 'Eco Champion';
    tierColor = '#10b981';
  } else if (netEmissions > 600) {
    tier = 'high';
    tierLabel = 'High Emitter';
    tierColor = '#ef4444';
  }

  return {
    carLiters: parseFloat(carLiters.toFixed(2)),
    bikeLiters: parseFloat(bikeLiters.toFixed(2)),
    elecKwh: parseFloat(elecKwh.toFixed(2)),
    meatKg: parseFloat(meatKg.toFixed(2)),
    dairyKg: parseFloat(dairyKg.toFixed(2)),
    lpgKg: parseFloat(lpgKg.toFixed(2)),
    otherFoodKg: parseFloat(otherFoodKg.toFixed(2)),
    wasteKg: parseFloat(wasteKg.toFixed(2)),
    recyclingKg: parseFloat(recyclingKg.toFixed(2)),

    breakdown: {
      electricity: parseFloat(elecEmission.toFixed(2)),
      car: parseFloat(carEmission.toFixed(2)),
      bike: parseFloat(bikeEmission.toFixed(2)),
      meat: parseFloat(meatEmission.toFixed(2)),
      dairy: parseFloat(dairyEmission.toFixed(2)),
      lpg: parseFloat(lpgEmission.toFixed(2)),
      otherFood: parseFloat(otherFoodEmission.toFixed(2)),
      waste: parseFloat(wasteEmission.toFixed(2)),
      recycling: parseFloat(recyclingEmission.toFixed(2))
    },
    grossEmissions: parseFloat(grossEmissions.toFixed(2)),
    offsetSavings: parseFloat(offsetSavings.toFixed(2)),
    totalEmission: parseFloat(netEmissions.toFixed(2)),
    tier: tier,
    tierLabel: tierLabel,
    tierColor: tierColor,
    isSolar: isSolar
  };
}

// 25 Default entries from GREEN METRICA summary with verified postal coordinates (Center: 10.7867, 76.6548)
var INITIAL_STUDENT_DATA = [
  { id: 'gm-01', no: 1, name: 'AKSHITH SOORAJ', class: 'IX D', lat: 10.7867, lng: 76.6548, car: 6.5, carFuelType: 'petrol', bike: 10.5, electricity: 150, lpg: 14.2, meat: 3, dairy: 30, otherFood: 34, waste: 20, recycling: 5 },
  { id: 'gm-02', no: 2, name: 'VAIGA K S', class: 'X C', lat: 10.7915, lng: 76.6521, car: 22, carFuelType: 'petrol', bike: 12, electricity: 150, lpg: 14.2, meat: 3, dairy: 25, otherFood: 32, waste: 10, recycling: 15 },
  { id: 'gm-03', no: 3, name: 'ANAGHA K', class: 'XII B', lat: 10.7820, lng: 76.6590, car: 6, carFuelType: 'petrol', bike: 7, electricity: 132, lpg: 14.2, meat: 5, dairy: 30, otherFood: 25, waste: 10, recycling: 10 },
  { id: 'gm-04', no: 4, name: 'NARENDRAN K A', class: 'XII A', lat: 10.7785, lng: 76.6492, car: 10, carFuelType: 'petrol', bike: 10, electricity: 270, lpg: 14.2, meat: 4, dairy: 50, otherFood: 30, waste: 2, recycling: 5 },
  { id: 'gm-05', no: 5, name: 'RAYYAN HUSSAIN N', class: 'X E', lat: 10.7942, lng: 76.6610, car: 5, carFuelType: 'petrol', bike: 5, electricity: 109, lpg: 14.2, meat: 7, dairy: 20, otherFood: 25, waste: 12, recycling: 6 },
  { id: 'gm-06', no: 6, name: 'MOHAMMED FIZAN E', class: 'X C', lat: 10.7725, lng: 76.6635, car: 42, carFuelType: 'diesel', bike: 48, electricity: 1000, lpg: 28.4, meat: 10, dairy: 20, otherFood: 20, waste: 20, recycling: 6 },
  { id: 'gm-07', no: 7, name: 'MEBIN N J', class: 'IX E', lat: 10.7980, lng: 76.6475, car: 60, carFuelType: 'petrol', bike: 10, electricity: 20, solar: true, lpg: 14.2, meat: 5, dairy: 45, otherFood: 30, waste: 30, recycling: 5 },
  { id: 'gm-08', no: 8, name: 'VISHNUVISWANATHAN', class: 'XI B', lat: 10.7845, lng: 76.6380, car: 30, carFuelType: 'petrol', bike: 15, electricity: 260, lpg: 8, meat: 8, dairy: 32, otherFood: 30, waste: 18, recycling: 5 },
  { id: 'gm-09', no: 9, name: 'DANI TOM JEEVAN', class: 'XI B', lat: 10.7680, lng: 76.6515, car: 15, carFuelType: 'petrol', bike: 15, electricity: 246, lpg: 7.1, meat: 8, dairy: 45, otherFood: 27, waste: 20, recycling: 7 },
  { id: 'gm-10', no: 10, name: 'ANIRUDH K R', class: 'XI B', lat: 10.7920, lng: 76.6705, car: 30, carFuelType: 'petrol', bike: 10, electricity: 250, lpg: 6, meat: 8, dairy: 35, otherFood: 35, waste: 20, recycling: 5 },
  { id: 'gm-11', no: 11, name: 'ALAN SAJU', class: 'XI B', lat: 10.7750, lng: 76.6740, car: 12, carFuelType: 'petrol', bike: 20, electricity: 130, lpg: 15.6, meat: 8, dairy: 16, otherFood: 34, waste: 9, recycling: 12 },
  { id: 'gm-12', no: 12, name: 'KASHYAP VAIDYANATHAN', class: 'XI B', lat: 10.7890, lng: 76.6430, car: 30, carFuelType: 'petrol', bike: 39, electricity: 360, lpg: 16.2, meat: 6, dairy: 30, otherFood: 41, waste: 20, recycling: 15 },
  { id: 'gm-13', no: 13, name: 'MANAV VINOD', class: 'XI B', lat: 10.8035, lng: 76.6560, car: 17, carFuelType: 'petrol', bike: 26, electricity: 256, lpg: 14.2, meat: 8, dairy: 31, otherFood: 20, waste: 8, recycling: 5 },
  { id: 'gm-14', no: 14, name: 'ANUATHA KRISHNA K', class: 'X B', lat: 10.7810, lng: 76.6680, car: 20, carFuelType: 'petrol', bike: 10, electricity: 125, lpg: 8, meat: 8, dairy: 28, otherFood: 52, waste: 6, recycling: 4 },
  { id: 'gm-15', no: 15, name: 'DAKSHINA P', class: 'XB', lat: 10.7700, lng: 76.6390, car: 80, carFuelType: 'petrol', bike: 50, electricity: 300, lpg: 14.2, meat: 20, dairy: 40, otherFood: 50, waste: 10, recycling: 5 },
  { id: 'gm-16', no: 16, name: 'DEVADUTH O R', class: 'X A', lat: 10.7960, lng: 76.6350, car: 50, carFuelType: 'petrol', bike: 60, electricity: 250, lpg: 14.2, meat: 0, dairy: 50, otherFood: 50, waste: 15, recycling: 15 },
  { id: 'gm-17', no: 17, name: 'NABHAN AZEEM', class: 'X D', lat: 10.8080, lng: 76.6640, car: 200, carFuelType: 'diesel', bike: 0, electricity: 290, lpg: 10, meat: 3, dairy: 50, otherFood: 20, waste: 2, recycling: 5 },
  { id: 'gm-18', no: 18, name: 'ANIRUDH P', class: 'IX A', lat: 10.7630, lng: 76.6580, car: 180, carFuelType: 'petrol', bike: 10, electricity: 120, lpg: 10, meat: 3, dairy: 30, otherFood: 20, waste: 2, recycling: 4 },
  { id: 'gm-19', no: 19, name: 'ANJANA K M', class: 'IX E', lat: 10.7875, lng: 76.6790, car: 200, carFuelType: 'petrol', bike: 75, electricity: 350, lpg: 14.2, meat: 10, dairy: 25, otherFood: 40, waste: 25, recycling: 8 },
  { id: 'gm-20', no: 20, name: 'ARCHANA GIREESH', class: 'IX E', lat: 10.7790, lng: 76.6280, car: 250, carFuelType: 'petrol', bike: 100, electricity: 390, lpg: 28.4, meat: 12, dairy: 15, otherFood: 35, waste: 25, recycling: 9 },
  { id: 'gm-21', no: 21, name: 'NIMAY OLAPPAMANNA', class: 'X A', lat: 10.8120, lng: 76.6500, car: 10, carFuelType: 'petrol', bike: 0, electricity: 310, lpg: 14.2, meat: 0, dairy: 50, otherFood: 15, waste: 5, recycling: 4 },
  { id: 'gm-22', no: 22, name: 'ASHISH M', class: 'X E', lat: 10.7580, lng: 76.6450, car: 20, carFuelType: 'petrol', bike: 20, electricity: 207, lpg: 14.2, meat: 5, dairy: 25, otherFood: 25, waste: 15, recycling: 5 },
  { id: 'gm-23', no: 23, name: 'RIDHA', class: 'IX A', lat: 10.7950, lng: 76.6850, car: 8, carFuelType: 'petrol', bike: 10, electricity: 200, lpg: 14.2, meat: 10, dairy: 30, otherFood: 50, waste: 25, recycling: 10 },
  { id: 'gm-24', no: 24, name: 'VISHWAJITH V', class: 'XII A', lat: 10.7830, lng: 76.6210, car: 25, carFuelType: 'petrol', bike: 8, electricity: 300, lpg: 14.2, meat: 12, dairy: 12, otherFood: 25, waste: 30, recycling: 3 },
  { id: 'gm-25', no: 25, name: 'VEDA K S', class: 'IX A', lat: 10.8010, lng: 76.6380, car: 20, carFuelType: 'petrol', bike: 18, electricity: 480, lpg: 14.2, meat: 6, dairy: 40, otherFood: 30, waste: 15, recycling: 7 }
];

if (typeof window !== 'undefined') {
  window.EMISSION_FACTORS = EMISSION_FACTORS;
  window.BENCHMARKS = BENCHMARKS;
  window.calculateEmissionBreakdown = calculateEmissionBreakdown;
  window.INITIAL_STUDENT_DATA = INITIAL_STUDENT_DATA;
}
