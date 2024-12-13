import express from "express";
import uniqid from "uniqid";
import fs from "fs";
import path from "path";
import cors from "cors";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

console.log("Loaded Hugging Face API Key:", process.env.HUGGINGFACE_API_KEY);

const generateImageHF = async (prompt, outputPath) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        responseType: "arraybuffer",
      }
    );

    fs.writeFileSync(outputPath, response.data);
    console.log(`Image saved to ${outputPath}`);
  } catch (error) {
    console.error(
      "Error generating image:",
      error.response?.data || error.message
    );
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

  // Mock story generation for demonstration
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

  try {
    // Generate mock story files
    fs.writeFileSync(
      storyPaths[0],
      "Texas offers Trump land for migrant 'deportation facilities'."
    );
    fs.writeFileSync(
      storyPaths[1],
      "Facilities to be built in Texas border counties."
    );
    fs.writeFileSync(
      storyPaths[2],
      "Opposition from rights groups and legal challenges ahead."
    );

    console.log(`Wrote to ${storyPaths[0]}`);
    console.log(`Wrote to ${storyPaths[1]}`);
    console.log(`Wrote to ${storyPaths[2]}`);

    // Generate images for the text parts
    for (let i = 0; i < storyPaths.length; i++) {
      if (fs.existsSync(storyPaths[i])) {
        const text = fs.readFileSync(storyPaths[i], "utf-8");
        const prompt = `Create an artistic image for: ${text}`;
        console.log(
          `Generating image for story part ${i + 1} with prompt: ${prompt}`
        );
        try {
          await generateImageHF(prompt, imagePaths[i]);
        } catch (error) {
          console.error(
            `Error generating image for story part ${i + 1}:`,
            error.message
          );
        }
      } else {
        console.warn(`Story part not found: ${storyPaths[i]}`);
      }
    }

    res.json({
      message: "Story and images generated successfully",
      dir: targetDir,
    });
  } catch (error) {
    console.error("Error during story creation:", error);
    res.status(500).json({ error: "Failed to generate story and images." });
  }
});

app.listen(29847, () => console.log("Listening on port 29847"));
