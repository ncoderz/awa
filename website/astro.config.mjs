import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://ncoderz.github.io',
  base: '/awa',
  integrations: [
    starlight({
      title: 'awa',
      description: 'Agent Workflow for AIs — supercharge your AI development with structured workflows and full traceability.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ncoderz/awa' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/@ncoderz/awa' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Quick Start', slug: 'guides/quick-start' },
          ],
        },
        {
          label: 'Workflow',
          items: [
            { label: 'Overview', slug: 'guides/workflow' },
            { label: 'Traceability', slug: 'guides/traceability' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI', slug: 'reference/cli' },
            { label: 'Template Engine', slug: 'reference/template-engine' },
            { label: 'Configuration', slug: 'reference/configuration' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content: 'AI agent, workflow, CLI, template, traceability, developer tools',
          },
        },
      ],
    }),
  ],
});
