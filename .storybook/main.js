module.exports = {
  stories: [
    './src/components/**/*.stories.?(ts|tsx|js|jsx)',
    './src/components/**/stories.?(ts|tsx|js|jsx)',
    './src/components/**/story.?(ts|tsx|js|jsx)',
  ],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-backgrounds',
    '@storybook/addon-ondevice-actions',
  ],
};