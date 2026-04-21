const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

exports.searchRecipes = async (req, res) => {
  const query = req.query.q || '';

  if (process.env.PYTHON_SERVICE_URL) {
    try {
      const response = await axios.get(process.env.PYTHON_SERVICE_URL, { params: { q: query } });
      return res.status(200).json({
        success: true,
        count: response.data?.length || 0,
        data: response.data || [],
      });
    } catch (err) {
      console.error('Python Service Error:', err.message);
      return res.status(500).json({ success: false, message: 'Python service unavailable' });
    }
  }

  const pythonPath = path.join(__dirname, '..', 'Python', 'venv', 'bin', 'python3');
  const scriptPath = path.join(__dirname, '..', 'Python', 'recipe_search_main.py');
  const pythonProcess = spawn(pythonPath, [scriptPath, query]);

  let resultData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => { resultData += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });

  pythonProcess.on('close', (code) => {
    if (code !== 0 || errorData) {
      console.error(`Python script error (exit ${code}): ${errorData}`);
      return res.status(500).json({ success: false, message: 'Error executing search algorithm.' });
    }

    try {
      const results = JSON.parse(resultData);
      if (results.error) {
        return res.status(500).json({ success: false, message: 'Search algorithm failed', error: results.error });
      }
      res.status(200).json({ success: true, count: results.length, data: results });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to process search results.' });
    }
  });
};
