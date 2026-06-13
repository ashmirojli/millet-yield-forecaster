import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './About.css'

export default function About() {
  return (
    <>
      <Navbar />
      <main className="about-page">
        <section className="container about-header">
          <h1>The Project Journey</h1>
          <p className="about-intro">
            When my professor traced India's shift from the Green Revolution to the Millet Revolution through her article <strong>"From Green Revolution to Millet Revolution: understanding India’s transition through agri-food policies"</strong>, one question stayed with me, i.e., how well has district level yield growth actually been captured over these decades? Yield data existed, but forecasting at the district level, with real explainability? That gap became this project. This is a genuine attempt to build something that answers a question I actually had.
          </p>
        </section>

        <section className="container about-timeline">

          <div className="timeline-item">
            <div className="timeline-marker">1</div>
            <div className="timeline-content textured">
              <h3>Framing the Problem & Gathering Data</h3>
              <p>Using my background as an UG at IIT Kharagpur who has genuine interest in AIML ,I wanted to explore the potential of machine learning to accurately predict pearl millet yields across India but as someone who has always been interested in policy making I wanted to my ml model to explain itself and not be a 'black box' and thus after searching for a bit i discovered XAI (Explainable AI) which explain exactly <em>why</em> a model made those predictions.I also found that there were some studies that predicted yield at the national or state level but very few at the district level.</p>
              <p style={{ marginTop: '0.75rem' }}>Given that this is a self project, there were limitation and thus I chose to train the models only on Pearl Millet data because of its strong policy aspects.</p>
              <p style={{ marginTop: '0.75rem' }}>The foundation is 30 years of panel data from the <strong>ICRISAT District Level Database</strong> covering 334 districts (1993–2019). To capture the crucial climate signal, I geocoded every district and pulled historical monsoon data from the <strong>NASA POWER API</strong>. Feature engineering revealed that the previous year's yield (<code>yield_lag1</code>) was the strongest predictor.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">2</div>
            <div className="timeline-content textured">
              <h3>The Ablation Study (Model Building)</h3>
              <p>Instead of stopping at one model, I structured the research as a sequential ablation study—building four models where each addressed the limitations of the last:</p>
              <ul className="model-list">
                <li><strong>XGBoost v1 (R² 0.961, RMSE 152):</strong> The baseline model, which proved that historical yield was the dominant factor.</li>
                <li><strong>XGBoost v2 (R² 0.974, RMSE 118):</strong> Added hyperparameter tuning and rainfall interactions, dropping the error by 22%.</li>
                <li><strong>LSTM v1 (R² 0.989, RMSE 79):</strong> Explored deep learning with temporal sequencing (sequence length 1).</li>
                <li><strong>LSTM v2 (R² 0.997, RMSE 43):</strong> The absolute best research model, utilizing a 3-year sequence window to capture long-term trends.</li>
              </ul>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">3</div>
            <div className="timeline-content textured">
              <h3>The Product Decision: XGBoost over LSTM</h3>
              <p>Despite the LSTM v2 model being far superior on paper, I made the deliberate product decision to use <strong>XGBoost</strong> for the live dashboard. The reason was entirely about user experience and explainability.</p>
              <p style={{ marginTop: '0.75rem' }}>The dashboard requires real-time SHAP values so the chatbot can explain its predictions to the user. For tree-based models like XGBoost, SHAP computation is exact, lightning-fast, and easy to narrate. For deep learning models like LSTMs, it's slow, approximate, and computationally heavy. Sometimes the "best" model isn't the right one for production.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">4</div>
            <div className="timeline-content textured">
              <h3>Building an Agentic Chatbot (No RAG)</h3>
              <p>I evaluated using RAG (Retrieval-Augmented Generation) to search through agricultural policy PDFs, but rejected it as over-engineered for what users actually need. Users want to know specific numbers about specific districts.</p>
              <p style={{ marginTop: '0.75rem' }}>Instead, I built a <strong>Tool-Augmented Agent</strong> using Langchain and Gemini 2.5 Flash. When you ask it "What was the yield in Anantapur in 2010?", the LLM autonomously pauses, runs a custom Python tool that directly reads the exact row from the CSV, and incorporates that factual data into its natural language response. This completely eliminates hallucination.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-marker">5</div>
            <div className="timeline-content textured">
              <h3>Backend Architecture & Security</h3>
              <p>The backend is built as a stateless REST API using FastAPI. Even for a portfolio project, security was treated as a first-class requirement:</p>
              <ul className="model-list">
                <li><strong>Rate Limiting:</strong> <code>slowapi</code> protects the Gemini API credits (capped at 5 requests/minute for chat).</li>
                <li><strong>Input Validation:</strong> Pydantic strictly caps user messages to prevent memory exhaustion attacks.</li>
                <li><strong>Hardened Headers:</strong> Custom middleware injects strict HTTP security headers (nosniff, DENY framing) into every response.</li>
                <li><strong>Error Obfuscation:</strong> Internal server errors are intercepted so internal file paths or model logic never leak to the client.</li>
              </ul>
            </div>
          </div>



        </section>
      </main>
      <Footer />
    </>
  )
}
