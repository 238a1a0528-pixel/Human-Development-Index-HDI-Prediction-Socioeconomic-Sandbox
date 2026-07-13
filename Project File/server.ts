/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily and safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return ai;
}

// 1. API: Check Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Helper for simulated report when offline or API fails
function generateFallbackReport(
  country_name: string,
  life_expectancy: number,
  expected_schooling: number,
  mean_schooling: number,
  gni_pc: number,
  model_name: string,
  predicted_hdi: number,
  confidence_interval: string,
  reason: string
): string {
  return `> ⚠️ **System Notice**: ${reason}

### Policy Analysis Report: ${country_name} Simulated Scenario
*Generated via UN Diagnostic Analytical Engine*

**Prediction Summary:**
Under the simulated parameters, the model **${model_name || 'Standard Engine'}** outputs a predicted HDI of **${predicted_hdi}** (Confidence: ${confidence_interval || 'N/A'}).

#### Dimension Index Breakdown:
- **Health Indicator (Life Expectancy: ${life_expectancy} yrs):** Reflects a strong biological and medical services capacity.
- **Education Indicators (Expected: ${expected_schooling} yrs, Mean: ${mean_schooling} yrs):** Determines future knowledge capital. Mean schooling acts as a lagging structural index.
- **Income Indicator (GNI per Capita: $${gni_pc.toLocaleString()}):** Measures household economic capacity and capital access.

#### Policy Action Plan:
1. **Target Mean Schooling Bottlenecks:** Implement career coaching and vocational certifications for youths who leave education before secondary level.
2. **Prioritize Health Interventions:** Expand preventative health schemes to safeguard simulated lifespans.
3. **Logarithmic Income Gains:** Since the GNI index uses a logarithmic scale, larger dollar gains are required at higher levels to move the index. Invest in high-value manufacturing and service sectors to elevate GDP.`;
}

// 2. API: Generate policy recommendation report
app.post('/api/predict', async (req, res) => {
  const {
    country_name,
    life_expectancy,
    expected_schooling,
    mean_schooling,
    gni_pc,
    model_name,
    predicted_hdi,
    confidence_interval
  } = req.body;

  // Validation
  if (!country_name || !life_expectancy || !expected_schooling || !mean_schooling || !gni_pc) {
    return res.status(400).json({ error: 'Missing required HDI indicators' });
  }

  const client = getGeminiClient();

  if (!client) {
    const analyticReport = generateFallbackReport(
      country_name,
      life_expectancy,
      expected_schooling,
      mean_schooling,
      gni_pc,
      model_name,
      predicted_hdi,
      confidence_interval,
      "Offline Mode - Configure Gemini API Key in Settings to enable Live AI briefings"
    );

    return res.json({
      report: analyticReport,
      isFallback: true
    });
  }

  const prompt = `You are a Senior Policy Analyst at the United Nations Development Programme (UNDP). 
Analyze the following Human Development Index (HDI) prediction scenario and write a comprehensive, professional, and visually structured policy recommendation report in Markdown format.

Scenario details:
- Target Country: ${country_name}
- Life Expectancy at Birth: ${life_expectancy} years
- Expected Years of Schooling: ${expected_schooling} years
- Mean Years of Schooling: ${mean_schooling} years
- GNI per Capita (USD, PPP): $${gni_pc.toLocaleString()}
- ML Model Used: ${model_name}
- Predicted Composite HDI: ${predicted_hdi} (Standard UNDP classification levels: >= 0.800 is Very High, 0.700-0.799 is High, 0.550-0.699 is Medium, < 0.550 is Low)
- Prediction Confidence Interval: ${confidence_interval}

Your report must be structured in Markdown and include:
1. **Scenario Executive Summary**: Describe what this prediction means for ${country_name}'s human development classification, and whether it represents a major shift from baseline.
2. **Dimension Sensitivity Analysis**: Assess which of the three dimensions (Health/Longevity, Education, or Income/Standard of living) is the strongest driver of this HDI score, and which represents the most critical bottleneck. Discuss how GNI's logarithmic index scale impacts this.
3. **Actionable Policy Interventions**: Provide exactly 3 specific, contextual, and realistic policy recommendations to target the bottlenecks, referencing the numbers specified. Make them practical (e.g. "To raise Expected Schooling from ${expected_schooling} to 15, launch scholarship programs...").
4. **Model Trust Assessment**: Briefly explain why the ${model_name} model is appropriate for this predictive analysis and how policy makers should treat the confidence band (${confidence_interval}).

Keep the tone professional, scholarly, objective, and constructive. Use bold titles, lists, and clear spacing. DO NOT output any system logs, port info, or AI preamble. Just output the Markdown report itself.`;

  // Attempt the live API with exponential retry backoff
  let responseText = "";
  let isFallback = false;
  let lastError: any = null;

  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            temperature: 0.7
          }
        });
        responseText = response.text || "";
        if (responseText) {
          break; // Succeeded!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[HDI API] Attempt ${attempt} with model ${model} failed:`, err.message || err);
        if (attempt < 2) {
          // exponential delay: 500ms, then 1000ms
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }
    if (responseText) {
      break; // Succeeded with one of the models
    }
  }

  if (responseText) {
    return res.json({
      report: responseText,
      isFallback: false
    });
  }

  // Graceful fallback if both models and all retries failed (e.g. 503 or quota limits)
  console.error("[HDI API] All Gemini attempts exhausted. Falling back to simulated diagnostic engine.", lastError);
  const failureMessage = lastError?.message || String(lastError);
  const is503 = failureMessage.includes("503") || failureMessage.includes("demand") || failureMessage.includes("UNAVAILABLE");
  
  const notice = is503 
    ? "The live Gemini AI service is currently experiencing high demand. Falling back to the simulated diagnostic engine to avoid disruption."
    : "The live Gemini AI service is temporarily unavailable. Falling back to the simulated diagnostic engine.";

  const analyticReport = generateFallbackReport(
    country_name,
    life_expectancy,
    expected_schooling,
    mean_schooling,
    gni_pc,
    model_name,
    predicted_hdi,
    confidence_interval,
    notice
  );

  return res.json({
    report: analyticReport,
    isFallback: true
  });
});

// Configure Vite middleware or production static folder serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HDI Server] Active and listening on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start Full-Stack HDI server:", err);
});
