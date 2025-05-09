import axios from "axios";
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;

export const classifyUserResponse = async (userInput: string) => {
  const decisionTree = {
    food_assistance: {
      question: "Do you have access to a food pantry?",
      options: {
        yes: "end_food_no_help",
        no: "food_resources",
      },
    },
    food_resources: {
      message: "Here are local food banks you can visit: [List of resources]",
    },
  };
  const altPrompt = `
    You are a hospital chatbot guiding underserved patients based on a decision tree.
    Decision Tree: ${JSON.stringify(decisionTree)}
    
    The patient said: "${userInput}"
    
    Which decision tree node does this response best match? Respond with only the key (e.g., "food_assistance").
  `;

  const prompt = `You are a chatbot helping hospital patients find resources like food and housing. 
  The patient said: "${userInput}". Respond with a helpful message.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.1,
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("GPT API Error:", error);
    return "Sorry, I couldn't process that.";
  }
};
