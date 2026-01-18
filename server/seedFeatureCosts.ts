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
    creditCost: 15,
    description: "Comprehensive feedback and scoring for interview"
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
