import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds';

export const decorators = [withBackgrounds];
export const parameters = {
  backgrounds: [
    { name: 'plain', value: 'white', default: true },
    { name: 'dark', value: 'black' },
    { name: 'cool', value: 'deepskyblue' },
  ],
};