# 🎨 Frontend Integration Guide

## ✅ What's Been Added

I've created a complete integration between your React frontend and the Statistics API. Here's what's available:

### 📁 New Files Created

1. **`src/services/api.js`** - API service layer
   - `statisticsAPI` - All statistics endpoints
   - `authAPI` - Authentication endpoints
   - `healthAPI` - Health check endpoints

2. **`src/components/StatsCard.jsx`** - Reusable KPI card component
   - Displays metrics with icons and trends
   - Loading states
   - Error handling

3. **`src/components/StatsCard.css`** - Styles for stats cards

4. **`src/components/QuestionChart.jsx`** - Question analysis chart component
   - Pie and bar chart support
   - Data table with percentages
   - Loading states

5. **`src/pages/Admin/Dashboard/DashboardNew.jsx`** - Updated Dashboard with real data
   - Real-time KPIs from API
   - Program and version filtering
   - Multiple charts (gender, satisfaction, responses)
   - Error handling and retry

6. **`.env`** - Environment configuration
   - `VITE_API_URL` - Backend API base URL

---

## 🚀 How to Use

### 1. **Replace the Old Dashboard**

Option A: Rename files
```bash
# In frontend/src/pages/Admin/Dashboard/
mv Dashboard.jsx Dashboard.old.jsx
mv DashboardNew.jsx Dashboard.jsx
```

Option B: Copy content from `DashboardNew.jsx` to `Dashboard.jsx`

### 2. **Start the Frontend**

```powershell
cd frontend
npm install  # If needed
npm run dev
```

### 3. **Access the Dashboard**

Navigate to: `http://localhost:5173/dashboard`

---

## 📊 Dashboard Features

### **Filters**
- **Program Filter**: Filter data by specific program (ATI, TURISMO, etc.)
- **Version Filter**: Filter by data version (v1.0, 20250622, etc.)

### **KPI Cards**
- Total Responses (Egresados + Profesores)
- Total Egresados
- Total Profesores  
- Number of Programs

### **Charts**
1. **Responses by Program** (Bar Chart)
2. **Gender Distribution** (Pie Chart)
3. **Satisfaction Analysis** (Bar Chart) - If available
4. **Program Breakdown Table** - Detailed breakdown with percentages

---

## 🎯 Using the API Service

### Example: Fetch KPIs

```javascript
import { statisticsAPI } from '../services/api';

// Get all KPIs
const kpis = await statisticsAPI.getKPIs();

// Get KPIs filtered by program
const atiKpis = await statisticsAPI.getKPIs({ programa: 'ATI' });

// Get KPIs filtered by program and version
const filtered = await statisticsAPI.getKPIs({ 
  programa: 'ATI', 
  version: 'v1.0' 
});
```

### Example: Analyze a Question

```javascript
// Analyze gender question
const genderData = await statisticsAPI.analyzeQuestion(
  'egresados',  // dataset
  'ipg01_3_sexo',  // question column
  { programa: 'ATI' }  // filters (optional)
);

console.log(genderData);
// {
//   dataset: "egresados",
//   question_column: "ipg01_3_sexo",
//   total_responses: 84,
//   distribution: [
//     { answer: "Hombre", count: 63, percentage: 75.0 },
//     { answer: "Mujer", count: 21, percentage: 25.0 }
//   ]
// }
```

### Example: Get Available Questions

```javascript
// Get all available questions for egresados
const columns = await statisticsAPI.getAvailableColumns('egresados');

console.log(columns.columns);
// [
//   { column_name: "ipg01_3_sexo", data_type: "text", is_question: true },
//   { column_name: "ipg02_4_estado_civil", data_type: "text", is_question: true },
//   ...
// ]
```

---

## 🧩 Components Usage

### **StatsCard Component**

```javascript
import { StatsCard } from '../components/StatsCard';

<StatsCard
  label="Total Users"
  value={1234}
  icon="pi pi-users"
  trend="+12%"
  loading={false}
/>
```

### **QuestionChart Component**

```javascript
import { QuestionChart } from '../components/QuestionChart';

<QuestionChart
  title="Gender Distribution"
  data={genderAnalysisData}  // From statisticsAPI.analyzeQuestion()
  chartType="pie"  // or "bar"
  loading={false}
/>
```

---

## 🎨 Creating Custom Analysis Pages

### Example: Create a "Reports" page

```javascript
// src/pages/Admin/Reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { statisticsAPI } from '../../../services/api';
import { QuestionChart } from '../../../components/QuestionChart';

const Reports = () => {
  const [civilStatusData, setCivilStatusData] = useState(null);
  const [employmentData, setEmploymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [civilStatus, employment] = await Promise.all([
          statisticsAPI.analyzeQuestion('egresados', 'ipg02_4_estado_civil'),
          statisticsAPI.analyzeQuestion('egresados', 'ipg05_7_cual_es_su_condicion_laboral_actual')
        ]);
        
        setCivilStatusData(civilStatus);
        setEmploymentData(employment);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Custom Reports</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <QuestionChart
          title="Civil Status"
          data={civilStatusData}
          chartType="pie"
          loading={loading}
        />
        
        <QuestionChart
          title="Employment Status"
          data={employmentData}
          chartType="bar"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Reports;
```

---

## 🔧 Configuration

### Environment Variables

Edit `.env` file:

```env
# Development
VITE_API_URL=http://localhost:8001/api/v1

# Production (example)
# VITE_API_URL=https://api.paaa.itcr.ac.cr/api/v1
```

---

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Make sure the backend is running on `localhost:8001`
2. Check that `allow_origins` in `backend/app/main.py` includes your frontend URL:

```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### API Connection Errors

1. **Check backend is running:**
   ```powershell
   docker ps  # Should see paaa-backend
   ```

2. **Test API directly:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8001/api/v1/stats/programs"
   ```

3. **Check environment variable:**
   - Open browser console
   - Type: `import.meta.env.VITE_API_URL`
   - Should show: `http://localhost:8001/api/v1`

### No Data Showing

1. **Verify data exists:**
   ```powershell
   docker exec etl-db psql -U postgres -d paadb_data -c "SELECT COUNT(*) FROM core.egresados"
   ```

2. **Check browser console** for errors

3. **Check Network tab** in browser DevTools to see API responses

---

## 📊 Available Question Columns

To find available questions to analyze:

```javascript
const columns = await statisticsAPI.getAvailableColumns('egresados');

// Filter only question columns
const questions = columns.columns.filter(col => col.is_question);

console.log(questions.map(q => q.column_name));
```

Common questions:
- `ipg01_3_sexo` - Gender
- `ipg02_4_estado_civil` - Civil status
- `ipg05_7_cual_es_su_condicion_laboral_actual` - Employment status
- `ep07_18_en_general_cual_es_su_grado_de_satisfaccion_en_relacion` - Satisfaction

---

## 🎉 Next Steps

1. **Add Authentication**
   - Integrate login functionality
   - Protect routes with JWT

2. **Add More Charts**
   - Create custom analysis pages
   - Add more question visualizations

3. **Export Functionality**
   - Add PDF/Excel export buttons
   - Generate reports

4. **Real-time Updates**
   - Add auto-refresh functionality
   - WebSocket integration for live data

5. **Advanced Filtering**
   - Date range filters
   - Multiple program selection
   - Custom filters

---

## 📚 Resources

- **Backend API Docs**: `http://localhost:8001/docs` (Swagger UI)
- **PrimeReact Components**: https://primereact.org/
- **Chart.js**: https://www.chartjs.org/

---

## ✅ Checklist

- [ ] Replace Dashboard.jsx with DashboardNew.jsx
- [ ] Start frontend: `npm run dev`
- [ ] Verify backend is running on port 8001
- [ ] Load `http://localhost:5173/dashboard`
- [ ] Check that data loads correctly
- [ ] Test program filter
- [ ] Test version filter
- [ ] Check browser console for errors

---

Need help? Check the browser console and network tab for detailed error messages!
