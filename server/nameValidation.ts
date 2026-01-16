import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface NameValidationResult {
  cvNameExtracted: string;
  normalizedCvName: string;
  normalizedAccountName: string;
  matchScore: number;
  status: "verified" | "needs_confirmation" | "mismatch";
  message: string;
}

export function normalizeName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(part => part.length > 0)
    .sort()
    .join(" ");
}

export function extractInitials(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0))
    .join("");
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateNameMatchScore(name1: string, name2: string): number {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 100;
  
  const parts1 = norm1.split(" ");
  const parts2 = norm2.split(" ");
  
  let matchedParts = 0;
  let totalParts = Math.max(parts1.length, parts2.length);
  
  for (const part1 of parts1) {
    for (const part2 of parts2) {
      if (part1 === part2) {
        matchedParts++;
        break;
      }
      if (part1.length > 1 && part2.length > 1) {
        const distance = levenshteinDistance(part1, part2);
        const maxLen = Math.max(part1.length, part2.length);
        if (distance <= Math.floor(maxLen * 0.2)) {
          matchedParts += 0.8;
          break;
        }
      }
      if (part1.charAt(0) === part2.charAt(0) && (part1.length === 1 || part2.length === 1)) {
        matchedParts += 0.5;
        break;
      }
    }
  }
  
  const partScore = (matchedParts / totalParts) * 100;
  
  const maxLen = Math.max(norm1.length, norm2.length);
  const distance = levenshteinDistance(norm1, norm2);
  const stringScore = ((maxLen - distance) / maxLen) * 100;
  
  return Math.round(partScore * 0.6 + stringScore * 0.4);
}

export async function extractNameFromCV(cvText: string): Promise<string | null> {
  try {
    const prompt = `Extract the full name of the person from this CV/resume. Return ONLY the name, nothing else. If you cannot find a clear name, return "UNKNOWN".

CV Content:
${cvText.substring(0, 3000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0,
    });

    const extractedName = response.choices[0]?.message?.content?.trim();
    
    if (!extractedName || extractedName === "UNKNOWN" || extractedName.length < 2) {
      return null;
    }
    
    return extractedName;
  } catch (error) {
    console.error("Error extracting name from CV:", error);
    return null;
  }
}

export async function validateCVName(
  cvText: string,
  accountFirstName: string | null,
  accountLastName: string | null
): Promise<NameValidationResult> {
  const accountFullName = [accountFirstName, accountLastName]
    .filter(Boolean)
    .join(" ");
  
  if (!accountFullName.trim()) {
    return {
      cvNameExtracted: "",
      normalizedCvName: "",
      normalizedAccountName: "",
      matchScore: 100,
      status: "verified",
      message: "Account name not set. CV will be processed.",
    };
  }
  
  const cvNameExtracted = await extractNameFromCV(cvText);
  
  if (!cvNameExtracted) {
    return {
      cvNameExtracted: "",
      normalizedCvName: "",
      normalizedAccountName: normalizeName(accountFullName),
      matchScore: 0,
      status: "needs_confirmation",
      message: "We couldn't extract a name from your CV. Please confirm this CV belongs to you.",
    };
  }
  
  const normalizedCvName = normalizeName(cvNameExtracted);
  const normalizedAccountName = normalizeName(accountFullName);
  const matchScore = calculateNameMatchScore(cvNameExtracted, accountFullName);
  
  let status: "verified" | "needs_confirmation" | "mismatch";
  let message: string;
  
  if (matchScore >= 80) {
    status = "verified";
    message = "Name verified successfully.";
  } else if (matchScore >= 60) {
    status = "needs_confirmation";
    message = `The name on your CV ("${cvNameExtracted}") partially matches your account name. Please confirm this CV belongs to you.`;
  } else {
    status = "mismatch";
    message = `The name on your CV ("${cvNameExtracted}") doesn't match your account name ("${accountFullName}"). Please verify you're uploading the correct CV or update your account name.`;
  }
  
  return {
    cvNameExtracted,
    normalizedCvName,
    normalizedAccountName,
    matchScore,
    status,
    message,
  };
}
