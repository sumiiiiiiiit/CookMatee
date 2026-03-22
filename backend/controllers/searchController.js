const { spawn } = require('child_process');
const path = require('path');

/**
 * Controller to handle AI-powered recipe searches by spawning a Python process.
 */
exports.searchRecipes = (req, res) => {
    const query = req.query.q || '';
    
    // Path to the Python executable within the virtual environment
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
