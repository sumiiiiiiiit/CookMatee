const { spawn } = require('child_process');
const path = require('path');

const detectAllergens = (ingredients) => {
  return new Promise((resolve, reject) => {
    const pythonPath = '/usr/bin/python3';
    const scriptPath = path.join(__dirname, '../Python/AllerenX.py');
    const modelPath = path.join(__dirname, '../Python/allergen_model.pkl');

    const ingredientsString = Array.isArray(ingredients)
      ? ingredients.map((i) => (typeof i === 'string' ? i : i.name)).join(', ')
      : ingredients;

    const pythonProcess = spawn(pythonPath, [scriptPath, 'detect', ingredientsString, modelPath]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Allergen Detection failed (exit ${code}): ${errorOutput}`);
        return reject(new Error('Failed to detect allergens'));
      }
      try {
        resolve(JSON.parse(output));
      } catch {
        console.error('Allergen parse error, raw output:', output);
        reject(new Error('Failed to parse allergen results'));
      }
    });
  });
};

module.exports = { detectAllergens };
