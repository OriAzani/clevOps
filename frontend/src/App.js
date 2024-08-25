import React, { useState } from "react";
import axios from "axios";

const baseUrl = "http://localhost:4000/";
const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async () => {
    const url = baseUrl + "file/uploadFile";
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFilename(res.data);
    } catch (err) {
      console.error("Failed uploading file", err);
    }
  };

  const addJob = async () => {
    const url = baseUrl + "queue/addJob";
    try {
      const response = await axios.post(url, {
        filename,
      });
      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error making POST request:", error);
    }
  };

  return (
    <div>
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleSubmit}>Submit</button>
      </div>

      {filename ? (
        <div>
          <button onClick={addJob}>Add job</button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default FileUpload;
