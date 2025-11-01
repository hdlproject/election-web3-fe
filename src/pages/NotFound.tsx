import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-background px-4 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold">404</h1>
        <p className="text-base md:text-xl text-gray-600 dark:text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-block px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground shadow hover:shadow-lg transition hover:scale-[1.02]">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
