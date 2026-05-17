import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib

st.set_page_config(             # setting page configuration
    page_title="Millet Yield Forecaster",
    page_icon="🌾",
    layout="wide"
)

@st.cache_data                  # loading the dataset
def load_data():
    df_millet = pd.read_csv('df_millet.csv')
    df_final  = pd.read_csv('df_final.csv')
    df_millet["year"] = df_millet["year"].astype(int)
    df_final["year"]  = df_final["year"].astype(int)
    return df_millet, df_final

@st.cache_resource          # loading the model 
def load_model():
    return joblib.load('xgb_model_v2.pkl')

df_millet, df_final = load_data()
xgb_model = load_model()


st.title("🌾 District-Level Pearl Millet Yield Forecaster")
st.markdown("**Explainable ML for India's Millet Revolution** — XGBoost + LSTM across 334 districts (1990–2019)")
st.divider()


tab1, tab2, tab3 = st.tabs(["📊 National Overview", "🗺️ District Explorer", "📈 Model Performance"])


with tab1:
    st.subheader("National Yield Trend — Pearl Millet (Bajra) 1990–2019")

    yearly_avg = df_millet.groupby('year')['yield_kg_ha'].mean().reset_index()

    fig, ax = plt.subplots(figsize=(12, 4))
    ax.plot(yearly_avg['year'], yearly_avg['yield_kg_ha'], marker='o', color='green')
    ax.set_xlabel('Year')
    ax.set_ylabel('Yield (Kg per ha)')
    ax.set_title('Average Pearl Millet Yield in India')
    ax.grid(True)
    st.pyplot(fig)

    y1990 = yearly_avg[yearly_avg['year'] == 1990]['yield_kg_ha'].values
    y2019 = yearly_avg[yearly_avg['year'] == 2019]['yield_kg_ha'].values
    if len(y1990) > 0 and len(y2019) > 0:
        col1, col2, col3 = st.columns(3)
        col1.metric("Average Yield (1990)", f"{y1990[0]:.0f} kg/ha")
        col2.metric("Average Yield (2019)", f"{y2019[0]:.0f} kg/ha")
        col3.metric("Total Improvement", f"{((y2019[0] / y1990[0]) - 1)*100:.0f}%")

    st.subheader("Average Yield by State")
    state_avg = df_millet.groupby('state_name')['yield_kg_ha'].mean().sort_values(ascending=True)
    fig2, ax2 = plt.subplots(figsize=(10, 7))
    ax2.barh(state_avg.index, state_avg.values, color='green')
    ax2.set_xlabel('Yield (Kg per ha)')
    st.pyplot(fig2)


with tab2:
    st.subheader("Explore a District")

    col1, col2 = st.columns(2)
    with col1:
        state = st.selectbox("Select State", sorted(df_millet['state_name'].unique()))
    with col2:
        districts = sorted(df_millet[df_millet['state_name'] == state]['dist_name'].unique())
        district  = st.selectbox("Select District", districts)

    dist_data = df_millet[
        (df_millet['state_name'] == state) &
        (df_millet['dist_name'] == district)
    ].sort_values('year')

    if len(dist_data) == 0:
        st.warning("No data for this district.")
    else:
        fig3, ax3 = plt.subplots(figsize=(12, 4))
        ax3.plot(dist_data['year'], dist_data['yield_kg_ha'], marker='o', color='green', label='Actual')
        ax3.set_xlabel('Year')
        ax3.set_ylabel('Yield (Kg per ha)')
        ax3.set_title(f'Pearl Millet Yield — {district}, {state}')
        ax3.legend()
        ax3.grid(True)
        st.pyplot(fig3)

        col1, col2, col3 = st.columns(3)
        col1.metric("Average Yield", f"{dist_data['yield_kg_ha'].mean():.0f} kg/ha")
        col2.metric("Best Year", f"{int(dist_data.loc[dist_data['yield_kg_ha'].idxmax(), 'year'])}")
        y2019_val = dist_data[dist_data['year'] == 2019]['yield_kg_ha'].values
        col3.metric("Latest Yield (2019)", f"{y2019_val[0]:.0f} kg/ha" if len(y2019_val) > 0 else "N/A")

        dist_final = df_final[
            (df_final['state_name'] == state) &
            (df_final['dist_name'] == district)
        ]

        if len(dist_final) > 0:
            feature_cols_rain = [
                'dist_code', 'state_code', 'year',
                'area', 'area_lag1',
                'yield_lag1', 'yield_lag2', 'yield_lag3',
                'yield_rolling3', 'yield_yoy_change',
                'state_avg_yield',
                'rainfall_jun', 'rainfall_jul', 'rainfall_aug',
                'rainfall_sep', 'rainfall_kharif', 'rainfall_annual'
            ]
            latest = dist_final[dist_final['year'] == dist_final['year'].max()]
            pred   = xgb_model.predict(latest[feature_cols_rain])[0]
            actual = latest['yield_kg_ha'].values[0]

            st.subheader("Model Prediction")
            col1, col2 = st.columns(2)
            col1.metric("XGBoost Prediction", f"{pred:.0f} kg/ha")
            col2.metric("Actual Yield", f"{actual:.0f} kg/ha")
        else:
            st.info("Rainfall data not available for this district — prediction unavailable.")


with tab3:
    st.subheader("Model Comparison — Ablation Study")

    results = {
        'Model': ['XGBoost v1 (no rainfall)', 'XGBoost v2 (with rainfall)',
                  'LSTM v1 (no rainfall)', 'LSTM v2 (with rainfall)'],
        'RMSE (kg/ha)': [114.85, 109.53, 49.70, 44.46],
        'R²': [0.9803, 0.9820, 0.9963, 0.9970],
        'MAPE (%)': [11.40, 14.27, 10.56, 14.18]
    }
    st.dataframe(pd.DataFrame(results), use_container_width=True)

    st.markdown("""
    **Key findings:**
    - LSTM outperforms XGBoost significantly on RMSE and R²
    - Adding rainfall features improves RMSE for both model families
    - Yield persistence (lag features) is the dominant predictor — confirmed by SHAP analysis
    - State average yield adds regional context as a secondary signal
    """)