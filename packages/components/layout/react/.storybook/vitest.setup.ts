import { setProjectAnnotations } from '@storybook/react';
import './src/__tests__/setup.ts';

const projectAnnotations = setProjectAnnotations([
  { parameters: { __id: 'unsorted' } },
]);

export default projectAnnotations;
