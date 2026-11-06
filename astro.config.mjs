import { defineConfig } from 'astro/config';
import { loadEnvFile } from 'node:process';
try {loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw error;}
export default defineConfig({site:process.env.SITE_URL||'https://restaurant.example',base:process.env.SITE_BASE||'/',srcDir:'./example/src',publicDir:'./example/public',output:'static',trailingSlash:'always',prefetch:{prefetchAll:false,defaultStrategy:'hover'}});
