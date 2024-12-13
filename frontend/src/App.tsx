import React from 'react';

function App() {
  return (
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
        <form className="mt-4 flex items-center gap-2">
          <input
            className="border-2 rounded-lg bg-transparent text-white px-2 py-1 flex-grow"
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
        <div className="bg-gray-200 w-[360px] h-[300px]" />
      </div>
    </main>
  );
}

export default App;
