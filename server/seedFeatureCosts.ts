import { db } from "./db";
import { featureCosts, FEATURE_KEYS } from "@shared/schema";
import { eq } from "drizzle-orm";

const initialFeatureCosts = [
  {
    featureKey: FEATURE_KEYS.CV_OPTIMIZATION,
    featureName: "CV Optimization",
    creditCost: 10,
    description: "AI-powered CV analysis and optimization"
  },
  {
    featureKey: FEATURE_KEYS.START_INTERVIEW,
    featureName: "Start Interview",
    creditCost: 20,
    description: "Begin a new mock interview session"
  },
  {
    featureKey: FEATURE_KEYS.VOICE_INTERVIEW,
    featureName: "Voice Interview",
    creditCost: 20,
    description: "Voice-based interview session with adaptive AI"
  },
  {
    featureKey: FEATURE_KEYS.INTERVIEW_EVALUATION,
    featureName: "Interview Evaluation",
    creditCost: 0,
    description: "Processing interview evaluation (free with interview)"
  },
  {
    featureKey: FEATURE_KEYS.UNLOCK_RESULTS,
    featureName: "Unlock Results",
    creditCost: 15,
    description: "Unlock interview results and detailed feedback (requires paid credits)"
  }
];

export async function seedFeatureCosts(): Promise<void> {
  console.log("Seeding feature costs...");
  
  for (const feature of initialFeatureCosts) {
    const [existing] = await db
      .select()
      .from(featureCosts)
      .where(eq(featureCosts.featureKey, feature.featureKey))
      .limit(1);
    
    if (!existing) {
      await db.insert(featureCosts).values(feature);
      console.log(`  Created: ${feature.featureKey} (${feature.creditCost} credits)`);
    } else {
      console.log(`  Exists: ${feature.featureKey}`);
    }
  }
  
  console.log("Feature costs seeding complete.");
}
