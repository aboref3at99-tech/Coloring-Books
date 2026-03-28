import { GoogleGenAI, Modality, Type, ThinkingLevel, VideoGenerationReferenceImage, VideoGenerationReferenceType, HarmCategory, HarmBlockThreshold } from "@google/genai";

export class ApiError extends Error {
  constructor(
    public message: string,
    public type: 'QUOTA' | 'PERMISSION' | 'NOT_FOUND' | 'SERVER' | 'NETWORK' | 'UNKNOWN',
    public actionableMessage: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const parseApiError = (err: any): ApiError => {
  console.error("API Error caught by parseApiError:", err);
  const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
  
  if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
    return new ApiError(
      "تم تجاوز حصة الاستخدام",
      'QUOTA',
      "لقد وصلت إلى الحد الأقصى المسموح به حالياً. يرجى الانتظار قليلاً أو المحاولة غداً. إذا كنت تستخدم النسخة المجانية، فهناك حدود لعدد الصور والقصص يومياً.",
      err
    );
  }
  
  if (errorMsg.includes("SAFETY") || errorMsg.includes("blocked") || errorMsg.includes("safety filters") || errorMsg.includes("PROHIBITED_CONTENT")) {
    return new ApiError(
      "تم حظر المحتوى",
      'UNKNOWN',
      "نعتذر، تم حظر هذا الطلب بواسطة فلاتر الأمان. يرجى محاولة تغيير الوصف أو استخدام كلمات أبسط، أو تجربة موضوع مختلف قليلاً.",
      err
    );
  }

  if (errorMsg.includes("400") || errorMsg.includes("INVALID_ARGUMENT")) {
    return new ApiError(
      "طلب غير صالح",
      'UNKNOWN',
      "حدث خطأ في الطلب المرسل. قد يكون ذلك بسبب حجم الصورة أو تنسيق غير مدعوم، أو بسبب قيود الأمان.",
      err
    );
  }

  if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
    return new ApiError(
      "خطأ في الصلاحيات",
      'PERMISSION',
      "لا يمتلك مفتاح API الخاص بك صلاحية للوصول إلى هذا النموذج. يرجى التأكد من تفعيل الفوترة (Billing) إذا كنت تستخدم نماذج متقدمة مثل Veo أو Pro.",
      err
    );
  }

  if (errorMsg.includes("404") || errorMsg.includes("NOT_FOUND") || errorMsg.includes("Requested entity was not found")) {
    return new ApiError(
      "النموذج غير موجود",
      'NOT_FOUND',
      "النموذج المطلوب غير متاح حالياً. قد تحتاج إلى تحديث الصفحة أو إعادة اختيار مفتاح API من الإعدادات.",
      err
    );
  }

  if (errorMsg.includes("500") || errorMsg.includes("503") || errorMsg.includes("INTERNAL")) {
    return new ApiError(
      "خطأ في الخادم",
      'SERVER',
      "حدث خطأ داخلي في خوادم الذكاء الاصطناعي. يرجى المحاولة مرة أخرى بعد دقيقة واحدة.",
      err
    );
  }

  if (errorMsg.includes("fetch") || errorMsg.includes("network") || errorMsg.includes("Failed to fetch")) {
    return new ApiError(
      "خطأ في الاتصال",
      'NETWORK',
      "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.",
      err
    );
  }

  if (errorMsg.includes("MODEL_RETURNED_TEXT")) {
    const textMsg = errorMsg.split("MODEL_RETURNED_TEXT:")[1]?.trim() || "رسالة غير معروفة";
    return new ApiError(
      "لم يتم توليد الصورة",
      'UNKNOWN',
      `رد النموذج بنص بدلاً من صورة: ${textMsg}`,
      err
    );
  }

  if (errorMsg.includes("EMPTY_RESPONSE") || errorMsg.includes("No image data returned")) {
    return new ApiError(
      "لم يتم توليد الصورة",
      'UNKNOWN',
      "لم يقم الذكاء الاصطناعي بإرجاع أي صورة. قد يكون ذلك بسبب قيود المحتوى أو مشكلة مؤقتة في النموذج. يرجى المحاولة مرة أخرى.",
      err
    );
  }

  if (errorMsg.includes("oklch") || errorMsg.includes("unsupported color function") || errorMsg.includes("color-mix")) {
    return new ApiError(
      "خطأ في معالجة الملف",
      'UNKNOWN',
      "نعتذر، حدث خطأ تقني أثناء تحضير ملف PDF بسبب عدم توافق في متصفحك مع بعض الألوان الحديثة (oklch). لقد حاولنا إصلاح ذلك تلقائياً، يرجى المحاولة مرة أخرى أو استخدام متصفح Chrome للحصول على أفضل النتائج.",
      err
    );
  }

  return new ApiError(
    "حدث خطأ غير متوقع",
    'UNKNOWN',
    `نعتذر، حدث خطأ غير معروف أثناء معالجة طلبك. يرجى المحاولة مرة أخرى. (${errorMsg.substring(0, 50)}...)`,
    err
  );
};

// Helper for exponential backoff retry
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      const isRetryable = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("503") || errorMsg.includes("500") || errorMsg.includes("EMPTY_RESPONSE") || errorMsg.includes("MODEL_RETURNED_TEXT") || errorMsg.includes("PROHIBITED_CONTENT");
      
      if (isRetryable && retries < maxRetries) {
        retries++;
        const isQuota = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
        // For quota errors, wait much longer (60s base for free tier)
        const baseDelay = isQuota ? 30000 : 1000;
        const delay = Math.pow(2, retries - 1) * baseDelay + Math.random() * 1000;
        console.warn(`${isQuota ? 'Quota' : 'Retryable'} error encountered. Retrying in ${Math.round(delay)}ms (Attempt ${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw parseApiError(err);
    }
  }
};

export interface ImageGenerationParams {
  prompt: string;
  imageSize: "1K" | "2K" | "4K";
  aspectRatio?: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
  model?: string;
  avatarUrl?: string;
}

export const generateColoringImage = async (params: ImageGenerationParams) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const safePrompt = params.prompt?.trim() || "A beautiful coloring page";

  const coloringPrompt = `A high-quality, pure black and white line art coloring book page for children. 
  Subject: ${safePrompt}. 
  Style Requirements: 
  - STRICTLY black and white ONLY. No grayscale, no colors, no shading, no halftones.
  - Thick, bold, continuous black outlines.
  - Pure white background.
  - Simple, clear, and distinct shapes with large enclosed areas suitable for a 5-year-old to color.
  - Minimalist background details to keep the focus on the main subject.
  ${params.avatarUrl ? "\nIMPORTANT AVATAR INSTRUCTIONS:\n- The main character MUST resemble the child in the attached photo (facial features, hair).\n- You MUST convert the child's appearance into PURE BLACK AND WHITE LINE ART.\n- Do NOT include any colors, realistic shading, or grayscale from the original photo. Only use thick black outlines." : ""}`;

  const modelToUse = params.model || 'gemini-2.5-flash-image';

  return withRetry(async () => {
    const parts: any[] = [{ text: coloringPrompt }];
    
    if (params.avatarUrl) {
      const base64Data = params.avatarUrl.split(',')[1];
      const mimeType = params.avatarUrl.split(';')[0].split(':')[1];
      parts.unshift({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    try {
      const isPreviewModel = modelToUse === 'gemini-3.1-flash-image-preview' || modelToUse === 'gemini-3-pro-image-preview';
      
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
      ];

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: params.avatarUrl ? { parts: parts } : coloringPrompt,
        config: {
          safetySettings,
          ...(isPreviewModel ? {
            imageConfig: {
              aspectRatio: params.aspectRatio || "1:1",
              imageSize: params.imageSize
            },
          } : {})
        }
      });

      if ((response as any).promptFeedback?.blockReason) {
        throw new Error(`SAFETY_BLOCKED: Prompt was blocked. Reason: ${(response as any).promptFeedback.blockReason}`);
      }
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("EMPTY_RESPONSE: No candidates returned from the model.");
      }

      const candidate = response.candidates[0];
      if (candidate.finishReason === 'PROHIBITED_CONTENT') {
        throw new Error("PROHIBITED_CONTENT: The model generated content that was blocked by safety filters.");
      }

      if (candidate.content?.parts) {
        let textResponse = "";
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textResponse += part.text + " ";
          }
        }
        if (textResponse.trim()) {
          throw new Error(`MODEL_RETURNED_TEXT: ${textResponse.trim()}`);
        }
        console.error("No inlineData found in parts:", JSON.stringify(candidate.content.parts));
      } else {
        console.error("No parts found in response:", JSON.stringify(response));
      }
      
      // If we reach here, no image was returned (likely blocked by safety)
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error("SAFETY_BLOCKED: The content was blocked by safety filters.");
      }
      throw new Error("EMPTY_RESPONSE: No image was returned from the model.");
    } catch (err: any) {
      if (modelToUse !== 'gemini-2.5-flash-image') {
        console.warn(`Error generating with high-quality model, falling back to standard model...`, err);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: params.avatarUrl ? { parts: parts } : coloringPrompt,
          });
          if (fallbackResponse.candidates?.[0]?.content?.parts) {
            let textResponse = "";
            for (const part of fallbackResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${part.inlineData.data}`;
              } else if (part.text) {
                textResponse += part.text + " ";
              }
            }
            if (textResponse.trim()) {
              throw new Error(`MODEL_RETURNED_TEXT: ${textResponse.trim()}`);
            }
          }
          
          if (fallbackResponse.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("SAFETY_BLOCKED: The content was blocked by safety filters on fallback model.");
          }
          throw new Error("EMPTY_RESPONSE: No image was returned from the fallback model.");
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      }
      
      throw err;
    }
  });
};

export interface BookScene {
  imagePrompt: string;
  caption: string;
  captionEn: string;
}

export const generateBookScenes = async (theme: string, count: number, thinking: boolean = false, kimiKey?: string, bilingual: boolean = false, childName?: string): Promise<BookScene[]> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  
  const prompt = `Generate ${count + 1} distinct scenes for a children's coloring book with the theme: "${theme}". 
    ${childName ? `The book is for a child named "${childName}".` : ''}
    
    The VERY FIRST scene (index 0) MUST be a COVER PAGE. 
    The imagePrompt for the cover page should describe a beautiful, centered title page illustration for a coloring book about "${theme}". 
    The cover should be a complete composition with decorative elements related to the theme, all in black and white line art.
    DO NOT request any text, words, or letters in the image prompt. The image should be purely illustrative.
    
    The remaining ${count} scenes should form a COHESIVE and FUN STORY for children.
    
    For each scene (including the cover), provide:
    1. A detailed image prompt for an AI image generator. The prompt MUST explicitly request "pure black and white line art", "thick outlines", and "strictly NO shading, NO grayscale, NO colors".
    2. A short, engaging story part or descriptive label related to the scene in Egyptian Arabic dialect (اللهجة المصرية العامية) suitable for young children. Make it fun, simple, and interesting.
    ${bilingual ? '3. An English translation of the story part.' : ''}
    
    IMPORTANT: The story part MUST be in Egyptian Arabic dialect (Ammiya). ${bilingual ? 'Also provide the English translation.' : ''}
    Return the result as a JSON array of objects with "imagePrompt", "caption" ${bilingual ? ', and "captionEn"' : ''} fields.`;

  // Use Kimi if key is provided
  if (kimiKey) {
    try {
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kimiKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : (parsed.scenes || parsed.items || []);
    } catch (err) {
      console.error("Kimi error, falling back to Gemini:", err);
    }
  }

  const ai = new GoogleGenAI({ apiKey });
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: thinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          ...(thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {}),
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                imagePrompt: { type: Type.STRING },
                caption: { type: Type.STRING },
                captionEn: { type: Type.STRING }
              },
              required: ["imagePrompt", "caption", "captionEn"]
            }
          }
        }
      });

      if (!response.text) throw new Error("Failed to generate book scenes.");
      return JSON.parse(response.text);
    } catch (err: any) {
      if (thinking) {
        console.warn(`Error generating with Pro model, falling back to Flash model...`, err);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    imagePrompt: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    captionEn: { type: Type.STRING }
                  },
                  required: ["imagePrompt", "caption", "captionEn"]
                }
              }
            }
          });
          if (!fallbackResponse.text) throw new Error("Failed to generate book scenes (fallback).");
          return JSON.parse(fallbackResponse.text);
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      }
      throw err;
    }
  });
};

export const generateAvatar = async (base64Image: string) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  const prompt = `Convert this photo of a child into a simple, black and white coloring book character. 
  Style: Thick black outlines, white background, no shading, no gradients, very clear lines, simple shapes, high contrast. 
  The character should look like the child in the photo but in a cartoon coloring style.`;

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data, mimeType } },
            { text: prompt },
          ],
        },
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("EMPTY_RESPONSE: No candidates returned from the model.");
      }

      if (response.candidates?.[0]?.content?.parts) {
        let textResponse = "";
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const outMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${outMimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textResponse += part.text + " ";
          }
        }
        if (textResponse.trim()) {
          throw new Error(`MODEL_RETURNED_TEXT: ${textResponse.trim()}`);
        }
      }
      
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error("SAFETY_BLOCKED: The content was blocked by safety filters.");
      }
      throw new Error("EMPTY_RESPONSE: No image was returned from the model.");
    } catch (err: any) {
      throw err;
    }
  });
};

export interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const editColoringImage = async (base64Image: string, editPrompt: string, selection?: Selection | null, thinking: boolean = false, avatarUrl?: string) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  let finalPrompt = `Edit this coloring book page. ${editPrompt}. Keep it as a black and white coloring book page with thick outlines and white background.`;
  
  if (avatarUrl) {
    finalPrompt += " IMPORTANT: The main character in this scene MUST look exactly like the child in the attached reference photo. Maintain their facial features and appearance.";
  }

  if (selection) {
    const ymin = Math.round(selection.y * 10);
    const xmin = Math.round(selection.x * 10);
    const ymax = Math.round((selection.y + selection.h) * 10);
    const xmax = Math.round((selection.x + selection.w) * 10);
    
    finalPrompt = `In the specific area defined by the coordinates [${ymin}, ${xmin}, ${ymax}, ${xmax}], ${editPrompt}. Keep the rest of the image unchanged. Ensure the result is still a black and white coloring book page with thick outlines and white background. ${avatarUrl ? "Maintain the child's appearance from the reference photo." : ""}`;
  }

  const modelToUse = thinking ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

  return withRetry(async () => {
    const parts: any[] = [
      { inlineData: { data, mimeType } },
      { text: finalPrompt },
    ];

    if (avatarUrl) {
      const avatarMatch = avatarUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (avatarMatch) {
        parts.unshift({
          inlineData: {
            data: avatarMatch[2],
            mimeType: avatarMatch[1]
          }
        });
      }
    }

    try {
      const isPreviewModel = modelToUse === 'gemini-3.1-flash-image-preview';

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: {
          parts: parts,
        },
        ...(isPreviewModel ? {
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            },
          }
        } : {})
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("EMPTY_RESPONSE: No candidates returned from the model.");
      }

      if (response.candidates?.[0]?.content?.parts) {
        let textResponse = "";
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const outMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${outMimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textResponse += part.text + " ";
          }
        }
        if (textResponse.trim()) {
          throw new Error(`MODEL_RETURNED_TEXT: ${textResponse.trim()}`);
        }
      }
      
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error("SAFETY_BLOCKED: The content was blocked by safety filters.");
      }
      throw new Error("EMPTY_RESPONSE: No image was returned from the model.");
    } catch (err: any) {
      if (modelToUse !== 'gemini-2.5-flash-image') {
        console.warn(`Error generating with high-quality edit, falling back to standard model...`, err);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data, mimeType } },
                { text: finalPrompt },
              ],
            },
          });
          if (fallbackResponse.candidates?.[0]?.content?.parts) {
            let textResponse = "";
            for (const part of fallbackResponse.candidates[0].content.parts) {
              if (part.inlineData) {
                const outMimeType = part.inlineData.mimeType || 'image/png';
                return `data:${outMimeType};base64,${part.inlineData.data}`;
              } else if (part.text) {
                textResponse += part.text + " ";
              }
            }
            if (textResponse.trim()) {
              throw new Error(`MODEL_RETURNED_TEXT: ${textResponse.trim()}`);
            }
          }
          
          if (fallbackResponse.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("SAFETY_BLOCKED: The content was blocked by safety filters on fallback model.");
          }
          throw new Error("EMPTY_RESPONSE: No image was returned from the fallback model.");
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      }
      throw err;
    }
  });
};

export const suggestColorPalette = async (caption: string, theme: string, kimiKey?: string) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  
  const prompt = `Suggest a vibrant and child-friendly color palette for a coloring page.
      Page Caption: "${caption}"
      Overall Book Theme: "${theme}"
      
      Provide 5 specific colors with:
      1. A descriptive name in Arabic.
      2. A hex code.
      3. A brief reason why this color fits the scene in Arabic.
      
      Return the result as a JSON array of objects with "name", "hex", and "reason" fields.`;

  // Use Kimi if key is provided
  if (kimiKey) {
    try {
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kimiKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : (parsed.palette || parsed.colors || []);
    } catch (err) {
      console.error("Kimi error, falling back to Gemini:", err);
    }
  }

  const ai = new GoogleGenAI({ apiKey });
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              hex: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["name", "hex", "reason"]
          }
        }
      }
    });

    if (!response.text) throw new Error("Failed to suggest color palette.");
    return JSON.parse(response.text);
  });
};

export const translateToArabic = async (text: string): Promise<string> => {
  if (!text || text.trim() === "") return "";
  
  // Check if it's already Arabic (simple check)
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) return text;

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Translate the following text to Arabic. Provide ONLY the translated text, no explanations or extra characters.
  Text: "${text}"`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });

    if (!response.text) throw new Error("Failed to translate text.");
    return response.text.trim();
  });
};

export const magicColorImage = async (base64Image: string, prompt: string, selection?: Selection | null, palette?: { name: string, hex: string }[]) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  let finalPrompt = `You are a master artist. Color this black and white coloring book page beautifully. 
  Instructions: ${prompt}. 
  Style: Vibrant, child-friendly, high-quality digital coloring. 
  Keep the original black outlines visible but fill the white areas with colors.`;
  
  if (palette && palette.length > 0) {
    const colorsStr = palette.map(p => `${p.name} (${p.hex})`).join(", ");
    finalPrompt += `\nUse this color palette primarily: ${colorsStr}.`;
  }

  if (selection) {
    const ymin = Math.round(selection.y * 10);
    const xmin = Math.round(selection.x * 10);
    const ymax = Math.round((selection.y + selection.h) * 10);
    const xmax = Math.round((selection.x + selection.w) * 10);
    
    finalPrompt = `Color only the specific area defined by the coordinates [${ymin}, ${xmin}, ${ymax}, ${xmax}] in this coloring page. 
    Instructions for this area: ${prompt}. 
    Keep the rest of the image exactly as it is (black and white). 
    Ensure the colored area blends naturally with the outlines.`;
  }

  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data, mimeType } },
            { text: finalPrompt },
          ],
        },
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("EMPTY_RESPONSE: No candidates returned from the model.");
      }

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const outMimeType = part.inlineData.mimeType || 'image/png';
            return `data:${outMimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        throw new Error("SAFETY_BLOCKED: The content was blocked by safety filters.");
      }
      throw new Error("EMPTY_RESPONSE: No colored image was returned.");
    } catch (err: any) {
      throw err;
    }
  });
};

export const analyzeImage = async (base64Image: string, userPrompt: string = "Describe this image for a children's coloring book.") => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: userPrompt },
        ],
      },
    });

    if (!response.text) throw new Error("Failed to analyze image.");
    return response.text;
  });
};

export const startChat = (systemInstruction: string, thinking: boolean = true, kimiKey?: string) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  
  // If Kimi key is provided, return a mock chat object that uses Kimi API
  if (kimiKey) {
    let history: { role: string; content: string }[] = [
      { role: "system", content: systemInstruction }
    ];
    
    return {
      sendMessage: async (params: { message: string }) => {
        history.push({ role: "user", content: params.message });
        
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${kimiKey}`
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: history
          })
        });
        
        const data = await response.json();
        const text = data.choices[0].message.content;
        history.push({ role: "assistant", content: text });
        
        return { text };
      }
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const chat = ai.chats.create({
    model: thinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
    config: {
      systemInstruction,
      thinkingConfig: thinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined
    },
  });

  const originalSendMessage = chat.sendMessage.bind(chat);
  chat.sendMessage = async (params: any) => {
    return withRetry(async () => {
      try {
        return await originalSendMessage(params);
      } catch (err: any) {
        const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        const isPermissionError = errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED");
        const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");

        if (isPermissionError || isQuotaError) {
          console.warn(`Error ${isPermissionError ? '403' : '429'} for Pro model, falling back to Flash model...`);
          const fallbackChat = ai.chats.create({
            model: "gemini-3-flash-preview",
            config: { systemInstruction }
          });
          return await fallbackChat.sendMessage(params);
        }
        throw err;
      }
    });
  };

  return chat;
};

export const generateVideoFromImage = async (base64Image: string, prompt: string, aspectRatio: "16:9" | "9:16" = "16:9") => {
  // Create a new instance right before the call to ensure fresh API key from selection dialog
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.KIMI || process.env.KIMI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  return withRetry(async () => {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: data,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Failed to generate video");

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey || '',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Requested entity was not found. Please re-select your API key.");
      }
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  });
};
