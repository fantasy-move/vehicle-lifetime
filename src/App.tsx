import React from 'react';

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Vehicle Life Time</h1>
      <p className="mt-4 text-xl text-gray-600">
        Welcome to your vehicle's lifetime!
      </p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
        Submit
      </button>
    </div>
  );
};

export default App;