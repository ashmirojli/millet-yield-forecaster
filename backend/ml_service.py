import pandas as pd
import numpy as np
import joblib
import shap
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # this resolves the path to the project root so as to work correctly regardless of where the script is run from

# these three are loaded once at server startup so as to keep them in memory and avoid slow disk reads on every API call
df_final  = pd.read_csv(os.path.join(BASE_DIR, 'data', 'processed', 'df_final.csv'))
xgb_model = joblib.load(os.path.join(BASE_DIR, 'models', 'xgb_model_v2.pkl'))
explainer = shap.Explainer(xgb_model)  # the explainer is built from the trained model so as to attribute each prediction back to its input features using SHAP values

# these are the exact 16 features the XGBoost model was trained on — the order matters so as to match the training feature matrix exactly
feature_cols = [
    'dist_code', 'state_code', 'year', 'area', 'area_lag1',
    'yield_lag1', 'yield_lag2', 'yield_lag3', 'yield_rolling3',
    'yield_yoy_change', 'rainfall_jun',
    'rainfall_jul', 'rainfall_aug', 'rainfall_sep',
    'rainfall_kharif', 'rainfall_annual'
]

def get_national_overview(): #this returns average yield per year, and average yield per state.
    yearly_trend     = df_final.groupby('year')['yield_kg_ha'].mean().reset_index()  # this aggregates across all districts so as to produce a single national average per year
    state_comparison = df_final.groupby('state_name')['yield_kg_ha'].mean().reset_index()
    state_comparison = state_comparison.sort_values('yield_kg_ha', ascending=False)  # sorted descending so as to make it easy to identify the highest-yielding states in the bar chart

    return {
        "yearly_trend":     yearly_trend.to_dict(orient="records"),
        "state_comparison": state_comparison.to_dict(orient="records")
    }

def get_locations():#this returns a dictionary mapping state_name to a list of its district_names.
    locations = {}
    for state in sorted(df_final['state_name'].dropna().unique()):  # sorted alphabetically so as to present a clean, predictable order in the frontend dropdown
        districts = sorted(df_final[df_final['state_name'] == state]['dist_name'].dropna().unique())
        locations[state] = districts
    return locations

def _get_district_data(state_name: str, district_name: str): #private helper: filters the in-memory DataFrame to a specific district so as to avoid repeating this logic across multiple public functions.
    return df_final[
        (df_final['state_name'].str.lower() == state_name.lower()) &
        (df_final['dist_name'].str.lower()  == district_name.lower())  # case-insensitive so as to handle variations in how names arrive from the URL path
    ]

def get_district_timeseries(state_name: str, district_name: str): #this returns historical yield and rainfall data for a specific district.
    dist_data = _get_district_data(state_name, district_name)

    if dist_data.empty:
        return {"error": "District not found"}

    timeseries = dist_data[['year', 'yield_kg_ha', 'rainfall_annual', 'area']].sort_values('year')  # only these four columns are sent so as to keep the API payload small and focused on what the chart needs
    return timeseries.to_dict(orient='records')

def get_district_forecast(state_name: str, district_name: str): #finds the most recent year's data point for the district, runs it through XGBoost, and returns an actual vs predicted comparison.
    dist_data = _get_district_data(state_name, district_name)

    if dist_data.empty:
        return {"error": "District not found"}

    latest_row = dist_data.loc[dist_data['year'].idxmax()]  # this selects the most recent year so as to simulate a forecast on the last known data point

    X_latest   = latest_row[feature_cols].to_frame().T.astype(float)  # transposed into a single-row DataFrame and cast to float so as to match the input dtype XGBoost expects

    prediction = xgb_model.predict(X_latest)[0]  # raw, unscaled features are passed directly since the XGBoost model was trained without feature scaling

    return {
        "year":            int(latest_row['year']),
        "actual_yield":    float(latest_row['yield_kg_ha']),
        "predicted_yield": float(prediction),
        "district":        latest_row['dist_name'],
        "state":           latest_row['state_name']
    }

def get_shap_values(state_name: str, district_name: str):  #calculates SHAP values for the most recent data point of the district so as to explain which features drove the XGBoost prediction.
    dist_data = _get_district_data(state_name, district_name)

    if dist_data.empty:
        return {"error": "District not found"}

    latest_row = dist_data.loc[dist_data['year'].idxmax()]
    X_latest   = latest_row[feature_cols].to_frame().T.astype(float)

    shap_vals = explainer(X_latest)  # this computes SHAP values using the TreeExplainer under the hood, which is exact (not approximate) for tree-based models

    impacts = []
    for i, feature in enumerate(feature_cols):
        impact_val  = float(shap_vals.values[0][i])   # shap_vals.values is a 2D array [num_samples, num_features] so index 0 gets the single row
        feature_val = float(X_latest[feature].iloc[0])

        impacts.append({
            "feature":         feature,
            "impact":          impact_val,
            "absolute_impact": abs(impact_val),  # absolute value is stored so as to allow sorting by magnitude without sign direction affecting the rank
            "value":           feature_val
        })

    impacts.sort(key=lambda x: x['absolute_impact'], reverse=True)  # sorted descending so as to put the most influential features first for the frontend chart

    return {
        "base_value": float(shap_vals.base_values[0]),  # this is the model's average prediction across the training set, used as the SHAP baseline
        "features":   impacts
    }
