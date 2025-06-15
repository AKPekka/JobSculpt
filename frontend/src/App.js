import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Button } from './components/ui/Button'; // Ensure this path is correct

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDropResume = useCallback((acceptedFiles) => {
    setResumeFile(acceptedFiles[0]);
  }, []);

  const onDropJobDescription = useCallback((acceptedFiles) => {
    setJobDescriptionFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps } = useDropzone({
    onDrop: onDropResume,
    accept: 'application/pdf',
  });

  const { getRootProps: getJdRootProps, getInputProps: getJdInputProps } = useDropzone({
    onDrop: onDropJobDescription,
    accept: 'application/pdf',
  });

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError('Please upload a resume.');
      return;
    }
    if (!jobDescriptionFile && !jobDescriptionText) {
      setError('Please upload or paste a job description.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (jobDescriptionFile) {
      formData.append('jobDescription', jobDescriptionFile);
    } else {
      formData.append('jobDescriptionText', jobDescriptionText);
    }

    try {
      const response = await axios.post('http://localhost:3001/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold">Resume Optimizer</h1>
          <p className="text-lg text-gray-400">
            Get instant feedback on your resume against a job description.
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column for Uploads */}
          <div className="space-y-6">
            <div
              {...getResumeRootProps()}
              className="p-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer bg-white/10 backdrop-blur-md"
            >
              <input {...getResumeInputProps()} />
              <p>
                {resumeFile ? `Resume: ${resumeFile.name}` : 'Drop your resume here, or click to select'}
              </p>
            </div>

            <div
              {...getJdRootProps()}
              className="p-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer bg-white/10 backdrop-blur-md"
            >
              <input {...getJdInputProps()} />
              <p>
                {jobDescriptionFile
                  ? `Job Description: ${jobDescriptionFile.name}`
                  : 'Drop job description PDF, or click to select'}
              </p>
            </div>

            <textarea
              className="w-full p-4 rounded-lg bg-white/10 backdrop-blur-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="6"
              placeholder="Or paste the job description here..."
              value={jobDescriptionText}
              onChange={(e) => setJobDescriptionText(e.target.value)}
            />

            <Button onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>

          {/* Right Column for Results */}
          <div className="space-y-6">
            {loading && (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
            {analysisResult && (
              <div className="p-6 rounded-lg bg-white/10 backdrop-blur-md border border-gray-600">
                <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">Match Score</h3>
                    <p>{analysisResult.match_score}</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Recommendations</h3>
                    <ul className="list-disc list-inside">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Rewritten Bullets</h3>
                    <ul>
                      {Object.entries(analysisResult.rewritten_bullets).map(([oldB, newB], index) => (
                        <li key={index}>
                          <strong>Old:</strong> {oldB} <br /> <strong>New:</strong> {newB}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Summary</h3>
                    <p>{analysisResult.summary}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
