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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" }),
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

    // Build messages array
    const messages = conversationHistory || [];
    messages.push({
      role: "user",
      content: `Topic: ${topic}\n\nStudent: ${message}`,
    });

    // Call Claude API directly via fetch
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to call Claude API");
    }

    const data = await response.json();

    const assistantMessage = data.content[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: assistantMessage,
        usage: {
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
        },
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to get explanation",
      }),
    };
  }
};
