import type { Config, UserConfig } from '../types/config';
import { valueToObject } from './utils/config';

export const defaultPaginationKeywords = [
  'after',
  'before',
  'cursor',
  'offset',
  'page',
  'start',
] as const;

export const getParser = (userConfig: UserConfig): Config['parser'] => {
  const parser = valueToObject({
    defaultValue: {
      hooks: {},
      pagination: {
        keywords: defaultPaginationKeywords,
      },
      transforms: {
        enums: {
          case: 'PascalCase',
          enabled: false,
          mode: 'root',
          name: '{{name}}Enum',
        },
        propertiesRequiredByDefault: false,
        readWrite: {
          enabled: true,
          requests: {
            case: 'preserve',
            name: '{{name}}Writable',
          },
          responses: {
            case: 'preserve',
            name: '{{name}}',
          },
        },
      },
      validate_EXPERIMENTAL: false,
    },
    mappers: {
      object: (fields, defaultValue) => ({
        ...fields,
        pagination: valueToObject({
          defaultValue: {
            ...(defaultValue.pagination as Extract<
              typeof defaultValue.pagination,
              Record<string, unknown>
            >),
          },
          value: fields.pagination,
        }),
        transforms: valueToObject({
          defaultValue: {
            ...(defaultValue.transforms as Extract<
              typeof defaultValue.transforms,
              Record<string, unknown>
            >),
          },
          mappers: {
            object: (fields, defaultValue) => ({
              ...fields,
              enums: valueToObject({
                defaultValue: {
                  ...(defaultValue.enums as Extract<
                    typeof defaultValue.enums,
                    Record<string, unknown>
                  >),
                  enabled:
                    fields.enums !== undefined
                      ? Boolean(fields.enums)
                      : (
                          defaultValue.enums as Extract<
                            typeof defaultValue.enums,
                            Record<string, unknown>
                          >
                        ).enabled,
                },
                mappers: {
                  boolean: (enabled) => ({ enabled }),
                  string: (mode) => ({ mode }),
                },
                value: fields.enums,
              }),
              propertiesRequiredByDefault:
                fields.propertiesRequiredByDefault !== undefined
                  ? fields.propertiesRequiredByDefault
                  : defaultValue.propertiesRequiredByDefault,
              readWrite: valueToObject({
                defaultValue: {
                  ...(defaultValue.readWrite as Extract<
                    typeof defaultValue.readWrite,
                    Record<string, unknown>
                  >),
                  enabled:
                    fields.readWrite !== undefined
                      ? Boolean(fields.readWrite)
                      : (
                          defaultValue.readWrite as Extract<
                            typeof defaultValue.readWrite,
                            Record<string, unknown>
                          >
                        ).enabled,
                },
                mappers: {
                  boolean: (enabled) => ({ enabled }),
                  object: (fields, defaultValue) => ({
                    ...fields,
                    requests: valueToObject({
                      defaultValue: {
                        ...(defaultValue.requests as Extract<
                          typeof defaultValue.requests,
                          Record<string, unknown>
                        >),
                      },
                      mappers: {
                        function: (name) => ({ name }),
                        string: (name) => ({ name }),
                      },
                      value: fields.requests,
                    }),
                    responses: valueToObject({
                      defaultValue: {
                        ...(defaultValue.responses as Extract<
                          typeof defaultValue.responses,
                          Record<string, unknown>
                        >),
                      },
                      mappers: {
                        function: (name) => ({ name }),
                        string: (name) => ({ name }),
                      },
                      value: fields.responses,
                    }),
                  }),
                },
                value: fields.readWrite,
              }),
            }),
          },
          value: fields.transforms,
        }),
        validate_EXPERIMENTAL:
          fields.validate_EXPERIMENTAL === true
            ? 'warn'
            : fields.validate_EXPERIMENTAL,
      }),
    },
    value: userConfig.parser,
  });
  return parser as Config['parser'];
};
