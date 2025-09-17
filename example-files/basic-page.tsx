import React from 'react';

// Define a functional component named HomePage
function HomePage() {
  return (
    <div>
      <h1>Welcome to My React Appp!</h1>
      <p>This is example of simple React page.</p>
      <button onClick={() => alert('Hello from React!')}>Clike Me</button>
    </div>
  );
}

// Export the component as the default export
export default HomePage;