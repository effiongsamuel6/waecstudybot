const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { message, topic, conversationHistory } = JSON.parse(event.body);

    if (!message || !topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message or topic" }),
      };
    }

    // System prompt for Socratic math tutoring
    const systemPrompt = `You are an expert WAEC mathematics tutor with a gift for explaining complex concepts clearly. Your role is to help students understand mathematical concepts deeply, not just memorize formulas.

WAEC Topics you cover: Algebra, Geometry, Trigonometry, Calculus, Statistics, Number Theory, Functions, Sequences and Series, Vectors, Complex Numbers, Logarithms, Quadratic Equations, Polynomials, Inequalities, Circle Theorems, Matrices, and more.

YOUR TEACHING APPROACH:
1. Explain the concept step-by-step with real examples
2. Use simple language — no jargon without explanation
3. Show WHY the concept works, not just HOW
4. Connect new concepts to things the student already knows
5. Always end with a guiding question to check understanding

CRITICAL: After your explanation, ALWAYS ask a follow-up question that:
- Tests whether the student understands the core idea
- Guides them toward deeper insight
- Cannot be answered by simple memorization
- Is encouraging, not gatekeeping

Format your response as:
[Your clear explanation here, with examples and steps]

---
**Check your understanding:** [Your Socratic question here]

Keep explanations concise but thorough. Use mathematical notation where helpful (e.g., y = mx + b). Avoid overwhelming with too much at once.`;

    // Build messages array from conversation history
    const messages = conversationHistory || [];
    messages.push({
      role: "user",
      content: `Topic: ${topic}\n\nStudent: ${message}`,
    });

    // Call Claude with streaming
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: assistantMessage,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      }),
    };
  } catch (error) {
    console.error("Error calling Claude:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to get explanation",
      }),
    };
  }
};
