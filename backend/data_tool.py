from ml_service import df_final  # this imports the already-loaded DataFrame so as to avoid re-reading the 858KB CSV from disk on every chatbot tool call

def fetch_district_data(district_name: str, year: int) -> dict: #this is registered as a tool so as to allow the Gemini model to fetch real data instead of hallucinating district statistics.
    
    district_name = str(district_name).strip()  # this is cleaned so as to handle any extra whitespace that may come from how the model formats its tool arguments
    try:
        year = int(year)
    except ValueError:
        return {"status": "error", "message": f"Invalid year format: {year}"}

    match = df_final[
        (df_final['dist_name'].str.lower() == district_name.lower()) &  # case-insensitive so as to handle variations in how the model spells district names
        (df_final['year'] == year)
    ]

    if match.empty:
        return {
            "status":  "error",
            "message": f"No data found for district '{district_name}' in year {year}. Available years are 1993-2019."
        }

    row = match.iloc[0].to_dict()  #the first matching row is taken so as to handle edge cases where a district might have duplicate entries

    # only the most interpretable columns are returned so as to give the LLM focused, narratable data rather than all 20+ raw feature columns
    data_payload = {
        "district":                    row.get("dist_name"),
        "state":                       row.get("state_name"),
        "year":                        row.get("year"),
        "actual_yield_kg_ha":          row.get("yield_kg_ha"),
        "state_avg_yield":             row.get("state_avg_yield"),
        "previous_year_yield":         row.get("yield_lag1"),        # this is included so as to allow the model to comment on year-over-year trends
        "annual_rainfall_mm":          row.get("rainfall_annual"),
        "kharif_season_rainfall_mm":   row.get("rainfall_kharif"),  #kharif rainfall is the agronomically relevant season so as to explain yield variability
        "area_cultivated_hectares":    row.get("area"),
        "total_production_tonnes":     row.get("production")
    }

    return {
        "status": "success",
        "data":   data_payload
    }
