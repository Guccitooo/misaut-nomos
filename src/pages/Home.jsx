import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchPage from "./Search";

export default function HomePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (window.location.pathname === '/search' || window.location.pathname === '/Search') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return <SearchPage />;
}