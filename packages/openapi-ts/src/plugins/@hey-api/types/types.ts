import type { PluginHandler, PluginLegacyHandler } from '../../types';

interface Config {
  /**
   * Generate Hey API types from the provided input.
   */
  name: '@hey-api/types';
  /**
   * Name of the generated file.
   * @default 'types'
   */
  output?: string;
}

export interface PluginConfig extends Config {
  handler: PluginHandler<Config>;
  handlerLegacy: PluginLegacyHandler<Config>;
}

export interface UserConfig extends Omit<Config, 'output'> {}
