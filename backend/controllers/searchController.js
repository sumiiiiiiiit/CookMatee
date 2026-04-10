const { spawn } = require('child_process');
const path = require('path');

/**
 * Controller to handle AI-powered recipe searches by spawning a Python process.
 */
exports.searchRecipes = async (req, res) => {
    const query = req.query.q || '';
    
    if (process.env.PYTHON_SERVICE_URL) {
        // Deployed separate Python service on Render
        try {
            const axios = require('axios');
            const response = await axios.get(process.env.PYTHON_SERVICE_URL, { params: { q: query } });
            return res.status(200).json({
                success: true,
                count: response.data?.length || 0,
                data: response.data || []
            });
        } catch (err) {
            console.error('Python Service Error:', err.message);
            return res.status(500).json({ success: false, message: 'Python service unavailable', error: err.message });
        }
    }

    // Path to the Python executable within the virtual environment (Fallback for local)
    const pythonPath = path.join(__dirname, '..', 'Python', 'venv', 'bin', 'python3');
    const scriptPath = path.join(__dirname, '..', 'Python', 'recipe_search_main.py');
    
    // Spawn the Python process
    const pythonProcess = spawn(pythonPath, [scriptPath, query]);
    
    let resultData = '';
    let errorData = '';
    
    // Collect data from standard output
    pythonProcess.stdout.on('data', (data) => {
        resultData += data.toString();
    });
    
    // Collect errors from standard error
    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
        if (code !== 0 || errorData) {
            console.error(`Python script error (Exit code ${code}): ${errorData}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Error executing search algorithm.',
                error: errorData
            });
        }
        
        try {
            // Parse the JSON output from the Python script
            const results = JSON.parse(resultData);
            
            // Check if Python script returned an error object
            if (results.error) {
                console.error("Python script internal error:", results.error);
                return res.status(500).json({
                    success: false,
                    message: "Search algorithm failed",
                    error: results.error
                });
            }
            
            // Send successful response
            res.status(200).json({
                success: true,
                count: results.length,
                data: results
            });
        } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            console.error('Raw output was:', resultData);
            res.status(500).json({
                success: false,
                message: 'Failed to process search results.'
            });
        }
    });
};
