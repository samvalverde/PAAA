process_col_names <- function(data) {
  print("Starting process_col_names")
  # Extract column names
  col_names <- colnames(data)
  # Separate the first dot from the rest
  splited_names <- strsplit(col_names, "\\.", fixed = FALSE)
  codes_cols <- lapply(splited_names, function(x) x[1])
  names_cols <- lapply(splited_names, function(x) paste(x[-1], collapse = "."))
  all_responses <- sapply(data, function(x) paste(unique(x), collapse = ", "))
  # Convert to data frame
  df <- data.frame(
    codes = unlist(codes_cols), 
    names = unlist(names_cols), 
    responses = all_responses, 
    stringsAsFactors = FALSE)
  print("Finished process_col_names")
  return(df)
}

create_bar_plot <- function(data, title, source, output_file, response_dict, tipo_pregunta) {
  # Create the composition bar plot
  colors <- c("#002072", "#009ddb", "#78bad4", "#bcccd2", "#708086", "#3d5c68")

  print("Starting create_bar_plot")
  # Convert data to long format for ggplot
  data_long <- data %>%
    pivot_longer(cols = -Item, names_to = "Respuestas", values_to = "Porcentaje")

  # Ensure the Porcentaje column is numeric
  data_long <- data_long %>%
    mutate(Porcentaje = as.numeric(Porcentaje))

  # Ensure all factors are included, even if they have 0 values
  data_long <- data_long %>%
    complete(Item, Respuestas, fill = list(Porcentaje = 0))

  # Ensure the labels respect the order in the graph
  if (tipo_pregunta %in% names(response_dict)) {
    ordered_levels <- response_dict[[tipo_pregunta]]
    data_long$Respuestas <- factor(data_long$Respuestas, levels = ordered_levels)
  } else {
    data_long$Respuestas <- factor(data_long$Respuestas, levels = unique(data_long$Respuestas))
  }

  # Add this line to ensure the order respects the response dictionary
  if ("Item" %in% colnames(data)) {
    data_long$Item <- factor(data_long$Item, levels = unique(data$Item))
  }

  # Check if there is only one row in the original data
  if (nrow(data) == 1) {
    bar_plot <- ggplot(data_long, aes(x = Respuestas, y = Porcentaje, fill = Respuestas)) +
      geom_bar(stat = "identity") +
      # geom_text(aes(label = ifelse(Porcentaje > 5, paste0(round(Porcentaje, 1), "%"), "")), 
      #           position = position_stack(vjust = 0.5), size = 3, color = "white") +
      scale_fill_manual(values = colors) +
      labs(
        title = title,
        x = NULL,
        y = "Porcentaje",
        fill = "Respuestas"
      ) +
      theme_minimal() +
      theme(
        plot.title = element_text(hjust = 0.5, face = "bold"),
        axis.text.y = element_text(size = 14), # Increase y-axis text size
        axis.text.x = element_text(size = 12), # Increase x-axis text size
        legend.position = "top",
        legend.text = element_text(size = 12), # Increase legend text size
        legend.title = element_text(size = 14), # Increase legend title size
        panel.grid.major.y = element_blank(), # Cleaner grid
        plot.margin = margin(20, 20, 20, 20)
      )
  } else {
    bar_plot <- ggplot(data_long, aes(x = Item, y = Porcentaje, fill = Respuestas)) +
      geom_bar(stat = "identity", position = "fill") +
      geom_text(aes(label = ifelse(Porcentaje > 5, paste0(round(Porcentaje, 1), "%"), "")), 
                position = position_fill(vjust = 0.5), size = 3, color = "white") +
      coord_flip() + # Horizontal bars
      scale_fill_manual(values = colors) + # Use the defined colors palette
      scale_y_continuous(labels = scales::percent_format(scale = 100)) + # Show y-axis as percentages
      labs(
        title = title,
        x = NULL,
        y = "Porcentaje",
        fill = "Respuestas"
      ) +
      theme_minimal() +
      theme(
        plot.title = element_text(hjust = 0.5, face = "bold"),
        axis.text.y = element_text(size = 14), # Increase y-axis text size
        axis.text.x = element_text(size = 12), # Increase x-axis text size
        legend.position = "top",
        legend.text = element_text(size = 12), # Increase legend text size
        legend.title = element_text(size = 14), # Increase legend title size
        panel.grid.major.y = element_blank(), # Cleaner grid
        plot.margin = margin(20, 20, 20, 20)
      )
  }

  # Finalize and save the plot
  finalise_plot(bar_plot, source, output_file, 1200, 800)
  return(bar_plot)
}

map_elements <- function(input_list, mapping_lc) {
  
  # Use sapply to apply the mapping to each element in the input list
  mapped_list <- lapply(input_list, function(x) {
    # Check if the element is in the mapping and replace it, otherwise keep it as is
    print(x)
    value <- trimws(x)
    value <- gsub("[\u00A0]", "", value)
    if(value %in% names(mapping_lc)) {
      return(mapping_lc[[value]])
    } else {
      return(value)
    }
  })

  # Convert the result back to a list
  print(mapped_list)
  return(mapped_list)
}

normalize_responses <- function(column, dict) {
  print("        Starting normalize_responses")
  result <- sapply(column, function(x) ifelse(x %in% names(dict), dict[[x]], x), USE.NAMES = FALSE)
  print("        Finished normalize_responses")
  return(result)
}

procesar_tabla_evidencia <- function(data, mapping_lc) {
  
}


