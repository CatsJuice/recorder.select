import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendorDirectory = resolve(repositoryRoot, 'public/vendor');
const webLlmSource = resolve(repositoryRoot, 'node_modules/@mlc-ai/web-llm/lib/index.js');
const webLlmTarget = resolve(vendorDirectory, 'web-llm.js');
const workerTarget = resolve(vendorDirectory, 'web-llm.worker.js');
const workerSource = `import { WebWorkerMLCEngineHandler } from './web-llm.js';

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (message) => {
  handler.onmessage(message);
};
`;

await mkdir(vendorDirectory, { recursive: true });
await Promise.all([
  copyFile(webLlmSource, webLlmTarget),
  writeFile(workerTarget, workerSource),
]);
