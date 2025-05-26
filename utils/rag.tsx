import Constants from "expo-constants";
import { OpenAI } from "openai";
import {
  ResourceCategory,
  RetrievalResult,
  SocialResource,
  SocialResourceDatabase,
} from "./process_resources";

import { Responses } from "@/app/survey";

interface UserQuery {
  text: string;
  location?: string;
  urgency?: "low" | "medium" | "high";
  categories?: ResourceCategory[];
}

interface AgentResponse {
  message: string;
  resources: RetrievalResult[];
  followUpQuestions?: string[];
  urgentNotice?: string;
}

class SocialResourceAgent {
  private database: SocialResourceDatabase;
  private openai: OpenAI;
  private conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [];
  private followUpQuestions: string[] = [];
  private background: Responses;

  constructor(
    database: SocialResourceDatabase,
    openaiApiKey: string,
    responses: Responses
  ) {
    this.database = database;
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.background = responses;
  }

  async processQuery(query: UserQuery): Promise<string> {
    let response: AgentResponse;
    if (query.text === "first!!!") {
      response = await this.generateResponse(query, []);
      this.conversationHistory.push({
        role: "assistant",
        content: response.message,
      });
    } else {
      // Parse and understand the query
      const parsedQuery = await this.parseQuery(query);

      // Retrieve relevant resources
      const retrievalResults = await this.database.searchResources(parsedQuery);

      // Generate contextual response
      response = await this.generateResponse(query, retrievalResults);
      this.conversationHistory.push(
        { role: "user", content: query.text },
        { role: "assistant", content: response.message }
      );
    }
    // Update conversation history

    return response.message;
  }

  private async parseQuery(query: UserQuery): Promise<UserQuery> {
    // Use LLM to better understand the query and extract intent
    const systemPrompt = `You are a hospital chatbot guiding underserved patients to find social services resources.
    Analyze the user's query and identify:
    1. What type of help they need (food, housing, healthcare, etc.)
    2. Any location mentioned
    3. Urgency level
    4. Special circumstances or requirements
    
    Respond with a JSON object containing the analysis.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Message: " +
              query.text +
              (query.location ? `\nLocation: ${query.location}` : ""),
          },
        ],
        temperature: 0.1,
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      // Enhance the original query with AI insights
      return {
        ...query,
        categories: this.mapCategories(analysis.categories || []),
        location: analysis.location || query.location,
        urgency: analysis.urgency || query.urgency,
      };
    } catch (error) {
      console.error("Error parsing query:", error);
      return query; // Return original query if parsing fails
    }
  }

  private mapCategories(categories: string[]): ResourceCategory[] {
    const categoryMap: { [key: string]: ResourceCategory } = {
      food: ResourceCategory.FOOD,
      housing: ResourceCategory.HOUSING,
      shelter: ResourceCategory.HOUSING,
      healthcare: ResourceCategory.HEALTHCARE,
      medical: ResourceCategory.HEALTHCARE,
      job: ResourceCategory.EMPLOYMENT,
      employment: ResourceCategory.EMPLOYMENT,
      work: ResourceCategory.EMPLOYMENT,
      transport: ResourceCategory.TRANSPORTATION,
      transportation: ResourceCategory.TRANSPORTATION,
      childcare: ResourceCategory.CHILDCARE,
      "mental health": ResourceCategory.MENTAL_HEALTH,
      counseling: ResourceCategory.MENTAL_HEALTH,
      legal: ResourceCategory.LEGAL,
      education: ResourceCategory.EDUCATION,
    };

    return categories.map((cat) => categoryMap[cat.toLowerCase()]);
    // .filter(Boolean);
  }

  private async generateResponse(
    query: UserQuery,
    results: RetrievalResult[]
  ): Promise<AgentResponse> {
    const history = this.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");
    if (query.text === "first!!!") {
      const systemPrompt = `You are a compassionate social services assistant helping people find resources in a hospital/clinic. 
                            Based on the user's background, send an intro message that:
                            1. Acknowledges their situation with empathy, but not excessively or repetitively throughout the conversation
                            2. Provides actionable next steps if applicable
                            3. Offers encouragement and support, but not excessively or repetitively throughout the conversation
                            4. Asks follow-up questions, but only as necessary to clarify the user's needs

                            Keep your tone warm, professional, and hopeful.`;
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `User background: ${JSON.stringify(this.background)}`,
            },
          ],
          temperature: 0.2,
        });

        const message =
          response.choices[0].message.content ||
          "Sorry, I'm having trouble finding resources for you right now. Please try again later.";

        return {
          message,
          resources: [],
          followUpQuestions: this.followUpQuestions,
        };
      } catch (error) {
        console.error("Error generating response:", error);
        return {
          message:
            "Sorry, I'm having trouble finding resources for you right now. Please try again later.",
          resources: [],
        };
      }
    } else if (results.length === 0) {
      const systemPrompt = `You are a compassionate social services assistant helping people find resources in a hospital/clinic. 
                            Based on the user's background, the user's request, and the conversation history, provide a helpful, empathetic response that answers their query.
                            1. Acknowledge their situation with empathy, but not excessively or repetitively throughout the conversation
                            2. Provide actionable next steps if applicable
                            3. Offer encouragement and support, but not excessively or repetitively throughout the conversation
                            4. Ask follow-up questions, but only as necessary to clarify the user's needs
                            5. Make sure to use the conversation history and background information for context and to avoid repetition of similar statements

                            Keep your tone warm, professional, and hopeful.`;
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `User request: ${
                query.text
              }\n\nConversation history:\n${history}\n\nFollow up questions as needed: ${this.followUpQuestions.join(
                ", "
              )}\n\nUser background: ${JSON.stringify(this.background)}`,
            },
          ],
          temperature: 0.2,
        });

        const message =
          response.choices[0].message.content ||
          "Sorry, I'm having trouble finding resources for you right now. Please try again later.";

        const urgentKeywords = [
          "emergency",
          "urgent",
          "immediate",
          "crisis",
          "homeless",
          "hungry",
        ];
        const isUrgent = urgentKeywords.some((keyword) =>
          query.text.toLowerCase().includes(keyword)
        );

        this.followUpQuestions = [
          "What city or area are you located in?",
          "Is this an urgent need?",
          "Are there any specific requirements or preferences you have?",
        ].concat(this.generateFollowUpQuestions(query, results));

        return {
          message: message,
          resources: [],
          urgentNotice: isUrgent
            ? "If this is an emergency, please call 911. For immediate crisis support, contact 211 by dialing 2-1-1."
            : undefined,
          followUpQuestions: this.followUpQuestions,
        };
      } catch (error) {
        console.error("Error generating response:", error);
        return {
          message:
            "Sorry, I'm having trouble finding resources for you right now. Please try again later.",
          resources: [],
        };
      }
    } else {
      // Create context for the LLM
      const resourceContext = results
        .slice(0, 5)
        .map(
          (result) =>
            `Resource: ${result.resource.name}
      Description: ${result.resource.description}
      Services: ${result.resource.services.join(", ")}
      Location: ${result.resource.location.address}, ${
              result.resource.location.city
            }, ${result.resource.location.state}
      Contact: ${result.resource.contact.phone || "N/A"} | ${
              result.resource.contact.website || "N/A"
            }
      Hours: ${result.resource.hours}
      Requirements: ${result.resource.requirements.join(", ")}
      Match Reason: ${result.matchReason}`
        )
        .join("\n\n");

      const systemPrompt = `You are a compassionate social services assistant helping people find resources in a hospital/clinic. 
                            Based on the user's request, the retrieved resources, and the conversation history, provide a helpful, empathetic response that:
                            1. Acknowledges their situation with empathy, but not excessively or repetitively throughout the conversation
                            2. Presents the most relevant resources and necessary details (contact info, location, services, etc.) in a clear, concise, organized manner
                            3. Provides actionable next steps
                            4. Offers encouragement and support, but not excessively or repetitively throughout the conversation
                            5. Asks follow-up questions, but only as necessary to clarify the user's needs
                            6. Makes sure to use the conversation history for context and to avoid repetition of similar statements

                            Keep your tone warm, professional, and hopeful. Focus on the most relevant 2-3 resources.`;

      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `User request: ${
                query.text
              }\n\nAvailable resources:\n${resourceContext}\n\nConversation history:\n${history}\n\nFollow up questions as needed: ${this.followUpQuestions.join(
                ", "
              )}`,
            },
          ],
          temperature: 0.2,
        });

        const message =
          response.choices[0].message.content ||
          "I'm here to help you find the resources you need.";

        // Check for urgent situations
        const urgentKeywords = [
          "emergency",
          "urgent",
          "immediate",
          "crisis",
          "homeless",
          "hungry",
        ];
        const isUrgent = urgentKeywords.some((keyword) =>
          query.text.toLowerCase().includes(keyword)
        );

        this.followUpQuestions = this.generateFollowUpQuestions(query, results);

        return {
          message,
          resources: results.slice(0, 5),
          urgentNotice: isUrgent
            ? "If this is an emergency, please call 911. For immediate crisis support, contact 211 by dialing 2-1-1."
            : undefined,
        };
      } catch (error) {
        console.error("Error generating response:", error);
        return {
          message:
            "I found some resources that might help you. Let me share the details.",
          resources: results.slice(0, 3),
          followUpQuestions: [
            "Would you like more information about any of these resources?",
          ],
        };
      }
    }
  }

  private generateFollowUpQuestions(
    query: UserQuery,
    results: RetrievalResult[]
  ): string[] {
    const questions: string[] = [];

    if (!query.location && results.length > 0) {
      questions.push(
        "Would you like me to find resources closer to a specific area?"
      );
    }

    if (results.length > 3) {
      questions.push("Would you like to see more options?");
    }

    if (results.some((r) => r.resource.requirements.length > 0)) {
      questions.push("Do you have questions about eligibility requirements?");
    }

    questions.push("Is there anything else I can help you find?");

    return questions.slice(0, 3);
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

class SocialResourceSystem {
  private database: SocialResourceDatabase;
  private agent: SocialResourceAgent;

  constructor(responses: Responses) {
    const openaiApiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;
    this.database = new SocialResourceDatabase(openaiApiKey);
    this.agent = new SocialResourceAgent(
      this.database,
      openaiApiKey,
      responses
    );
  }

  async handleUserQuery(queryText: string, location?: string): Promise<string> {
    const query: UserQuery = {
      text: queryText,
      location: location,
    };

    return await this.agent.processQuery(query);
  }

  async addResource(
    resource: Omit<SocialResource, "embedding">
  ): Promise<void> {
    await this.database.addResource(resource as SocialResource);
  }

  getDatabase(): SocialResourceDatabase {
    return this.database;
  }
}

export {
  ResourceCategory,
  SocialResourceAgent,
  SocialResourceDatabase,
  SocialResourceSystem,
  type AgentResponse,
  type SocialResource,
  type UserQuery,
};
