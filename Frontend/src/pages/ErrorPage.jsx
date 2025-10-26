import React from "react";
import ErrorIcon from "../assets/Icons/ErrorIcon.svg";
import BackButton from "../components/BackButton";

function ErrorPage() {
  return (
    <>
      <div className="container">
        <section className="error-page">
          <img src={ErrorIcon} alt="error icon" className="error-img"/>
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
        </section>
      </div>

      <BackButton />
    </>
  );
}

export default ErrorPage;
