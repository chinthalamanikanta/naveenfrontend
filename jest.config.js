module.exports = {
    transformIgnorePatterns: [
      "/node_modules/(?!(axios)/)"  // Add more dependencies here if needed
    ],
    transform: {
        "^.+\\.jsx?$": "babel-jest"
      },
      preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  };
  