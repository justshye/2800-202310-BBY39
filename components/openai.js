const { configuration, OpenAIApi } = require("../config");
const openai = new OpenAIApi(configuration);

async function getOpenAIResponse(prompt) {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 30,
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(completion.data.choices[0].message);
  return completion.data.choices[0].message.content;
}

async function openAI(req, res) {
  try {
    const prompt = req.query.prompt || ""; // Get the prompt from the query parameter or use an empty string as the default
    let response;
    if (prompt != "") {
      response = await getOpenAIResponse(prompt);
    } else {
      response = "";
    }
    res.render("openai", { prompt, generatedMessage: response });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { openAI };
