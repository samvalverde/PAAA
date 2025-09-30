# install.packages('devtools')
# install.packages('httpuv')
# devtools::install_github('bbc/bbplot')
# install.packages('IRkernel')
# install.packages("readxl")
# install.packages("ggplot2")
# install.packages("openxlsx")
# install.packages("officer")
# install.packages("flextable")
# install.packages("reticulate")

Sys.setenv("RETICULATE_PYTHON" = "/Users/kennorsdb/Proyectos/TEC/acreditacion-ati/.venv/bin/python")
library(reticulate)
use_virtualenv("./.venv", require=TRUE)
library(ggplot2)
library(bbplot)
library(readxl)
library(openxlsx)
library(officer)
library(dplyr)
library(tidyr)
library(flextable)
library(purrr)
library(tibble)
# Sys.getenv("RETICULATE_PYTHON")
py_config()

# Handle the import error for the agente module
agente <- import("agente")


# Load the custom functions from utils.r
source("utils.r")

process_evidencia <- function(metadata_evidencia, responses, response_dict) {
  print(paste("        Processing subevidence:", metadata_evidencia$Subevidencia[1]))
  
  # Crear una tabla para compilar todas las preguntas de la evidencia
  tabla_compilada <- data.frame()

  # Iterar por cada pregunta de la evidencia
  for (i in seq_len(nrow(metadata_evidencia))) {
    codigo_encuesta <- metadata_evidencia$`Código encuesta`[i]
    print(paste("        Processing question code:", codigo_encuesta))
    pregunta <- metadata_evidencia$Pregunta[i]
    titulo_grafico <- metadata_evidencia$`Título gráfico`[i]
    Leyenda <- metadata_evidencia$Leyenda[i]
    tipo_grafico <- metadata_evidencia$`Tipo gráfico`[i]
    tipo_pregunta <- metadata_evidencia$`Tipo pregunta`[i]
    quitar_nas <- metadata_evidencia$`Quitar Nas`[i]
    codigo_na <- metadata_evidencia$`Código NA`[i]
    
    # Filtrar las respuestas correspondientes al código de encuesta
    print("        Filtering responses")
    respuestas_filtradas <- responses %>%
      select(all_of(codigo_encuesta)) %>%
      rename(Respuesta = all_of(codigo_encuesta)) %>%
      mutate(Respuesta = ifelse(is.na(Respuesta), codigo_na, Respuesta))

    # Remove NAs if required
    print("        Removing NAs")
    print(respuestas_filtradas)
    print(codigo_na)
    print(is.na(codigo_na))
    if (quitar_nas == "Sí") {
      if (codigo_na == "" || is.na(codigo_na)) {
        print("is na")
        respuestas_filtradas <- respuestas_filtradas %>%
          filter(!is.na(Respuesta))
      } else {
        respuestas_filtradas <- respuestas_filtradas %>%
          filter(Respuesta != codigo_na)
      }
    }
    print("        After removing NAs")
    print(respuestas_filtradas)

    print("        Antes de normalizar")
    # Normalizar las respuestas
    if (tipo_pregunta %in% names(response_dict)) {
      print("        Normalizing responses")
      respuestas_filtradas$Respuesta <- factor(
        normalize_responses(respuestas_filtradas$Respuesta, response_dict[[tipo_pregunta]]),
        levels = response_dict[[tipo_pregunta]]
      )
    }
    print(respuestas_filtradas)

    # Calcular valores absolutos y porcentajes
    print("        Calculating summary")
    resumen <- respuestas_filtradas %>%
      group_by(Respuesta) %>%
      summarise(
        Frecuencia = n(),
        Porcentaje = (n() / nrow(respuestas_filtradas)) * 100
      ) %>%
      mutate(Pregunta = pregunta) %>%
      mutate(Título = titulo_grafico) %>%
      mutate(Leyenda = Leyenda) %>%
      mutate(Tipo = tipo_grafico)

    # Agregar los valores a la tabla compilada
    print("        Adding to compiled table")
    tabla_compilada <- bind_rows(tabla_compilada, resumen)
  }
  
  print("        Finished processing subevidence")
  return(tabla_compilada)
}

# Function to process data for a given population
process_population <- function(population) {
  # Load the responses for the given population
  responses <- read_excel(paste0("inputs/respuestasEncuesta", population, ".xlsx"))

  # Load metadata
  metadata <- read_excel("./inputs/MetaDatos.xlsx") %>%
    filter(Población == population) %>% filter(Evidencia == "280")

  responses_questions <- process_col_names(responses)
  colnames(responses) <- responses_questions$codes

  print(paste("Processing population:", population))
  # Load the codes for normalize the responses
  codigos <- read_excel("inputs/MetaDatos.xlsx", sheet = "Códigos")
  response_dict <- codigos %>%
    mutate(
      `Opciones de respuesta` = strsplit(`Opciones de respuesta`, "; "),
      `Texto en columnas` = strsplit(`Texto en columnas`, "; ")
    ) %>%
    mutate(
      mapping = map2(
        `Opciones de respuesta`, 
        `Texto en columnas`, 
        ~ setNames(.y, .x)
      )
    ) %>%
    select(`Tipo de respuesta`, `mapping`) %>%
    deframe()

    print("Creating summary document")

  evidencias_resumen <- metadata %>%
    select(Criterio, Evidencia, Subevidencia) %>%
    distinct()

  # create a empty word document
  doc <- read_docx()
  doc <- doc %>% body_add_par("Informe de resultados ATI", style = "heading 1")

  criterios <- unique(metadata$Criterio)

  # CRITERIOS
  for (criterio_actual in criterios) {
    print(paste("    Processing criteria:", criterio_actual))
    doc <- doc %>% body_add_par(paste("Criterio: ", criterio_actual), style = "heading 2")
    # print(criterio_actual)
    evidencias_resumen_criterio <- evidencias_resumen %>%
      filter(evidencias_resumen$Criterio == criterio_actual)

    # EVIDENCIAS
    for (evidencia_actual in unique(evidencias_resumen_criterio$Evidencia)) {
      subevidencias <- evidencias_resumen_criterio %>%
        filter(Evidencia == evidencia_actual) %>%
        pull(Subevidencia) %>%
        unique()

      doc <- doc %>% body_add_par(paste("Evidencia: ", evidencia_actual), style = "heading 3")
      metadata_evidencia <- metadata %>%
        filter(Evidencia == evidencia_actual)

      texto_criterio <- metadata_evidencia$`Texto del criterio`[1]
      codigo_sinaes <- metadata_evidencia$`Código SINAES`[1]
      codigo_encuesta <-  metadata_evidencia$`Código encuesta`[1]

      doc <- doc %>% body_add_par(paste("Texto del Criterio: ", texto_criterio))
      doc <- doc %>% body_add_par(paste("Código SINAES: ", codigo_sinaes))
      doc <- doc %>% body_add_par(paste("Código Encuesta: ", codigo_encuesta))

      # SUBEVIDENCIAS
      for (subevidencia_actual in subevidencias) {
        print(paste("Processing evidence:", evidencia_actual, "Subevidence:", subevidencia_actual))
        metadata_evidencia <- metadata %>%
          filter(Evidencia == evidencia_actual, Subevidencia == subevidencia_actual)

        titulo_grafico <-  metadata_evidencia$`Título gráfico`[1]
        tipo_grafico <-  metadata_evidencia$`Tipo gráfico`[1]
        pregunta <-  metadata_evidencia$`Pregunta`[1]

        tabla_compilada <- process_evidencia(metadata_evidencia, responses, response_dict)

        # print(tabla_compilada) ## debug
        print("    Creating summary table")
        tabla_resumen_porcentaje <- tabla_compilada %>%
          pivot_wider(names_from = Leyenda, values_from = Porcentaje) %>%
          select(-Frecuencia, -Título, -Pregunta, -Tipo) %>%
          group_by(Respuesta) %>%
          summarise_all(sum, na.rm = TRUE) %>%
          complete(Respuesta, fill = list(Porcentaje = 0))

        print("    Creating flextable")
        resumen <- as.data.frame(tabla_resumen_porcentaje)
        resumen <- resumen %>%
          mutate(across(where(is.numeric), \(x) round(x, 2)))
        
        # print(resumen)
        resumen_t <- as.data.frame(t(resumen))
        # print(nrow(resumen_t))
        # print(resumen_t)
        colnames(resumen_t) <- resumen_t[1, ]
        if (nrow(resumen_t) > 3) {
          resumen_t <- resumen_t[-1, ]
        }
        resumen_t <- cbind(Item = rownames(resumen_t), resumen_t)
        # Delete row where Item equals "Respuesta"
        resumen_t <- resumen_t[resumen_t$Item != "Respuesta", ]

        # print(resumen_t)
        # Order the columns based on the response_dict
        tipo_pregunta <- metadata_evidencia$`Tipo pregunta`[1]
        if (tipo_pregunta %in% names(response_dict)) {
          ordered_levels <- response_dict[[tipo_pregunta]]
          valid_columns <- intersect(ordered_levels, colnames(resumen_t))
          if (length(valid_columns) > 0) {
            resumen_t <- resumen_t[, c("Item", valid_columns)]
          }
        }
        # print(resumen_t)

        print("    Adding flextable to Word document")
        # Check if resumen_t is a data frame
        doc <- doc %>% body_add_par(paste("Tabla XX. ", titulo_grafico))
        if (!is.data.frame(resumen_t)) {
          resumen_t <- as.data.frame(resumen_t)
          print("  Warning: resumen_t is not a data frame")
          doc <- doc %>% body_add_par("Warning: No fue posible adjuntar la tabla al documento, seguramente todas las respuestas fueron las mismas")
        } else {
          ftab_t <- flextable(resumen_t)
          ftab_t <- autofit(ftab_t)
          # ftab_t <- width(ftab_t, width = 2.5)  # Set the table width to fit within the page margins
          doc <- doc %>% body_add_flextable(ftab_t)
        }

        # Create and add the bar plot if tipo_grafico is not "texto"
        print("    Creating bar plot") 
        if (tipo_grafico != "Texto" && tipo_grafico != "Tabla") {
          output_file <- paste0("./output/", criterio_actual, "-", evidencia_actual, ".png")
          doc <- doc %>% body_add_par(paste("Gráfico XX. ", titulo_grafico), style = "heading 3")
          plot <- create_bar_plot(resumen_t, "", "", output_file, response_dict, tipo_pregunta)
          doc <- doc %>% body_add_gg(plot, width = 6, height = 3, scale = 0.5)
        }

        doc <- doc %>% body_add_par(paste("Texto Generado: "), style="heading 3")
        texto_agente <- strsplit(agente$agente(titulo_grafico ,resumen_t, population),  split = "\n")
        # texto_agente <- "Prueba"

        for (i in 1:length(texto_agente[[1]])) {
          doc <- doc %>% body_add_par(texto_agente[[1]][i])
        }

        doc <- doc %>% body_add_break()
      }
    }
  }

  print(doc, target = paste0(tolower(population), "-porcentajes-e280.docx"))
}

# Call the function with the desired population
# process_population("Estudiantes")
process_population("Administrativos")
# process_population("Docentes")
# process_population("Empleadores")
# process_population("Graduados")
