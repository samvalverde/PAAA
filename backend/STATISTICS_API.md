# 📊 Statistics API Documentation

## Base URL
```
http://localhost:8001/api/v1/stats
```

---

## 📌 Available Endpoints

### 1. **General KPIs** 
`GET /api/v1/stats/kpis`

Get overall statistics across both datasets (egresados + profesores).

**Query Parameters:**
- `programa` (optional): Filter by program code (e.g., "ATI", "TURISMO")
- `version` (optional): Filter by version (e.g., "v1.0")

**Example Request:**
```bash
GET /api/v1/stats/kpis?programa=ATI&version=v1.0
```

**Example Response:**
```json
{
  "total_responses": 150,
  "total_egresados": 100,
  "total_profesores": 50,
  "by_programa": [
    {"programa": "ATI", "total": 150}
  ],
  "available_versions": ["v2.0", "v1.0"],
  "filters_applied": {
    "programa": "ATI",
    "version": "v1.0"
  }
}
```

---

### 2. **Responses Per Program**
`GET /api/v1/stats/responses-per-program`

Count responses grouped by programa.

**Query Parameters:**
- `dataset` (required): "egresados" or "profesores"
- `version` (optional): Filter by version

**Example Request:**
```bash
GET /api/v1/stats/responses-per-program?dataset=egresados&version=v1.0
```

**Example Response:**
```json
{
  "dataset": "egresados",
  "filters": {"version": "v1.0"},
  "data": [
    {"programa": "ATI", "count": 85},
    {"programa": "TURISMO", "count": 42}
  ]
}
```

---

### 3. **Question Analysis**
`GET /api/v1/stats/question-analysis`

Analyze a specific survey question with distribution and percentages.

**Query Parameters:**
- `dataset` (required): "egresados" or "profesores"
- `question_column` (required): Column name to analyze
- `programa` (optional): Filter by program
- `version` (optional): Filter by version

**Example Request:**
```bash
GET /api/v1/stats/question-analysis?dataset=egresados&question_column=ipg01_3_sexo&programa=ATI
```

**Example Response:**
```json
{
  "dataset": "egresados",
  "question_column": "ipg01_3_sexo",
  "total_responses": 85,
  "filters": {
    "programa": "ATI",
    "version": null
  },
  "distribution": [
    {"answer": "Masculino", "count": 50, "percentage": 58.82},
    {"answer": "Femenino", "count": 35, "percentage": 41.18}
  ]
}
```

---

### 4. **Batch Question Analysis**
`POST /api/v1/stats/questions-batch-analysis`

Analyze multiple questions at once.

**Query Parameters:**
- `dataset` (required): "egresados" or "profesores"
- `question_columns` (required, multiple): List of columns to analyze
- `programa` (optional): Filter by program
- `version` (optional): Filter by version

**Example Request:**
```bash
POST /api/v1/stats/questions-batch-analysis?dataset=egresados&question_columns=ipg01_3_sexo&question_columns=ipg02_4_estado_civil&programa=ATI
```

**Example Response:**
```json
{
  "dataset": "egresados",
  "filters": {
    "programa": "ATI",
    "version": null
  },
  "results": [
    {
      "question_column": "ipg01_3_sexo",
      "total_responses": 85,
      "distribution": [
        {"answer": "Masculino", "count": 50, "percentage": 58.82},
        {"answer": "Femenino", "count": 35, "percentage": 41.18}
      ]
    },
    {
      "question_column": "ipg02_4_estado_civil",
      "total_responses": 85,
      "distribution": [
        {"answer": "Soltero/a", "count": 40, "percentage": 47.06},
        {"answer": "Casado/a", "count": 30, "percentage": 35.29},
        {"answer": "Unión libre", "count": 15, "percentage": 17.65}
      ]
    }
  ]
}
```

---

### 5. **Available Columns**
`GET /api/v1/stats/available-columns`

Get list of all columns/questions available in a dataset.

**Query Parameters:**
- `dataset` (required): "egresados" or "profesores"

**Example Request:**
```bash
GET /api/v1/stats/available-columns?dataset=egresados
```

**Example Response:**
```json
{
  "dataset": "egresados",
  "total_columns": 72,
  "columns": [
    {"column_name": "id_id_de_respuesta", "data_type": "text", "is_question": false},
    {"column_name": "programa", "data_type": "text", "is_question": false},
    {"column_name": "version", "data_type": "text", "is_question": false},
    {"column_name": "ipg01_3_sexo", "data_type": "text", "is_question": true},
    {"column_name": "ipg02_4_estado_civil", "data_type": "text", "is_question": true}
  ]
}
```

---

### 6. **Satisfaction Analysis**
`GET /api/v1/stats/satisfaction-analysis`

Specific endpoint for satisfaction question analysis.

**Query Parameters:**
- `dataset` (required): "egresados" or "profesores"
- `programa` (optional): Filter by program
- `version` (optional): Filter by version

**Example Request:**
```bash
GET /api/v1/stats/satisfaction-analysis?dataset=egresados&programa=ATI
```

**Example Response:**
```json
{
  "dataset": "egresados",
  "column": "ep07_18_en_general_cual_es_su_grado_de_satisfaccion_en_relacion",
  "total_responses": 85,
  "filters": {
    "programa": "ATI",
    "version": null
  },
  "distribution": [
    {"satisfaction_level": "Muy satisfecho", "count": 40, "percentage": 47.06},
    {"satisfaction_level": "Satisfecho", "count": 35, "percentage": 41.18},
    {"satisfaction_level": "Neutral", "count": 8, "percentage": 9.41},
    {"satisfaction_level": "Insatisfecho", "count": 2, "percentage": 2.35}
  ]
}
```

---

### 7. **Available Programs**
`GET /api/v1/stats/programs`

Get list of all available programs in the system.

**Example Request:**
```bash
GET /api/v1/stats/programs
```

**Example Response:**
```json
{
  "programs": ["ATI", "TURISMO", "AGRONOMIA"]
}
```

---

## 🧪 Testing the API

### Using PowerShell (Invoke-RestMethod):

```powershell
# Get KPIs
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/stats/kpis"

# Get KPIs filtered by programa
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/stats/kpis?programa=ATI"

# Analyze a question
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/stats/question-analysis?dataset=egresados&question_column=ipg01_3_sexo"

# Get available programs
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/stats/programs"

# Get available columns
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/stats/available-columns?dataset=egresados"
```

### Using curl:

```bash
# Get KPIs
curl http://localhost:3000/api/v1/stats/kpis

# Analyze a question
curl "http://localhost:3000/api/v1/stats/question-analysis?dataset=egresados&question_column=ipg01_3_sexo&programa=ATI"
```

---

## 🎯 Common Use Cases

### 1. **Dashboard Overview**
```
GET /api/v1/stats/kpis
GET /api/v1/stats/programs
```

### 2. **Program-Specific Analysis**
```
GET /api/v1/stats/kpis?programa=ATI
GET /api/v1/stats/responses-per-program?dataset=egresados
GET /api/v1/stats/satisfaction-analysis?dataset=egresados&programa=ATI
```

### 3. **Question Deep Dive**
```
GET /api/v1/stats/available-columns?dataset=egresados
GET /api/v1/stats/question-analysis?dataset=egresados&question_column=ipg01_3_sexo
```

### 4. **Multi-Question Comparison**
```
POST /api/v1/stats/questions-batch-analysis?dataset=egresados&question_columns=ipg01_3_sexo&question_columns=ipg02_4_estado_civil&question_columns=ipg05_7_cual_es_su_condicion_laboral_actual
```

---

## 📝 Key Features

✅ **Server-side filtering** - Filter by programa, version  
✅ **Percentage calculations** - Automatic percentage distribution  
✅ **NULL handling** - Ignores empty/NULL values  
✅ **Batch processing** - Analyze multiple questions at once  
✅ **Column discovery** - Find available questions dynamically  
✅ **Cross-dataset KPIs** - Combine egresados + profesores  

---

## 🔒 Authentication

Currently, these endpoints are **public** (no authentication required).

If you need to add authentication later:
1. Import `get_current_user` from `app.core.security`
2. Add dependency: `current_user = Depends(get_current_user)`
3. Example:
```python
@router.get("/kpis")
def get_general_kpis(
    current_user = Depends(get_current_user),  # Add this
    db: Session = Depends(get_db_data)
):
    # ... rest of the code
```

---

## 📊 Interactive API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: `http://localhost:3000/docs`
- **ReDoc**: `http://localhost:3000/redoc`

You can test all endpoints directly from the browser!

---

## 🐛 Error Responses

### 400 Bad Request
```json
{
  "detail": "dataset must be 'egresados' or 'profesores'"
}
```

### 404 Not Found
```json
{
  "detail": "Satisfaction column not defined for profesores"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error analyzing question: column 'invalid_column' does not exist"
}
```
