const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const dotenv = require('dotenv');
const ModelClient = require('@azure-rest/ai-inference').default;
const { isUnexpected } = require('@azure-rest/ai-inference');
const { AzureKeyCredential } = require('@azure/core-auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/analyze', upload.fields([{ name: 'resume' }, { name: 'jobDescription' }]), async (req, res) => {
    try {
        const resumeFile = req.files.resume[0];
        const jobDescriptionFile = req.files.jobDescription ? req.files.jobDescription[0] : null;
        const jobDescriptionText = req.body.jobDescriptionText;

        if (!resumeFile) {
            return res.status(400).json({ error: 'Resume file is required.' });
        }

        if (!jobDescriptionFile && !jobDescriptionText) {
            return res.status(400).json({ error: 'Job description is required (either file or text).' });
        }

        const resumeData = await pdf(resumeFile.buffer);
        const resumeText = resumeData.text;

        let jdText = '';
        if (jobDescriptionFile) {
            const jdData = await pdf(jobDescriptionFile.buffer);
            jdText = jdData.text;
        } else {
            jdText = jobDescriptionText;
        }

        const endpoint = "https://models.github.ai/inference";
        const model = "openai/gpt-4.1";
        const token = process.env["GITHUB_TOKEN"];

        if (!token) {
            return res.status(500).json({ error: 'GITHUB_TOKEN environment variable not set.' });
        }

        const client = ModelClient(endpoint, new AzureKeyCredential(token));

        const response = await client.path("/chat/completions").post({
            body: {
                messages: [
                    { 
                        role: "system", 
                        content: "You are a resume optimization assistant. Given a resume and job description, evaluate the alignment and provide feedback. Always respond with valid JSON in this exact format: {\"match_score\": \"percentage or qualitative score\", \"recommendations\": [\"recommendation1\", \"recommendation2\"], \"rewritten_bullets\": {\"old_bullet\": \"new_bullet\"}, \"summary\": \"one paragraph summary\"}" 
                    },
                    { 
                        role: "user", 
                        content: `Please analyze this resume against the job description and provide feedback in JSON format.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}\n\nProvide a match score (0-100%), specific recommendations for improvement, suggested rewrites for key bullet points, and a summary of gaps/opportunities.` 
                    }
                ],
                model: model,
                temperature: 0.7,
                top_p: 1,
            }
        });

        if (isUnexpected(response)) {
            console.error("Error from AI service:", response.body.error);
            return res.status(500).json({ error: `Failed to get response from AI service: ${response.body.error.message}` });
        }

        const messageContent = response.body.choices[0].message.content;
        
        // Attempt to parse the content as JSON, if it fails, send as raw text.
        try {
            const structuredResponse = JSON.parse(messageContent);
            res.json(structuredResponse);
        } catch (e) {
            // The response is not a JSON object, so we need to parse it manually.
            const matchScoreRegex = /"match_score":\s*(\d+|".*?")/g;
            const recommendationsRegex = /"recommendations":\s*\[(.*?)\]/gs;
            const rewrittenBulletsRegex = /"rewritten_bullets":\s*\{(.*?)\}/gs;
            const summaryRegex = /"summary":\s*"(.*?)"/gs;

            const matchScoreMatch = matchScoreRegex.exec(messageContent);
            const recommendationsMatch = recommendationsRegex.exec(messageContent);
            const rewrittenBulletsMatch = rewrittenBulletsRegex.exec(messageContent);
            const summaryMatch = summaryRegex.exec(messageContent);

            const match_score = matchScoreMatch ? matchScoreMatch[1].replace(/"/g, '') : "N/A";
            
            const recommendations = recommendationsMatch ? recommendationsMatch[1].split(',').map(item => item.replace(/"/g, '').trim()) : [];

            const rewritten_bullets = {};
            if (rewrittenBulletsMatch) {
                const bulletsStr = rewrittenBulletsMatch[1];
                const bulletPairs = bulletsStr.split(',');
                bulletPairs.forEach(pair => {
                    const [oldB, newB] = pair.split(':').map(b => b.replace(/"/g, '').trim());
                    rewritten_bullets[oldB] = newB;
                });
            }

            const summary = summaryMatch ? summaryMatch[1] : "No summary provided.";

            res.json({
                match_score: match_score,
                recommendations: recommendations,
                rewritten_bullets: rewritten_bullets,
                summary: summary
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 