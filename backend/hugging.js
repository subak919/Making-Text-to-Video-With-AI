import express from "express";
import uniqid from "uniqid";
import fs from "fs";
import path from "path";
import cors from "cors";
import axios from "axios";
import * as dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://your-vercel-frontend.vercel.app",
    ], // 수정된 부분: 프론트엔드 URL 추가
  })
);
app.use(express.static("stories"));

// ffmpeg 및 ffprobe 경로 설정
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

console.log("Loaded Hugging Face API Key:", process.env.HUGGINGFACE_API_KEY);

const PORT = process.env.PORT || 29847; // 수정된 부분: 포트를 환경 변수로 설정

// 이미지 생성 함수
const generateImageHF = async (prompt, outputPath) => {
  let retryCount = 0;
  const maxRetries = 5; // 최대 재시도 횟수

  while (retryCount < maxRetries) {
    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
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
      return; // 성공 시 반환
    } catch (error) {
      if (error.response?.status === 503) {
        console.warn("Server unavailable. Retrying...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 대기
        retryCount++;
      } else {
        console.error("Error generating image:", error.message);
        throw error; // 다른 오류는 그대로 throw
      }
    }
  }

  throw new Error("Max retries reached for image generation");
};

// /create-story 엔드포인트
app.get("/create-story", async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

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
    // Mock story generation
    const stories = [
      "Facilities in Texas border counties.",
      "Challenges include financial and legal obstacles.",
      "Opposition from rights groups and protests ahead.",
    ];

    stories.forEach((story, index) => {
      fs.writeFileSync(storyPaths[index], story);
      console.log(`Wrote to ${storyPaths[index]}: ${story}`);
    });

    // 이미지 생성
    for (let i = 0; i < storyPaths.length; i++) {
      if (fs.existsSync(storyPaths[i])) {
        const text = fs.readFileSync(storyPaths[i], "utf-8").trim();
        const prompt = `Artistic depiction: ${text}`;
        console.log(
          `Generating image for story part ${i + 1} with prompt: ${prompt}`
        );
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

// /build_video 엔드포인트
app.get("/build_video", async (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  const pathToDir = decodeURIComponent(id);
  if (!fs.existsSync(pathToDir)) {
    return res.status(404).json({ error: "Directory not found" });
  }

  const images = ["b-roll-1.png", "b-roll-2.png", "b-roll-3.png"];

  try {
    // 비디오 생성 로직
    for (let i = 0; i < images.length; i++) {
      const inputImage = path.join(pathToDir, images[i]);
      const outputVideo = path.join(pathToDir, `output_${i}.mp4`);

      console.log(`Processing: ${inputImage}`);

      await new Promise((resolve, reject) => {
        ffmpeg()
          .setFfmpegPath(ffmpegPath)
          .input(inputImage)
          .loop(5)
          .on("error", reject)
          .on("end", resolve)
          .save(outputVideo);
      });

      console.log(`${outputVideo} is complete`);
    }

    // 비디오 병합 로직
    const finalVideo = path.join(pathToDir, "final.mp4");
    await new Promise((resolve, reject) => {
      ffmpeg()
        .setFfmpegPath(ffmpegPath)
        .input(path.join(pathToDir, "output_0.mp4"))
        .input(path.join(pathToDir, "output_1.mp4"))
        .input(path.join(pathToDir, "output_2.mp4"))
        .on("error", reject)
        .on("end", resolve)
        .mergeToFile(finalVideo);
    });

    res.json({ videoUrl: `stories/${id}/final.mp4` });
  } catch (error) {
    console.error("Error during video creation:", error.message);
    res
      .status(500)
      .json({ error: "Failed to create video", details: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => console.log(`Listening on port ${PORT}`)); // 수정된 부분: 환경 변수 포트 사용
