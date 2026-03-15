import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = [
    {
        ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts', 'postcss.config.mjs', 'tailwind.config.*', 'next.config.*', 'eslint.config.mjs'],
    },
    ...nextCoreWebVitals,
    {
        rules: {
            'react-hooks/exhaustive-deps': 'off',
            '@next/next/no-img-element': 'off',
        },
    },
    prettier,
];

export default eslintConfig;
