import "dotenv/config";

const models = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

export const getGeminiAIAPIResponse = async (message) => {
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    };

    try {
      console.log(`Trying Gemini model: ${model}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        options
      );

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();

        const reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
          console.log(`Response received from: ${model}`);
          return reply;
        }

        throw new Error("Gemini returned an empty response");
      }

      const errorText = await response.text();

      console.log(
        `${model} failed with status ${response.status}`
      );

      // Try next model for quota / temporary server errors
      if (response.status === 429 || response.status === 503) {
        lastError = new Error(
          `Gemini ${model} Error: ${errorText}`
        );
        continue;
      }

      // For other errors, don't unnecessarily try every model
      throw new Error(
        `Gemini ${model} Error: ${errorText}`
      );
    } catch (err) {
      clearTimeout(timeout);

      lastError = err;

      if (err.name === "AbortError") {
        console.log(`${model} request timed out`);
        continue;
      }

      console.log(`${model} Error:`, err.message);

      // Try next model for temporary/quota errors
      if (
        err.message.includes("429") ||
        err.message.includes("503")
      ) {
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
};

export default getGeminiAIAPIResponse;