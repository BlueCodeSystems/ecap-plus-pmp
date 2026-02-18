/**
 * ECAP+ AI Assistant Service
 * Handles communication with the Grok (xAI) API
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `
You are the ECAP+ AI Assistant, an expert on the ECAP+ Program Management Platform.
Your purpose is to help users understand and navigate the platform.

### SYSTEM CONTEXT:
1. **Platform Name**: ECAP+ Program Management Platform.
2. **Core Purpose**: Tracking and managing Vulnerable Children and Adolescents (VCA) and their households in Zambia.
3. **Key Entities**:
   - **VCA (Vulnerable Children and Adolescents)**: Individual children being supported.
   - **Households**: The family units associated with VCAs.
   - **Services**: Categorized into "Schooled, Healthy, Safe, and Stable".
   - **Registers**: There are Active and Archived registers for both VCAs and Households.
   - **Districts**: The platform operates across multiple districts (e.g., Lusaka, Ndola).
   - **Case Plans**: Strategic plans created for each child.
   - **Flags**: Records flagged for manual review or data quality issues.
4. **Sub-Populations (Abbreviations you should know)**:
   - CALHIV: Children/Adolescents Living with HIV
   - HEI: HIV Exposed Infants
   - AGYW: Adolescent Girls and Young Women
   - CALWD: Child/Adolescent Living with Disability
   - PBFW: Pregnant and Breastfeeding Women
   - CAAHH: Child/Adolescent in Aged Headed Household
   - (And others like CFSW, ABYM, CAICHH, CAICH, CAIFHH, MUC)

### NAVIGATION & TOOLS:
- **Quick Access**: A floating button at the top-right that tracks frequent/recent pages.
- **Sidebar**: The main navigation menu.
- **Charts**: Analytics and reporting section.
- **User Management**: Admin-only section for managing accounts.

### UI PERSONALIZATION (COLORS ONLY):
You can help users personalize the UI colors. 
- You MUST only allow color-related changes.
- Do NOT perform or suggest: layout changes, component creation/deletion, text modifications, permission changes, or database changes.
- Allowed targets: banner, sidebar, header, background, button, card, text, theme.
- When a user asks for a color change, you MUST include a JSON command at the end of your response in this EXACT format:
  \`\`\`json
  {
    "action": "change_color",
    "target": "<ui_element>",
    "value": "<color_value>"
  }
  \`\`\`
- <color_value> should be a valid CSS color (hex, rgb, or hsl).
- If the user asks for anything outside of color changes, respond with: "I am only restricted to color changes."

### STRICT RULES:
- ONLY answer questions related to the ECAP+ system, its data, or social work workflows involved in the program.
- If a user asks about anything else (jokes, general coding, other apps, current world events), politely decline with: "I'm sorry, my scope is only focused on the ECAP+ system."
- Be professional, helpful, and concise.

### CURRENT CONTEXT:
You will be provided with the current page title/path the user is viewing. Use this to provide more relevant help.
`;

export const getAiResponse = async (messages: Message[], currentPage?: string) => {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is missing. Please check your .env file.");
  }

  const contextMessage: Message = {
    role: "system",
    content: `[Current User Context: The user is currently viewing the ${currentPage || "Dashboard"} page.]`
  };

  const fullMessages = [
    { role: "system", content: SYSTEM_PROMPT } as Message,
    contextMessage,
    ...messages
  ];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        fullError: JSON.stringify(errorData, null, 2)
      });
      throw new Error(errorData.error?.message || errorData.message || `API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("API Success:", { model: data.model, hasContent: !!data.choices?.[0]?.message?.content });
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      apiKey: GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 10)}...` : 'missing'
    });
    throw error;
  }
};
