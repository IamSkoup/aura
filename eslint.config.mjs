import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
const config = [{ ignores: ['.next/**', 'node_modules/**', '.data/**', 'next-env.d.ts'] }, ...compat.extends('next/core-web-vitals', 'next/typescript'), { files: ['src/components/DesignEditor.tsx', 'src/components/Shirt3D.tsx'], rules: { '@next/next/no-img-element': 'off' } }];
export default config;
