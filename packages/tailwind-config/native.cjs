// @ts-ignore - the path exists but there's no type definition
const nativewind = require('nativewind/preset');

const baseConfig = require('./base.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [baseConfig, nativewind],
};
