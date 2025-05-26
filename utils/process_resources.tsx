import rawResources from "@/assets/resources.json";
import { UserQuery } from "@/utils/rag";
import { OpenAI } from "openai";

export interface RetrievalResult {
  resource: SocialResource;
  relevanceScore: number;
  matchReason: string;
}

class TextProcessor {
  static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  static extractKeywords(text: string): string[] {
    const stopWords = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);
    return this.tokenize(text).filter((word) => !stopWords.has(word));
  }
}

class EmbeddingService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      // Fallback to simple hash-based embedding for demo
      return this.createSimpleEmbedding(text);
    }
  }

  private createSimpleEmbedding(text: string): number[] {
    const tokens = TextProcessor.tokenize(text);
    const embedding = new Array(384).fill(0);

    tokens.forEach((token, index) => {
      const hash = this.simpleHash(token);
      embedding[hash % 384] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map((val) => val / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export interface SocialResource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  services: string[];
  eligibility: string[];
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  hours: string;
  requirements: string[];
  waitTime?: string;
  capacity?: number;
  lastUpdated: Date;
  embedding?: number[];
}

export enum ResourceCategory {
  FOOD = "food",
  HOUSING = "housing",
  HEALTHCARE = "healthcare",
  EMPLOYMENT = "employment",
  TRANSPORTATION = "transportation",
  CHILDCARE = "childcare",
  MENTAL_HEALTH = "mental_health",
  SUBSTANCE_ABUSE = "substance_abuse",
  LEGAL = "legal",
  EDUCATION = "education",
}

export class SocialResourceDatabase {
  private resources: Map<string, SocialResource> = new Map();
  private embeddingService: EmbeddingService;
  private categoryIndex: Map<ResourceCategory, Set<string>> = new Map();
  private locationIndex: Map<string, Set<string>> = new Map();

  constructor(openaiApiKey: string) {
    this.embeddingService = new EmbeddingService(openaiApiKey);
    this.initializeResources();
    this.initializeIndexes();
  }

  async initializeResources(): Promise<void> {
    const resources = rawResources as Omit<SocialResource, "embedding">[];
    const parsedResources: Omit<SocialResource, "embedding">[] = resources.map(
      (r) => ({
        ...r,
        category: r.category as ResourceCategory,
        lastUpdated: new Date(r.lastUpdated),
      })
    );

    for (const resource of parsedResources) {
      await this.addResource(resource as SocialResource);
    }
  }

  private initializeIndexes() {
    Object.values(ResourceCategory).forEach((category) => {
      this.categoryIndex.set(category as ResourceCategory, new Set());
    });
  }

  async addResource(resource: SocialResource): Promise<void> {
    // Generate embedding for the resource
    const searchableText = `${resource.name} ${
      resource.description
    } ${resource.services.join(" ")} ${resource.category}`;
    resource.embedding = await this.embeddingService.generateEmbedding(
      searchableText
    );

    this.resources.set(resource.id, resource);

    // Update indexes
    this.categoryIndex.get(resource.category)?.add(resource.id);

    const locationKey = `${resource.location.city.toLowerCase()}_${resource.location.state.toLowerCase()}`;
    if (!this.locationIndex.has(locationKey)) {
      this.locationIndex.set(locationKey, new Set());
    }
    this.locationIndex.get(locationKey)?.add(resource.id);
  }

  async searchResources(query: UserQuery): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];
    const queryEmbedding = await this.embeddingService.generateEmbedding(
      query.text
    );
    const queryKeywords = TextProcessor.extractKeywords(query.text);

    for (const [id, resource] of this.resources) {
      let relevanceScore = 0;
      const matchReasons: string[] = [];

      if (resource.embedding && queryEmbedding) {
        const semanticScore = TextProcessor.cosineSimilarity(
          resource.embedding,
          queryEmbedding
        );
        relevanceScore += semanticScore * 0.6;
        if (semanticScore > 0.3) {
          matchReasons.push("semantic similarity");
        }
      }

      if (query.categories?.includes(resource.category)) {
        relevanceScore += 0.8;
        matchReasons.push("category match");
      }

      const resourceText = `${resource.name} ${
        resource.description
      } ${resource.services.join(" ")} ${resource.category}`.toLowerCase();
      const keywordMatches = queryKeywords.filter((keyword) =>
        resourceText.includes(keyword)
      );
      const keywordScore = keywordMatches.length / queryKeywords.length;
      relevanceScore += keywordScore * 0.4;
      if (keywordMatches.length > 0) {
        matchReasons.push(`keyword matches: ${keywordMatches.join(", ")}`);
      }

      if (query.location) {
        const queryLocation = query.location.toLowerCase();
        const resourceLocation =
          `${resource.location.city} ${resource.location.state}`.toLowerCase();
        if (
          resourceLocation.includes(queryLocation) ||
          queryLocation.includes(resource.location.city.toLowerCase())
        ) {
          relevanceScore += 0.3;
          matchReasons.push("location match");
        }
      }

      if (relevanceScore > 0.2) {
        results.push({
          resource,
          relevanceScore,
          matchReason: matchReasons.join(", "),
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  getResourcesByCategory(category: ResourceCategory): SocialResource[] {
    const resourceIds = this.categoryIndex.get(category) || new Set();
    return Array.from(resourceIds)
      .map((id) => this.resources.get(id)!)
      .filter(Boolean);
  }

  getAllResources(): SocialResource[] {
    return Array.from(this.resources.values());
  }
}
