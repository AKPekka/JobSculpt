import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, ChevronRight, BarChart2, Zap, FileCheck } from 'lucide-react';

const ScoreCircle = ({ score }) => {
  const numericScore = parseInt(score) || 0;
  const circumference = 2 * Math.PI * 45; // r = 45
  const offset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="score-circle">
      <svg>
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-secondary)" />
            <stop offset="100%" stopColor="var(--accent-primary)" />
          </linearGradient>
        </defs>
        <circle className="score-circle-bg" cx="50%" cy="50%" r="45" />
        <circle
          className="score-circle-fg"
          cx="50%"
          cy="50%"
          r="45"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-text text-3xl">
        {numericScore}<span className="text-xl text-text-secondary">%</span>
      </div>
    </div>
  );
};

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  const onDrop = useCallback((acceptedFiles, setFile) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps, isDragActive: isResumeDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, setResumeFile),
    accept: { 'application/pdf': ['.pdf'] }
  });

  const { getRootProps: getJdRootProps, getInputProps: getJdInputProps, isDragActive: isJdDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, setJobDescriptionFile),
    accept: { 'application/pdf': ['.pdf'] }
  });

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError('A resume is required to begin analysis.');
      return;
    }
    if (!jobDescriptionFile && !jobDescriptionText) {
      setError('A job description is required for comparison.');
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysisResult(response.data);
      setActiveTab('summary');
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };
  
  const MemoizedResults = useMemo(() => {
    if (!analysisResult) return null;
    
    return (
      <div className="mt-8">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <button onClick={() => setActiveTab('summary')} className={`results-tab ${activeTab === 'summary' && 'active'}`}>Summary</button>
          <button onClick={() => setActiveTab('recommendations')} className={`results-tab ${activeTab === 'recommendations' && 'active'}`}>Recommendations</button>
          <button onClick={() => setActiveTab('rewrites')} className={`results-tab ${activeTab === 'rewrites' && 'active'}`}>Rewrites</button>
        </div>
        
        <div className="p-6 bg-black/20 rounded-xl">
          {activeTab === 'summary' && <p>{analysisResult.summary}</p>}
          {activeTab === 'recommendations' && (
            <ul className="space-y-3">
              {analysisResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <ChevronRight className="w-5 h-5 text-accent-primary mr-2 mt-1 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'rewrites' && (
             <div className="space-y-6">
             {Object.entries(analysisResult.rewritten_bullets).map(([oldB, newB], index) => (
               <div key={index} className="p-4 border border-glass-border rounded-lg">
                 <p className="text-sm text-text-secondary mb-2">Before:</p>
                 <p className="text-sm italic">{oldB}</p>
                 <p className="text-sm text-accent-gold mt-4 mb-2">Suggestion:</p>
                 <p className="text-sm">{newB}</p>
               </div>
             ))}
           </div>
          )}
        </div>
      </div>
    );
  }, [analysisResult, activeTab]);

  return (
    <div className="min-h-screen relative overflow-hidden text-text-primary p-4 sm:p-6 lg:p-8">
      {/* Background Orbs */}
      <div className="bg-orb w-[500px] h-[500px] top-[-100px] left-[-200px] bg-accent-primary/50"></div>
      <div className="bg-orb w-[600px] h-[600px] bottom-[-150px] right-[-250px] bg-accent-secondary/50"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center my-12 lg:my-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold heading-gradient mb-4">
            JobSculpt AI
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Elevate your resume. Analyze its alignment with any job description and get actionable, AI-powered feedback instantly.
          </p>
        </header>

        {/* Main Application Pane */}
        <main className="glass-pane p-6 sm:p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center"><FileText className="w-5 h-5 mr-2 text-accent-primary"/>Your Resume</h3>
                <div {...getResumeRootProps()} className={`upload-area p-6 text-center cursor-pointer ${isResumeDragActive && 'active'} ${resumeFile && 'has-file'}`}>
                  <input {...getResumeInputProps()} />
                  <UploadCloud className="w-10 h-10 mx-auto text-text-muted mb-2"/>
                  {resumeFile ? (
                    <p className="text-accent-secondary">{resumeFile.name}</p>
                  ) : (
                    <p className="text-text-secondary text-sm">Drop PDF file or click to upload</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-accent-primary"/>The Job Description</h3>
                <div {...getJdRootProps()} className={`upload-area p-6 text-center cursor-pointer ${isJdDragActive && 'active'} ${jobDescriptionFile && 'has-file'}`}>
                  <input {...getJdInputProps()} />
                  <UploadCloud className="w-10 h-10 mx-auto text-text-muted mb-2"/>
                  {jobDescriptionFile ? (
                    <p className="text-accent-secondary">{jobDescriptionFile.name}</p>
                  ) : (
                    <p className="text-text-secondary text-sm">Drop PDF file or click to upload</p>
                  )}
                </div>
                <p className="text-center text-text-muted my-2">or</p>
                <textarea
                  className="glass-input w-full p-3 h-24 resize-y"
                  placeholder="Paste job description text here..."
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                />
              </div>

              <div className="pt-4">
                 <button onClick={handleAnalyze} disabled={loading} className="glass-button-primary w-full py-3 px-6 text-lg flex items-center justify-center">
                    {loading ? (
                        <>
                            <div className="modern-spinner w-6 h-6 mr-3 border-2"></div>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5 mr-2"/>
                            <span>Analyze Now</span>
                        </>
                    )}
                </button>
                {error && <p className="text-red-400 text-center text-sm mt-4">{error}</p>}
              </div>
            </div>

            {/* Output Column */}
            <div className="lg:border-l lg:border-glass-border lg:pl-8">
              <h3 className="font-bold text-lg mb-4 flex items-center"><FileCheck className="w-5 h-5 mr-2 text-accent-primary"/>Your Analysis</h3>
              
              {loading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className="modern-spinner mb-6"></div>
                  <p className="font-semibold">Processing your documents...</p>
                  <p className="text-text-secondary text-sm">This may take a moment.</p>
                </div>
              )}

              {!loading && !analysisResult && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-black/20 rounded-xl">
                  <div className="text-5xl mb-4">🚀</div>
                  <p className="font-semibold">Your feedback awaits</p>
                  <p className="text-text-secondary text-sm">Upload your files and click "Analyze Now" to see your results.</p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center p-6 bg-black/20 rounded-xl">
                    <h4 className="font-semibold text-lg mb-4">Overall Match Score</h4>
                    <ScoreCircle score={analysisResult.match_score} />
                  </div>
                  {MemoizedResults}
                </div>
              )}

            </div>
          </div>
        </main>

        <footer className="text-center mt-12 lg:mt-20 py-6">
            <p className="text-text-muted text-sm">&copy; {new Date().getFullYear()} JobSculpt AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
