import axios from 'axios';
import React, { FormEvent, useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setLoadingMessage('Generating assets...');
    setVideoUrl(null);

    try {
      // 1단계: /create-story 요청
      const assetsResponse = await axios.get(
        `http://localhost:29847/create-story?url=${encodeURIComponent(url)}`,
      );

      const id = assetsResponse.data.dir; // 'dir' 값을 받아옵니다.
      console.log('Assets directory:', id);

      setLoadingMessage('Building your video...');

      // 2단계: /build_video 요청
      const videoResponse = await axios.get(
        `http://localhost:29847/build_video?id=${encodeURIComponent(id)}`,
      );

      setVideoUrl(videoResponse.data.video);
      setLoadingMessage('');
      window.location.href = videoResponse.data; // 생성된 동영상 URL로 이동
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error during video generation:', error.message);
        setLoadingMessage('An error occurred. Please try again.');
      } else {
        console.error('Unknown error occurred');
        setLoadingMessage('An unknown error occurred. Please try again.');
      }
    }
  }
  return (
    <>
      {loadingMessage && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center">
          <p className="text-4xl text-center">{loadingMessage}</p>
        </div>
      )}
      <main className="max-w-4xl mx-auto flex justify-center items-center min-h-screen p-4 px-1 gap-8">
        <div className="py-8 flex flex-col justify-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-br from-green-400 to-cyan-400 bg-clip-text text-transparent">
            AI가 말아주는 동영상
          </h1>
          <p className="text-lg">
            원하는 뉴스 기사 url을 복붙하여
            <br />
            손쉽게 동영상을 만들어보세요
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-4 flex items-center gap-2"
          >
            <input
              className="border-2 rounded-lg bg-transparent text-white px-2 py-1 flex-grow"
              value={url}
              onChange={(ev) => setUrl(ev.target.value)}
              type="url"
              placeholder="https://..."
            />
            <button
              type="submit"
              className="px-3 py-1 font-bold bg-cyan-700 text-slate-200 rounded-lg uppercase"
            >
              Create&nbsp;video
            </button>
          </form>
        </div>
        <div className="px-2 py-9 pr-1">
          {videoUrl ? (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              className="bg-gray-200 w-[360px] h-[300px]"
              src={`http://localhost:29847/${videoUrl}`}
              controls
              autoPlay
            />
          ) : (
            <div className="bg-gray-200 w-[360px] h-[300px] flex items-center justify-center">
              <p className="text-lg text-center text-gray-500">
                생성된 동영상이 여기에 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default App;
