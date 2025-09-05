import path from 'node:path';

import { loadConfig } from 'c12';

import { ConfigError } from '../error';
import type { Config, UserConfig } from '../types/config';
import { isLegacyClient, setConfig } from '../utils/config';
import { getInput } from './input';
import { getLogs } from './logs';
import { mergeConfigs } from './merge';
import { getOutput } from './output';
import { getProjectDependencies } from './packages';
import { getParser } from './parser';
import { getPlugins } from './plugins';

/**
 * @internal
 */
export const initConfigs = async (
  userConfig: UserConfig | ReadonlyArray<UserConfig> | undefined,
): Promise<{
  dependencies: Record<string, string>;
  results: ReadonlyArray<{
    config: Config;
    errors: ReadonlyArray<Error>;
  }>;
}> => {
  let configurationFile: string | undefined = undefined;
  if (userConfig && !(userConfig instanceof Array)) {
    const cf = userConfig.configFile;
    if (cf) {
      const parts = cf.split('.');
      configurationFile = parts.slice(0, parts.length - 1).join('.');
    }
  }

  // const { config: configFromFile, sources } = await loadConfig<
  //   UserConfig | ReadonlyArray<UserConfig>
  // >({
  //   merge: false,
  //   sources: [
  //     {
  //       extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
  //       files: configurationFile ?? 'openapi-ts.config',
  //     },
  //   ],
  // });
  const { config: configFromFile, configFile: loadedConfigFile } =
    await loadConfig<UserConfig>({
      configFile: configurationFile,
      name: 'openapi-ts',
    });

  // const loadedConfigFile = Array.isArray(sources)
  //   ? (sources as ReadonlyArray<{ config?: unknown; filepath?: string }>).find(
  //       (s) => s.config != null,
  //     )?.filepath
  //   : undefined;

  const dependencies = getProjectDependencies(loadedConfigFile);

  const userConfigs: ReadonlyArray<UserConfig> = Array.isArray(userConfig)
    ? userConfig
    : Array.isArray(configFromFile)
      ? configFromFile.map((config) =>
          mergeConfigs(config, userConfig as UserConfig | undefined),
        )
      : [
          mergeConfigs(
            (configFromFile as UserConfig) ?? ({} as UserConfig),
            userConfig as UserConfig | undefined,
          ),
        ];

  const results: Array<{
    config: Config;
    errors: Array<Error>;
  }> = [];

  for (const userConfig of userConfigs) {
    const {
      base,
      configFile = '',
      dryRun = false,
      experimentalParser = true,
      exportCore = true,
      interactive = false,
      name,
      request,
      useOptions = true,
    } = userConfig;

    const errors: Array<Error> = [];

    const logs = getLogs(userConfig);

    if (logs.level === 'debug') {
      console.warn('userConfig:', userConfig);
    }

    const input = getInput(userConfig);
    const output = getOutput(userConfig);
    const parser = getParser(userConfig);

    if (!input.path) {
      errors.push(
        new ConfigError(
          'missing input - which OpenAPI specification should we use to generate your output?',
        ),
      );
    }

    if (!output.path) {
      errors.push(
        new ConfigError(
          'missing output - where should we generate your output?',
        ),
      );
    }

    if (!useOptions) {
      console.warn(
        '❗️ Deprecation warning: useOptions set to false. This setting will be removed in future versions. Please migrate useOptions to true https://heyapi.dev/openapi-ts/migrating.html#v0-27-38',
      );
    }

    output.path = path.resolve(process.cwd(), output.path);

    let plugins: Pick<Config, 'plugins' | 'pluginOrder'>;

    try {
      plugins = getPlugins({ dependencies, userConfig });
    } catch (error) {
      errors.push(error);
      plugins = {
        pluginOrder: [],
        plugins: {},
      };
    }

    const config = setConfig({
      ...plugins,
      base,
      configFile,
      dryRun,
      experimentalParser,
      exportCore: false,
      input,
      interactive,
      logs,
      name,
      output,
      parser,
      request,
      useOptions,
    });
    config.exportCore = isLegacyClient(config) ? exportCore : false;

    if (logs.level === 'debug') {
      console.warn('config:', config);
    }

    results.push({
      config,
      errors,
    });
  }

  return { dependencies, results };
};
