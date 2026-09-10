import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function persistWithPrivateLink(input: {
  outputFile: string;
  url: URL;
  persist: () => Promise<unknown>;
}) {
  await mkdir(dirname(input.outputFile), {
    recursive: true,
    mode: 0o700,
  });
  await writeFile(input.outputFile, `${input.url.toString()}\n`, {
    encoding: 'utf8',
    mode: 0o600,
    flag: 'wx',
  });

  try {
    await input.persist();
  } catch (error) {
    await unlink(input.outputFile).catch(() => undefined);
    throw error;
  }
}
