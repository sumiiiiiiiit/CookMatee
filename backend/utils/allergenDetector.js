const { spawn } = require('child_process');
const path = require('path');

const detectAllergens = (ingredients) => {
    return new Promise((resolve, reject) => {
        const pythonPath = '/usr/bin/python3';
        const pythonDir = path.join(__dirname, '../Python');
        const scriptPath = path.join(pythonDir, 'AllerenX.py');
        const modelPath = path.join(pythonDir, 'allergen_model.pkl');
        const ingredientsString = Array.isArray(ingredients) ? ingredients.map(i => typeof i === 'string' ? i : i.name).join(', ') : ingredients;

        // Pass model path as a 3rd argument to detect command
        const pythonProcess = spawn(pythonPath, [scriptPath, 'detect', ingredientsString, modelPath]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Allergen Detection failed with code ${code}`);
                console.error(`Python Stderr: ${errorString}`);
                return reject(new Error('Failed to detect allergens'));
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (e) {
                console.error('Allergen Detection parse error:', dataString);
                reject(new Error('Failed to parse allergen detection results'));
            }
        });
    });
};

module.exports = { detectAllergens };
