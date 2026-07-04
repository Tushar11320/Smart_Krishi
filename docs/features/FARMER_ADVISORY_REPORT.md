# Farmer Advisory Feature Architecture Report

This report outlines the technical design, microclimate metrics, dynamic advisory algorithms, and fallback strategies implemented in the Smart Krishi Agronomic Advisory System.

---

## 1. Feature Objective

The goal of the Farmer Advisory system is to protect crops, reduce operational costs (input loss), and maximize yields by delivering real-time agronomic recommendations. The system continuously evaluates atmospheric telemetry to produce context-specific alerts.

---

## 2. Telemetry Metrics and Source APIs

We leverage the **OpenWeather API** (integrated at the backend layer with high-availability caching) to acquire real-time atmospheric measurements. The parameters evaluated by the advisory generator include:

| Metric | Source Parameter | Unit | Purpose |
| :--- | :--- | :--- | :--- |
| **Location** | Geolocation coords (`lat`/`lon`) or default city (`Bhopal`) | Degrees / Name | Contextualizing localized microclimates |
| **Temperature** | `main.temp` | °C | Identifying thermal stress, frost threats, and evaporation rates |
| **Humidity** | `main.humidity` | % | Estimating soil evaporation and fungal pathogenetic potential |
| **Wind Speed** | `wind.speed` | km/h | Restricting foliar spraying to prevent pesticide drift |
| **Rain Forecast** | `pop` (Probability of Precipitation) | % | Halting fertilizer application and active irrigation schedules |

---

## 3. Dynamic Advisory Engine Rules

The dynamic advisory rules calculate six types of advisory outputs from the input microclimatic vectors:

### I. Irrigation Advice
*   **Trigger (Precipitation > 60% OR Rain Conditions)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Suspension Alert: High precipitation probability detected. Suspend active irrigation schedules to prevent soil saturation, oxygen depletion in root zones, and nutrient leaching."
*   **Trigger (Temperature > 35°C AND Humidity < 40%)**:
    *   *Urgency*: `CRITICAL`
    *   *Advisory*: "Critical Water Replenishment: Elevated temperature and low humidity will accelerate evapotranspiration. Increase irrigation volume by 20% and irrigate exclusively during early morning or late evening."
*   **Default (Optimal Climate)**:
    *   *Urgency*: `NORMAL`
    *   *Advisory*: "Optimal Irrigation: Ambient temperature and soil transpiration levels are balanced. Maintain default crop irrigation intervals."

### II. Fertilizer Advice
*   **Trigger (Precipitation > 40% OR Rain Conditions)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Fertilizer Delay Needed: Do not apply granular urea, NPK, or water-soluble fertilizers. Impending precipitation will wash away nutrients, causing nitrogen runoff and fertilizer waste."
*   **Trigger (Wind Speed > 15 km/h)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Application Hazard: Wind speeds exceed 15 km/h. Avoid foliar fertilizer spraying to prevent chemical drift and ensure uniform nutrient distribution."
*   **Default (Optimal Climate)**:
    *   *Urgency*: `NORMAL`
    *   *Advisory*: "Ideal Fertilizer Window: Dry and calm conditions are highly favorable for fertilizer top-dressing. Ensure soil has moderate moisture for optimal root absorption."

### III. Pesticide Advice
*   **Trigger (Wind Speed > 20 km/h)**:
    *   *Urgency*: `CRITICAL`
    *   *Advisory*: "Spraying Restricted: Strong winds detected. Foliar pesticide spraying is highly prohibited as it causes severe chemical drift, wasting materials and endangering nearby fields."
*   **Trigger (Precipitation > 30%)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Rain Washout Threat: High probability of rain. Avoid spraying contact insecticides or fungicides as they will be washed off. Choose systemic alternatives or postpone spraying."
*   **Trigger (Temperature > 35°C)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Evaporative Loss Warning: Temperatures are above 35°C. Spraying during peak hours will cause rapid droplet evaporation. Spray only after sunset or at sunrise."
*   **Default (Optimal Climate)**:
    *   *Urgency*: `NORMAL`
    *   *Advisory*: "Excellent Spraying Window: Wind speeds are under limits and skies are clear. Suitable for both contact and systemic pesticide applications."

### IV. Crop Warnings
*   **Trigger (Humidity > 85%)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Fungal Outbreak Alert: Relative humidity exceeds 85%. Conditions are highly conducive for blast in rice, rust in wheat, and downy mildew in vegetables. Inspect crops daily and spray prophylactic bio-fungicides."
*   **Trigger (Wind Speed > 25 km/h)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Lodging and Staking Alert: High wind gusts present a threat of crop lodging. Provide immediate physical bamboo staking support to banana plants, sugarcane crops, and tall maize/sorghum plants."
*   **Default (Optimal Climate)**:
    *   *Urgency*: `NORMAL`
    *   *Advisory*: "Low Biological Stress: Microclimate parameters are within safety limits. Crop disease vulnerability index is normal."

### V. Heat Warnings
*   **Trigger (Temperature > 40°C)**:
    *   *Urgency*: `CRITICAL`
    *   *Advisory*: "Extreme Heatwave Warning: Temperature exceeds 40°C. High danger of crop sunburn, flower drop, and physiological wilting. Limit outdoor human labor between 12 PM - 4 PM. Apply light straw mulch."
*   **Trigger (Temperature > 35°C)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Moderate Heat Stress: Crop heat stress index is elevated. Maintain high moisture levels in nurseries and protect young seedlings using green shade nets."
*   **Trigger (Temperature < 12°C)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Frost/Cold Warning: Temperatures are low. Cover high-value horticultural crops with plastic sheets or perform light nocturnal smoking/irrigation to keep soil warm."
*   **Default (Optimal Climate)**:
    *   *Urgency*: `NORMAL`
    *   *Advisory*: "Temperature Safety: Ambient temperature is optimal for crop metabolism, photosynthesis, and vegetative development."

### VI. Heavy Rainfall Warnings
*   **Trigger (Precipitation > 70% OR Weather condition contains "heavy"/"thunderstorm")**:
    *   *Urgency*: `CRITICAL`
    *   *Advisory*: "Severe Downpour Alert: Heavy rainfall predicted. High risk of field flooding and waterlogging. Clean and clear all primary drainage channels immediately to allow rapid excess water run-off."
*   **Trigger (Precipitation > 40%)**:
    *   *Urgency*: `WARNING`
    *   *Advisory*: "Moderate Rainfall Advisory: Moderate rain is expected. Good for rainfed crops, but ensure drainage paths are unobstructed to prevent water pockets."
*   **Default (Optimal Climate)**:
    *   *Urgency*: `NORMAL`
    *   *Advisory*: "No Heavy Rainfall Expected: Precipitation is not expected to interfere with harvest or sowing activities over the next 24 hours."

---

## 4. Fallback Architecture

To ensure high availability under connectivity issues, API outages, or key exhaustion:

1.  **Browser Geolocation Error Recovery**:
    *   If GPS access is denied or times out, the client automatically defaults to fetching weather details for `"Bhopal"`, ensuring the user receives relevant advisories without a complete app crash.
2.  **API Offline Fallback**:
    *   If both geolocation queries and default city queries fail (API offline/blocked), a friendly fallback view is displayed to the farmer:
      > "Our real-time weather stations are currently offline. Please verify your connection or retry shortly."
    *   An emergency Toll-Free Agronomist Hotline card is shown: **1800-300-KRISHI**.
    *   A manual "Retry Synchronization" button enables immediate re-triggering of the telemetry load sequence.
