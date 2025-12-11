module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    'expo': {
      platforms: {
        android: null, // Exclure Expo du build Android
      },
    },
  },
};

