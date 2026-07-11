import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const EXTRACT_PROMPT = `You are an expert at reading US driver's licenses and state ID cards.
Extract every visible field from the image and return them as a single JSON object.

Return ONLY valid JSON — no explanation, no markdown, no code blocks. Use "" for any field that is
unclear, not present, or unreadable.

Required JSON shape:
{
  "lastName": "UPPERCASE family name",
  "firstName": "UPPERCASE first name",
  "middleName": "UPPERCASE middle name or initial",
  "dob": "MMDDYYYY — date of birth (8 digits, no slashes)",
  "sex": "1=Male  2=Female  9=X/Unknown",
  "eyeColor": "AAMVA 3-letter code: BLK|BLU|BRO|GRY|GRN|HAZ|MAR|PNK|DIC|UNK",
  "hairColor": "AAMVA 3-letter code: BAL|BLK|BLN|BRO|GRY|GRN|RED|SDY|WHI|UNK",
  "height": "FTIN digits only — e.g. 510 = 5 ft 10 in, 600 = 6 ft 0 in",
  "weight": "weight in lbs, digits only",
  "address": "UPPERCASE street address line 1",
  "city": "UPPERCASE city name",
  "state": "2-letter state abbreviation, uppercase",
  "zip": "digits only, no hyphens (5 or 9 digits)",
  "documentNumber": "license/ID number exactly as printed",
  "documentDiscriminator": "document discriminator / inventory control number if visible, else empty",
  "vehicleClass": "vehicle class letter e.g. C, D, A",
  "restrictions": "restriction codes as printed, or NONE",
  "endorsements": "endorsement codes as printed, or NONE",
  "issueDate": "MMDDYYYY — issue date (8 digits, no slashes)",
  "expiryDate": "MMDDYYYY — expiration date (8 digits, no slashes)",
  "country": "USA"
}

Rules:
- ALL name/address fields must be UPPERCASE
- ALL dates must be exactly 8 digits in MMDDYYYY order (e.g. 03112007 for March 11 2007)
- Height must be FTIN digits only — never include feet/inch symbols
- ZIP must be digits only — strip any hyphen
- Return ONLY the raw JSON object, nothing else`;

router.post("/ocr/scan-license", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            { type: "text", text: EXTRACT_PROMPT },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";

    // Extract the JSON object from the response (handle any stray text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({ error: "Could not parse fields from image" });
      return;
    }

    const fields = JSON.parse(jsonMatch[0]) as Record<string, string>;
    res.json({ success: true, fields });
  } catch (err) {
    console.error("[OCR] error:", err);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

export default router;
