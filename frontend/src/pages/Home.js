import React, { useState } from "react";
import { uploadAudio } from "../services/api";

const Home = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an audio file");
      return;
    }

    setLoading(true);
    try {
      const res = await uploadAudio(file);
      setResult(res);
    } catch (err) {
      alert("Upload failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Respiratory AI</h2>

      <input type="file" accept=".wav,.mp3" onChange={handleFileChange} />

      <br /><br />

      <button onClick={handleUpload}>
        {loading ? "Uploading..." : "Upload & Predict"}
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <p><b>Filename:</b> {result.filename}</p>
          <p><b>Prediction:</b> {result.prediction}</p>
          <p><b>Confidence:</b> {result.confidence}</p>
        </div>
      )}
    </div>
  );
};

export default Home;