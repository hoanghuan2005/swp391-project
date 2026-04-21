import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1 className="text-green-500 text-3xl font-bold">Hello Tailwind</h1>
    </>
  );
}

export default App;
