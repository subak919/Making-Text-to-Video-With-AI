import express from "express";
import uniqid from "uniqid";
import fs from "fs";
import path from "path";
import cors from "cors";
import { GPTScript, RunEventType } from "@gptscript-ai/gptscript";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

console.log("Loaded API Key:", process.env.OPENAI_API_KEY);

const g = new GPTScript({
  apiKey: process.env.OPENAI_API_KEY,
  DefaultModel: "gpt-3.5-turbo",
});

const app = express();
app.use(cors());

const generateImage = async (prompt, outputPath) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt,
        n: 1,
        size: "1024x1792",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const imageUrl = response.data.data[0].url;

    // Download and save the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(outputPath, imageResponse.data);
    console.log(`Image saved to ${outputPath}`);
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

app.get("/create-story", async (req, res) => {
  const url = req.query.url;
  const dir = uniqid();
  const baseDir = path.resolve("./stories");
  const targetDir = path.join(baseDir, dir);

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  console.log({ url });

  const opts = {
    input: `--url ${url} --dir ${targetDir}`,
    disableCache: true,
  };

  try {
    const run = await g.run("./storyurl.gpt", opts);

    run.on(RunEventType.Event, (ev) => {
      if (ev.type === RunEventType.CallFinish && ev.output) {
        console.log(ev.output);
      }
    });

    const result = await run.text();
    console.log("GPT Script Result:", result);

    // Paths for stories and images
    const storyPaths = [
      path.join(targetDir, "stories-1.txt"),
      path.join(targetDir, "stories-2.txt"),
      path.join(targetDir, "stories-3.txt"),
    ];

    const imagePaths = [
      path.join(targetDir, "b-roll-1.png"),
      path.join(targetDir, "b-roll-2.png"),
      path.join(targetDir, "b-roll-3.png"),
    ];

    for (let i = 0; i < storyPaths.length; i++) {
      if (fs.existsSync(storyPaths[i])) {
        const text = fs.readFileSync(storyPaths[i], "utf-8");

        // Extract and simplify the prompt
        const simplifiedPrompt = text.split(".")[0]; // 첫 문장만 사용하거나 간결히 요약
        const prompt = `An artistic depiction of: ${simplifiedPrompt}`;
        console.log(
          `Generating image for story part ${i + 1} with prompt: ${prompt}`
        );

        try {
          await generateImage(prompt, imagePaths[i]);
        } catch (error) {
          console.error(
            `Error generating image for story part ${i + 1}:`,
            error
          );
        }
      } else {
        console.warn(`Story part not found: ${storyPaths[i]}`);
      }
    }

    return res.json({
      message: "Story and images generated successfully",
      dir: targetDir,
    });
  } catch (e) {
    console.error("Error during GPTScript run:", e);
    return res.status(500).json({ error: "Failed to process request." });
  }
});

app.listen(29847, () => console.log("Listening on port 29847"));
