import React from 'react';

// Define a functional component named HomePage
function HomePage() {
  return (
    <div>
      <h1>Welcome to My React App!</h1>
      <p>This is an example of a simple React page.</p>
      <button onClick={() => alert('Hello from React!')}>Clik Me</button>
    </div>
  );
}

// Export the component as the default export
export default HomePage;