/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./**/*.html"],
	presets: [require("@brave/leo/tokens/tailwind")],
	theme: {
		extend: {
			screens: {
				"2xl": "1440px",
			},
		},
	},
	plugins: [],
};
