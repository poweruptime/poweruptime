import {defineConfig} from 'ng-icons-manager';

export default defineConfig({
  jobs: {
    web: {
      inputDirs: ['src/app', 'src/libs/custom'],
      outputDir: 'src/assets/icons',
    },
  },
});
