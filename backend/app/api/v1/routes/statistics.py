from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Optional, List, Dict, Any
from datetime import date
from app.core.database import get_db_data

router = APIRouter(tags=["Statistics"])

# ========================================
# GENERAL KPIs
# ========================================

@router.get("/kpis")
def get_general_kpis(
    programa: Optional[str] = Query(None, description="Filter by programa (e.g., ATI, TURISMO)"),
    version: Optional[str] = Query(None, description="Filter by version (e.g., v1.0)"),
    db: Session = Depends(get_db_data)
):
    """
    Get general KPIs:
    - Total responses (egresados + profesores)
    - Total egresados
    - Total profesores
    - Responses by programa
    - Latest version available
    """
    filters = []
    params = {}
    
    if programa:
        filters.append("programa = :programa")
        params["programa"] = programa
    if version:
        filters.append("version = :version")
        params["version"] = version
    
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    
    # Check which tables exist
    def table_exists(table_name: str) -> bool:
        check_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'core' 
                AND table_name = :table_name
            )
        """
        return db.execute(text(check_query), {"table_name": table_name}).scalar()
    
    # Total egresados
    total_egresados = 0
    if table_exists("egresados"):
        query_egresados = f"SELECT COUNT(*) FROM core.egresados {where_clause}"
        total_egresados = db.execute(text(query_egresados), params).scalar() or 0
    
    # Total profesores
    total_profesores = 0
    if table_exists("profesores"):
        query_profesores = f"SELECT COUNT(*) FROM core.profesores {where_clause}"
        total_profesores = db.execute(text(query_profesores), params).scalar() or 0
    
    # By programa
    queries_by_programa = []
    if table_exists("egresados"):
        queries_by_programa.append(f"SELECT programa FROM core.egresados {where_clause}")
    if table_exists("profesores"):
        queries_by_programa.append(f"SELECT programa FROM core.profesores {where_clause}")
    
    by_programa = []
    if queries_by_programa:
        query_by_programa = f"""
            SELECT programa, COUNT(*) as total
            FROM (
                {" UNION ALL ".join(queries_by_programa)}
            ) combined
            GROUP BY programa
            ORDER BY total DESC
        """
        by_programa = [{"programa": row[0], "total": row[1]} 
                       for row in db.execute(text(query_by_programa), params)]
    
    # Latest versions
    queries_versions = []
    if table_exists("egresados"):
        queries_versions.append("SELECT version FROM core.egresados")
    if table_exists("profesores"):
        queries_versions.append("SELECT version FROM core.profesores")
    
    versions = []
    if queries_versions:
        query_versions = f"""
            SELECT DISTINCT version
            FROM (
                {" UNION ".join(queries_versions)}
            ) versions
            ORDER BY version DESC
        """
        versions = [row[0] for row in db.execute(text(query_versions))]
    
    return {
        "total_responses": total_egresados + total_profesores,
        "total_egresados": total_egresados,
        "total_profesores": total_profesores,
        "by_programa": by_programa,
        "available_versions": versions,
        "filters_applied": {
            "programa": programa,
            "version": version
        }
    }


# ========================================
# RESPONSES PER PROGRAM
# ========================================

@router.get("/responses-per-program")
def get_responses_per_program(
    dataset: str = Query("egresados", description="Dataset: egresados or profesores"),
    version: Optional[str] = Query(None, description="Filter by version"),
    db: Session = Depends(get_db_data)
):
    """
    Get total responses grouped by programa.
    Returns count of responses for each program.
    """
    if dataset not in ["egresados", "profesores"]:
        raise HTTPException(status_code=400, detail="dataset must be 'egresados' or 'profesores'")
    
    filters = []
    params = {}
    
    if version:
        filters.append("version = :version")
        params["version"] = version
    
    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    
    query = f"""
        SELECT programa, COUNT(*) as total
        FROM core.{dataset}
        {where_clause}
        GROUP BY programa
        ORDER BY total DESC
    """
    
    result = db.execute(text(query), params)
    
    return {
        "dataset": dataset,
        "filters": {"version": version},
        "data": [{"programa": row[0], "count": row[1]} for row in result]
    }


# ========================================
# QUESTION ANALYSIS
# ========================================

@router.get("/question-analysis")
def get_question_analysis(
    dataset: str = Query("egresados", description="Dataset: egresados or profesores"),
    question_column: str = Query(..., description="Column name of the question to analyze"),
    programa: Optional[str] = Query(None, description="Filter by programa"),
    version: Optional[str] = Query(None, description="Filter by version"),
    db: Session = Depends(get_db_data)
):
    """
    Analyze a specific question column:
    - Count of each answer type
    - Percentage distribution
    - Total responses (excluding NULL/empty)
    
    Example: question_column = "ipg01_3_sexo" or "ep07_18_en_general_cual_es_su_grado_de_satisfaccion_en_relacion"
    """
    if dataset not in ["egresados", "profesores"]:
        raise HTTPException(status_code=400, detail="dataset must be 'egresados' or 'profesores'")
    
    # Build filters
    filters = [f"NULLIF(BTRIM({question_column}), '') IS NOT NULL"]
    params = {}
    
    if programa:
        filters.append("programa = :programa")
        params["programa"] = programa
    if version:
        filters.append("version = :version")
        params["version"] = version
    
    where_clause = f"WHERE {' AND '.join(filters)}"
    
    # Get distribution
    query = f"""
        SELECT 
            NULLIF(BTRIM({question_column}), '') as answer,
            COUNT(*) as count
        FROM core.{dataset}
        {where_clause}
        GROUP BY answer
        ORDER BY count DESC
    """
    
    try:
        result = db.execute(text(query), params)
        rows = result.fetchall()
        
        total = sum(row[1] for row in rows)
        
        data = [
            {
                "answer": row[0],
                "count": row[1],
                "percentage": round((row[1] / total * 100), 2) if total > 0 else 0
            }
            for row in rows
        ]
        
        return {
            "dataset": dataset,
            "question_column": question_column,
            "total_responses": total,
            "filters": {
                "programa": programa,
                "version": version
            },
            "distribution": data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error analyzing question: {str(e)}")


# ========================================
# MULTIPLE QUESTIONS ANALYSIS
# ========================================

@router.post("/questions-batch-analysis")
def get_questions_batch_analysis(
    dataset: str = Query("egresados", description="Dataset: egresados or profesores"),
    question_columns: List[str] = Query(..., description="List of column names to analyze"),
    programa: Optional[str] = Query(None, description="Filter by programa"),
    version: Optional[str] = Query(None, description="Filter by version"),
    db: Session = Depends(get_db_data)
):
    """
    Analyze multiple questions at once.
    Returns distribution for each question.
    """
    if dataset not in ["egresados", "profesores"]:
        raise HTTPException(status_code=400, detail="dataset must be 'egresados' or 'profesores'")
    
    results = []
    
    for question_column in question_columns:
        try:
            # Build filters
            filters = [f"NULLIF(BTRIM({question_column}), '') IS NOT NULL"]
            params = {}
            
            if programa:
                filters.append("programa = :programa")
                params["programa"] = programa
            if version:
                filters.append("version = :version")
                params["version"] = version
            
            where_clause = f"WHERE {' AND '.join(filters)}"
            
            query = f"""
                SELECT 
                    NULLIF(BTRIM({question_column}), '') as answer,
                    COUNT(*) as count
                FROM core.{dataset}
                {where_clause}
                GROUP BY answer
                ORDER BY count DESC
            """
            
            result = db.execute(text(query), params)
            rows = result.fetchall()
            
            total = sum(row[1] for row in rows)
            
            data = [
                {
                    "answer": row[0],
                    "count": row[1],
                    "percentage": round((row[1] / total * 100), 2) if total > 0 else 0
                }
                for row in rows
            ]
            
            results.append({
                "question_column": question_column,
                "total_responses": total,
                "distribution": data
            })
        except Exception as e:
            results.append({
                "question_column": question_column,
                "error": str(e)
            })
    
    return {
        "dataset": dataset,
        "filters": {
            "programa": programa,
            "version": version
        },
        "results": results
    }


# ========================================
# AVAILABLE COLUMNS
# ========================================

@router.get("/available-columns")
def get_available_columns(
    dataset: str = Query("egresados", description="Dataset: egresados or profesores"),
    db: Session = Depends(get_db_data)
):
    """
    Get list of all available columns in the dataset.
    Useful for frontend to know which questions can be analyzed.
    """
    if dataset not in ["egresados", "profesores"]:
        raise HTTPException(status_code=400, detail="dataset must be 'egresados' or 'profesores'")
    
    query = f"""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'core' 
        AND table_name = '{dataset}'
        ORDER BY ordinal_position
    """
    
    result = db.execute(text(query))
    
    columns = [
        {
            "column_name": row[0],
            "data_type": row[1],
            "is_question": not row[0] in ["id_id_de_respuesta", "programa", "version", "submitdate_fecha_de_envio"]
        }
        for row in result
    ]
    
    return {
        "dataset": dataset,
        "columns": columns,
        "total_columns": len(columns)
    }


# ========================================
# SATISFACTION ANALYSIS (Specific for satisfaction questions)
# ========================================

@router.get("/satisfaction-analysis")
def get_satisfaction_analysis(
    dataset: str = Query("egresados", description="Dataset: egresados or profesores"),
    programa: Optional[str] = Query(None, description="Filter by programa"),
    version: Optional[str] = Query(None, description="Filter by version"),
    db: Session = Depends(get_db_data)
):
    """
    Analyze satisfaction question specifically.
    For egresados: ep07_18_en_general_cual_es_su_grado_de_satisfaccion_en_relacion
    """
    if dataset not in ["egresados", "profesores"]:
        raise HTTPException(status_code=400, detail="dataset must be 'egresados' or 'profesores'")
    
    # Define satisfaction columns per dataset
    satisfaction_columns = {
        "egresados": "ep07_18_en_general_cual_es_su_grado_de_satisfaccion_en_relacion",
        # Add profesores satisfaction column when known
    }
    
    if dataset not in satisfaction_columns:
        raise HTTPException(status_code=404, detail=f"Satisfaction column not defined for {dataset}")
    
    column = satisfaction_columns[dataset]
    
    # Build filters
    filters = [f"NULLIF(BTRIM({column}), '') IS NOT NULL"]
    params = {}
    
    if programa:
        filters.append("programa = :programa")
        params["programa"] = programa
    if version:
        filters.append("version = :version")
        params["version"] = version
    
    where_clause = f"WHERE {' AND '.join(filters)}"
    
    query = f"""
        SELECT 
            NULLIF(BTRIM({column}), '') as satisfaction_level,
            COUNT(*) as count
        FROM core.{dataset}
        {where_clause}
        GROUP BY satisfaction_level
        ORDER BY count DESC
    """
    
    result = db.execute(text(query), params)
    rows = result.fetchall()
    
    total = sum(row[1] for row in rows)
    
    data = [
        {
            "satisfaction_level": row[0],
            "count": row[1],
            "percentage": round((row[1] / total * 100), 2) if total > 0 else 0
        }
        for row in rows
    ]
    
    return {
        "dataset": dataset,
        "column": column,
        "total_responses": total,
        "filters": {
            "programa": programa,
            "version": version
        },
        "distribution": data
    }


# ========================================
# PROGRAMS LIST
# ========================================

@router.get("/programs")
def get_available_programs(db: Session = Depends(get_db_data)):
    """
    Get list of all available programs across both datasets.
    """
    # Check which tables exist
    tables_exist = {
        "egresados": False,
        "profesores": False
    }
    
    for table in ["egresados", "profesores"]:
        check_query = """
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'core' 
                AND table_name = :table_name
            )
        """
        exists = db.execute(text(check_query), {"table_name": table}).scalar()
        tables_exist[table] = exists
    
    # Build query based on which tables exist
    queries = []
    if tables_exist["egresados"]:
        queries.append("SELECT programa FROM core.egresados")
    if tables_exist["profesores"]:
        queries.append("SELECT programa FROM core.profesores")
    
    if not queries:
        return {"programs": []}
    
    query = f"""
        SELECT DISTINCT programa
        FROM (
            {" UNION ".join(queries)}
        ) programs
        ORDER BY programa
    """
    
    result = db.execute(text(query))
    
    return {
        "programs": [row[0] for row in result]
    }