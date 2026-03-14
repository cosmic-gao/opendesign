import { setProjectAnnotations } from '@storybook/vue3';
import './src/__tests__/setup.ts';

const projectAnnotations = setProjectAnnotations([
  { parameters: { __id: 'unsorted' } },
]);

export default projectAnnotations;
