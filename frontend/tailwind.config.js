/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./public/index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#6366f1',
                secondary: '#4f46e5',
                accent: '#818cf8',
            },
        },
    },
    plugins: [],
}
