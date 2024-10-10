import ts from 'typescript';

import { compiler, type Property } from '../../../compiler';
import type { ImportExportItem } from '../../../compiler/module';
import type { ImportExportItemObject } from '../../../compiler/utils';
import {
  clientModulePath,
  clientOptionsTypeName,
} from '../../../generate/client';
import {
  generateImport,
  operationDataTypeName,
  operationErrorTypeName,
  operationOptionsType,
  operationResponseTypeName,
  toOperationName,
} from '../../../generate/services';
import { relativeModulePath } from '../../../generate/utils';
import { isOperationParameterRequired } from '../../../openApi';
import { getOperationKey } from '../../../openApi/common/parser/operation';
import type {
  Client,
  Method,
  Model,
  Operation,
  OperationParameter,
} from '../../../types/client';
import type { Files } from '../../../types/utils';
import { getConfig } from '../../../utils/config';
import { transformServiceName } from '../../../utils/transform';
import type { PluginHandler } from '../../types';
import type { PluginConfig as ReactQueryPluginConfig } from '../react-query';
import type { PluginConfig as SolidQueryPluginConfig } from '../solid-query';
import type { PluginConfig as SvelteQueryPluginConfig } from '../svelte-query';
import type { PluginConfig as VueQueryPluginConfig } from '../vue-query';

const toInfiniteQueryOptionsName = (operation: Operation) =>
  `${toOperationName(operation, false)}InfiniteOptions`;

const toMutationOptionsName = (operation: Operation) =>
  `${toOperationName(operation, false)}Mutation`;

const toQueryOptionsName = (operation: Operation) =>
  `${toOperationName(operation, false)}Options`;

const toQueryKeyName = (operation: Operation, isInfinite?: boolean) =>
  `${toOperationName(operation, false)}${isInfinite ? 'Infinite' : ''}QueryKey`;

const checkPrerequisites = ({ files }: { files: Files }) => {
  if (!files.services) {
    throw new Error(
      '🚫 services need to be exported to use TanStack Query plugin - enable service generation',
    );
  }
};

const getPaginationIn = (parameter: OperationParameter) => {
  switch (parameter.in) {
    case 'formData':
      return 'body';
    case 'header':
      return 'headers';
    default:
      return parameter.in;
  }
};

const paginationWordsRegExp = /^(cursor|offset|page|start)/;

const createInfiniteParamsFn = 'createInfiniteParams';
const createQueryKeyFn = 'createQueryKey';
const infiniteQueryOptionsFn = 'infiniteQueryOptions';
const mutationOptionsFn = 'mutationOptions';
const queryKeyName = 'QueryKey';
const queryOptionsFn = 'queryOptions';
const TOptionsType = 'TOptions';

const getClientBaseUrlKey = () => {
  const config = getConfig();
  return config.client.name === '@hey-api/client-axios' ? 'baseURL' : 'baseUrl';
};

const createInfiniteParamsFunction = ({
  file,
}: {
  file: Files[keyof Files];
}) => {
  const fn = compiler.constVariable({
    expression: compiler.arrowFunction({
      multiLine: true,
      parameters: [
        {
          name: 'queryKey',
          type: compiler.typeNode('QueryKey<Options>'),
        },
        {
          name: 'page',
          type: compiler.typeNode('K'),
        },
      ],
      statements: [
        compiler.constVariable({
          expression: compiler.identifier({
            text: 'queryKey[0]',
          }),
          name: 'params',
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({
              text: 'page',
            }),
            name: compiler.identifier({ text: 'body' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'body',
                  }),
                  right: compiler.objectExpression({
                    multiLine: true,
                    obj: [
                      {
                        assertion: 'any',
                        spread: 'queryKey[0].body',
                      },
                      {
                        assertion: 'any',
                        spread: 'page.body',
                      },
                    ],
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({
              text: 'page',
            }),
            name: compiler.identifier({ text: 'headers' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'headers',
                  }),
                  right: compiler.objectExpression({
                    multiLine: true,
                    obj: [
                      {
                        spread: 'queryKey[0].headers',
                      },
                      {
                        spread: 'page.headers',
                      },
                    ],
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({
              text: 'page',
            }),
            name: compiler.identifier({ text: 'path' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'path',
                  }),
                  right: compiler.objectExpression({
                    multiLine: true,
                    obj: [
                      {
                        spread: 'queryKey[0].path',
                      },
                      {
                        spread: 'page.path',
                      },
                    ],
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({
              text: 'page',
            }),
            name: compiler.identifier({ text: 'query' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'query',
                  }),
                  right: compiler.objectExpression({
                    multiLine: true,
                    obj: [
                      {
                        spread: 'queryKey[0].query',
                      },
                      {
                        spread: 'page.query',
                      },
                    ],
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.returnVariable({
          expression: ts.factory.createAsExpression(
            ts.factory.createAsExpression(
              compiler.identifier({ text: 'params' }),
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
            ),
            ts.factory.createTypeQueryNode(
              compiler.identifier({ text: 'page' }),
            ),
          ),
        }),
      ],
      types: [
        {
          extends: compiler.typeReferenceNode({
            typeName: compiler.identifier({
              text: "Pick<QueryKey<Options>[0], 'body' | 'headers' | 'path' | 'query'>",
            }),
          }),
          name: 'K',
        },
      ],
    }),
    name: createInfiniteParamsFn,
  });
  file.add(fn);
};

const createQueryKeyFunction = ({ file }: { file: Files[keyof Files] }) => {
  const returnType = compiler.indexedAccessTypeNode({
    indexType: compiler.typeNode(0),
    objectType: compiler.typeNode(queryKeyName, [
      compiler.typeNode(TOptionsType),
    ]),
  });

  const infiniteIdentifier = compiler.identifier({ text: 'infinite' });

  const fn = compiler.constVariable({
    expression: compiler.arrowFunction({
      multiLine: true,
      parameters: [
        {
          name: 'id',
          type: compiler.typeNode('string'),
        },
        {
          isRequired: false,
          name: 'options',
          type: compiler.typeNode(TOptionsType),
        },
        {
          isRequired: false,
          name: 'infinite',
          type: compiler.typeNode('boolean'),
        },
      ],
      returnType,
      statements: [
        compiler.constVariable({
          assertion: returnType,
          expression: compiler.objectExpression({
            multiLine: false,
            obj: [
              {
                key: '_id',
                value: compiler.identifier({ text: 'id' }),
              },
              {
                key: getClientBaseUrlKey(),
                value: compiler.identifier({
                  text: `(options?.client ?? client).getConfig().${getClientBaseUrlKey()}`,
                }),
              },
            ],
          }),
          name: 'params',
          typeName: returnType,
        }),
        compiler.ifStatement({
          expression: infiniteIdentifier,
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: '_infinite',
                  }),
                  right: infiniteIdentifier,
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({ text: 'options' }),
            isOptional: true,
            name: compiler.identifier({ text: 'body' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'body',
                  }),
                  right: compiler.propertyAccessExpression({
                    expression: 'options',
                    name: 'body',
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({ text: 'options' }),
            isOptional: true,
            name: compiler.identifier({ text: 'headers' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'headers',
                  }),
                  right: compiler.propertyAccessExpression({
                    expression: 'options',
                    name: 'headers',
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({ text: 'options' }),
            isOptional: true,
            name: compiler.identifier({ text: 'path' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'path',
                  }),
                  right: compiler.propertyAccessExpression({
                    expression: 'options',
                    name: 'path',
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.ifStatement({
          expression: compiler.propertyAccessExpression({
            expression: compiler.identifier({ text: 'options' }),
            isOptional: true,
            name: compiler.identifier({ text: 'query' }),
          }),
          thenStatement: ts.factory.createBlock(
            [
              compiler.expressionToStatement({
                expression: compiler.binaryExpression({
                  left: compiler.propertyAccessExpression({
                    expression: 'params',
                    name: 'query',
                  }),
                  right: compiler.propertyAccessExpression({
                    expression: 'options',
                    name: 'query',
                  }),
                }),
              }),
            ],
            true,
          ),
        }),
        compiler.returnVariable({
          expression: 'params',
        }),
      ],
      types: [
        {
          extends: compiler.typeReferenceNode({
            typeName: compiler.identifier({
              text: clientOptionsTypeName(),
            }),
          }),
          name: TOptionsType,
        },
      ],
    }),
    name: createQueryKeyFn,
  });
  file.add(fn);
};

const createQueryKeyType = ({ file }: { file: Files[keyof Files] }) => {
  const properties: Property[] = [
    {
      name: '_id',
      type: compiler.keywordTypeNode({
        keyword: 'string',
      }),
    },
    {
      isRequired: false,
      name: '_infinite',
      type: compiler.keywordTypeNode({
        keyword: 'boolean',
      }),
    },
  ];

  const queryKeyType = compiler.typeAliasDeclaration({
    name: queryKeyName,
    type: compiler.typeTupleNode({
      types: [
        compiler.typeIntersectionNode({
          types: [
            compiler.typeReferenceNode({
              typeName: `Pick<${TOptionsType}, '${getClientBaseUrlKey()}' | 'body' | 'headers' | 'path' | 'query'>`,
            }),
            compiler.typeInterfaceNode({ properties }),
          ],
        }),
      ],
    }),
    typeParameters: [
      {
        extends: compiler.typeReferenceNode({
          typeName: compiler.identifier({
            text: clientOptionsTypeName(),
          }),
        }),
        name: TOptionsType,
      },
    ],
  });
  file.add(queryKeyType);
};

const createTypeData = ({
  client,
  file,
  operation,
  typesModulePath,
}: {
  client: Client;
  file: Files[keyof Files];
  operation: Operation;
  typesModulePath: string;
}) => {
  const { name: nameTypeData } = generateImport({
    client,
    meta: operation.parameters.length
      ? {
          // TODO: this should be exact ref to operation for consistency,
          // but name should work too as operation ID is unique
          $ref: operation.name,
          name: operation.name,
        }
      : undefined,
    nameTransformer: operationDataTypeName,
    onImport: (name) => {
      file.import({
        asType: true,
        module: typesModulePath,
        name,
      });
    },
  });

  const typeData = operationOptionsType(nameTypeData);

  return { typeData };
};

const createTypeError = ({
  client,
  file,
  operation,
  pluginName,
  typesModulePath,
}: {
  client: Client;
  file: Files[keyof Files];
  operation: Operation;
  pluginName: string;
  typesModulePath: string;
}) => {
  const config = getConfig();

  const { name: nameTypeError } = generateImport({
    client,
    meta: {
      // TODO: this should be exact ref to operation for consistency,
      // but name should work too as operation ID is unique
      $ref: operation.name,
      name: operation.name,
    },
    nameTransformer: operationErrorTypeName,
    onImport: (name) => {
      file.import({
        asType: true,
        module: typesModulePath,
        name,
      });
    },
  });

  let typeError: ImportExportItemObject = {
    asType: true,
    name: nameTypeError,
  };
  if (!typeError.name) {
    typeError = file.import({
      asType: true,
      module: pluginName,
      name: 'DefaultError',
    });
  }

  if (config.client.name === '@hey-api/client-axios') {
    const axiosError = file.import({
      asType: true,
      module: 'axios',
      name: 'AxiosError',
    });
    typeError = {
      ...axiosError,
      name: `${axiosError.name}<${typeError.name}>`,
    };
  }

  return { typeError };
};

const createTypeResponse = ({
  client,
  file,
  operation,
  typesModulePath,
}: {
  client: Client;
  file: Files[keyof Files];
  operation: Operation;
  typesModulePath: string;
}) => {
  const { name: nameTypeResponse } = generateImport({
    client,
    meta: {
      // TODO: this should be exact ref to operation for consistency,
      // but name should work too as operation ID is unique
      $ref: operation.name,
      name: operation.name,
    },
    nameTransformer: operationResponseTypeName,
    onImport: (imported) => {
      file.import({
        asType: true,
        module: typesModulePath,
        name: imported,
      });
    },
  });

  const typeResponse = nameTypeResponse || 'void';

  return { typeResponse };
};

const createQueryKeyLiteral = ({
  isInfinite,
  operation,
}: {
  isInfinite?: boolean;
  operation: Operation;
}) =>
  compiler.arrayLiteralExpression({
    elements: [
      compiler.callExpression({
        functionName: createQueryKeyFn,
        parameters: [
          compiler.stringLiteral({ text: operation.name }),
          'options',
          isInfinite ? compiler.ots.boolean(true) : undefined,
        ],
      }),
    ],
    multiLine: false,
  });

export const handler: PluginHandler<
  | ReactQueryPluginConfig
  | SolidQueryPluginConfig
  | SvelteQueryPluginConfig
  | VueQueryPluginConfig
> = ({ client, files, plugin }) => {
  checkPrerequisites({ files });

  const config = getConfig();
  const file = files[plugin.name];

  file.import({
    asType: true,
    module: clientModulePath({ sourceOutput: plugin.output }),
    name: clientOptionsTypeName(),
  });

  const typesModulePath = relativeModulePath({
    moduleOutput: files.types.getName(false),
    sourceOutput: plugin.output,
  });

  const mutationsType =
    plugin.name === '@tanstack/svelte-query' ||
    plugin.name === '@tanstack/solid-query'
      ? 'MutationOptions'
      : 'UseMutationOptions';

  let typeInfiniteData!: ImportExportItem;
  let hasCreateInfiniteParamsFunction = false;
  let hasCreateQueryKeyParamsFunction = false;
  let hasInfiniteQueries = false;
  let hasMutations = false;
  let hasQueries = false;

  const processedOperations = new Map<string, boolean>();

  for (const service of client.services) {
    for (const operation of service.operations) {
      // track processed operations to avoid creating duplicates
      const operationKey = getOperationKey(operation);
      if (processedOperations.has(operationKey)) {
        continue;
      }
      processedOperations.set(operationKey, true);

      const queryFn = [
        config.services.asClass && transformServiceName(service.name),
        toOperationName(operation, !config.services.asClass),
      ]
        .filter(Boolean)
        .join('.');
      let hasUsedQueryFn = false;

      // queries
      if (
        plugin.queryOptions &&
        (['GET', 'POST'] as ReadonlyArray<Method>).includes(operation.method)
      ) {
        if (!hasQueries) {
          hasQueries = true;

          if (!hasCreateQueryKeyParamsFunction) {
            createQueryKeyType({ file });
            createQueryKeyFunction({ file });
            hasCreateQueryKeyParamsFunction = true;
          }

          file.import({
            module: plugin.name,
            name: queryOptionsFn,
          });
        }

        hasUsedQueryFn = true;

        const { typeData } = createTypeData({
          client,
          file,
          operation,
          typesModulePath,
        });

        const isRequired = isOperationParameterRequired(operation.parameters);

        const queryKeyStatement = compiler.constVariable({
          exportConst: true,
          expression: compiler.arrowFunction({
            parameters: [
              {
                isRequired,
                name: 'options',
                type: typeData,
              },
            ],
            statements: createQueryKeyLiteral({
              operation,
            }),
          }),
          name: toQueryKeyName(operation),
        });
        file.add(queryKeyStatement);

        const expression = compiler.arrowFunction({
          parameters: [
            {
              isRequired,
              name: 'options',
              type: typeData,
            },
          ],
          statements: [
            compiler.returnFunctionCall({
              args: [
                compiler.objectExpression({
                  obj: [
                    {
                      key: 'queryFn',
                      value: compiler.arrowFunction({
                        async: true,
                        multiLine: true,
                        parameters: [
                          {
                            destructure: [
                              {
                                name: 'queryKey',
                              },
                            ],
                          },
                        ],
                        statements: [
                          compiler.constVariable({
                            destructure: true,
                            expression: compiler.awaitExpression({
                              expression: compiler.callExpression({
                                functionName: queryFn,
                                parameters: [
                                  compiler.objectExpression({
                                    multiLine: true,
                                    obj: [
                                      {
                                        spread: 'options',
                                      },
                                      {
                                        spread: 'queryKey[0]',
                                      },
                                      {
                                        key: 'throwOnError',
                                        value: true,
                                      },
                                    ],
                                  }),
                                ],
                              }),
                            }),
                            name: 'data',
                          }),
                          compiler.returnVariable({
                            expression: 'data',
                          }),
                        ],
                      }),
                    },
                    {
                      key: 'queryKey',
                      value: compiler.callExpression({
                        functionName: toQueryKeyName(operation),
                        parameters: ['options'],
                      }),
                    },
                  ],
                }),
              ],
              name: queryOptionsFn,
            }),
          ],
        });
        const statement = compiler.constVariable({
          // TODO: describe options, same as the actual function call
          comment: [],
          exportConst: true,
          expression,
          name: toQueryOptionsName(operation),
          // TODO: add type error
          // TODO: AxiosError<PutSubmissionMetaError>
        });
        file.add(statement);
      }

      // infinite queries
      if (
        plugin.infiniteQueryOptions &&
        (['GET', 'POST'] as ReadonlyArray<Method>).includes(operation.method)
      ) {
        // the actual pagination field might be nested inside parameter, e.g. body
        let paginationField!: Model | OperationParameter;

        const paginationParameter = operation.parameters.find((parameter) => {
          paginationWordsRegExp.lastIndex = 0;
          if (paginationWordsRegExp.test(parameter.name)) {
            paginationField = parameter;
            return true;
          }

          if (parameter.in !== 'body') {
            return;
          }

          if (parameter.export === 'reference') {
            const ref = parameter.$refs[0];
            const refModel = client.models.find(
              (model) => model.meta?.$ref === ref,
            );
            return refModel?.properties.find((property) => {
              paginationWordsRegExp.lastIndex = 0;
              if (paginationWordsRegExp.test(property.name)) {
                paginationField = property;
                return true;
              }
            });
          }

          return parameter.properties.find((property) => {
            paginationWordsRegExp.lastIndex = 0;
            if (paginationWordsRegExp.test(property.name)) {
              paginationField = property;
              return true;
            }
          });
        });

        if (paginationParameter && paginationField) {
          if (!hasInfiniteQueries) {
            hasInfiniteQueries = true;

            if (!hasCreateQueryKeyParamsFunction) {
              createQueryKeyType({ file });
              createQueryKeyFunction({ file });
              hasCreateQueryKeyParamsFunction = true;
            }

            if (!hasCreateInfiniteParamsFunction) {
              createInfiniteParamsFunction({ file });
              hasCreateInfiniteParamsFunction = true;
            }

            file.import({
              module: plugin.name,
              name: infiniteQueryOptionsFn,
            });

            typeInfiniteData = file.import({
              asType: true,
              module: plugin.name,
              name: 'InfiniteData',
            });
          }

          hasUsedQueryFn = true;

          const { typeData } = createTypeData({
            client,
            file,
            operation,
            typesModulePath,
          });
          const { typeError } = createTypeError({
            client,
            file,
            operation,
            pluginName: plugin.name,
            typesModulePath,
          });
          const { typeResponse } = createTypeResponse({
            client,
            file,
            operation,
            typesModulePath,
          });

          const isRequired = isOperationParameterRequired(operation.parameters);

          const typeQueryKey = `${queryKeyName}<${typeData}>`;
          const typePageObjectParam = `Pick<${typeQueryKey}[0], 'body' | 'headers' | 'path' | 'query'>`;
          const typePageParam = `${paginationField.base} | ${typePageObjectParam}`;

          const queryKeyStatement = compiler.constVariable({
            exportConst: true,
            expression: compiler.arrowFunction({
              parameters: [
                {
                  isRequired,
                  name: 'options',
                  type: typeData,
                },
              ],
              returnType: typeQueryKey,
              statements: createQueryKeyLiteral({
                isInfinite: true,
                operation,
              }),
            }),
            name: toQueryKeyName(operation, true),
          });
          file.add(queryKeyStatement);

          const expression = compiler.arrowFunction({
            parameters: [
              {
                isRequired,
                name: 'options',
                type: typeData,
              },
            ],
            statements: [
              compiler.returnFunctionCall({
                args: [
                  compiler.objectExpression({
                    comments: [
                      {
                        jsdoc: false,
                        lines: ['@ts-ignore'],
                      },
                    ],
                    obj: [
                      {
                        key: 'queryFn',
                        value: compiler.arrowFunction({
                          async: true,
                          multiLine: true,
                          parameters: [
                            {
                              destructure: [
                                {
                                  name: 'pageParam',
                                },
                                {
                                  name: 'queryKey',
                                },
                              ],
                            },
                          ],
                          statements: [
                            compiler.constVariable({
                              comment: [
                                {
                                  jsdoc: false,
                                  lines: ['@ts-ignore'],
                                },
                              ],
                              expression: compiler.conditionalExpression({
                                condition: compiler.binaryExpression({
                                  left: compiler.typeOfExpression({
                                    text: 'pageParam',
                                  }),
                                  operator: '===',
                                  right: compiler.stringLiteral({
                                    text: 'object',
                                  }),
                                }),
                                whenFalse: compiler.objectExpression({
                                  multiLine: true,
                                  obj: [
                                    {
                                      key: getPaginationIn(paginationParameter),
                                      value: compiler.objectExpression({
                                        multiLine: true,
                                        obj: [
                                          {
                                            key: paginationField.name,
                                            value: compiler.identifier({
                                              text: 'pageParam',
                                            }),
                                          },
                                        ],
                                      }),
                                    },
                                  ],
                                }),
                                whenTrue: compiler.identifier({
                                  text: 'pageParam',
                                }),
                              }),
                              name: 'page',
                              typeName: typePageObjectParam,
                            }),
                            compiler.constVariable({
                              expression: compiler.callExpression({
                                functionName: 'createInfiniteParams',
                                parameters: ['queryKey', 'page'],
                              }),
                              name: 'params',
                            }),
                            compiler.constVariable({
                              destructure: true,
                              expression: compiler.awaitExpression({
                                expression: compiler.callExpression({
                                  functionName: queryFn,
                                  parameters: [
                                    compiler.objectExpression({
                                      multiLine: true,
                                      obj: [
                                        {
                                          spread: 'options',
                                        },
                                        {
                                          spread: 'params',
                                        },
                                        {
                                          key: 'throwOnError',
                                          value: true,
                                        },
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                              name: 'data',
                            }),
                            compiler.returnVariable({
                              expression: 'data',
                            }),
                          ],
                        }),
                      },
                      {
                        key: 'queryKey',
                        value: compiler.callExpression({
                          functionName: toQueryKeyName(operation, true),
                          parameters: ['options'],
                        }),
                      },
                    ],
                  }),
                ],
                name: infiniteQueryOptionsFn,
                // TODO: better types syntax
                types: [
                  typeResponse,
                  typeError.name,
                  `${typeof typeInfiniteData === 'string' ? typeInfiniteData : typeInfiniteData.name}<${typeResponse}>`,
                  typeQueryKey,
                  typePageParam,
                ],
              }),
            ],
          });
          const statement = compiler.constVariable({
            // TODO: describe options, same as the actual function call
            comment: [],
            exportConst: true,
            expression,
            name: toInfiniteQueryOptionsName(operation),
          });
          file.add(statement);
        }
      }

      // mutations
      if (
        plugin.mutationOptions &&
        (['DELETE', 'PATCH', 'POST', 'PUT'] as ReadonlyArray<Method>).includes(
          operation.method,
        )
      ) {
        if (!hasMutations) {
          hasMutations = true;

          file.import({
            asType: true,
            module: plugin.name,
            name: mutationsType,
          });
        }

        hasUsedQueryFn = true;

        const { typeData } = createTypeData({
          client,
          file,
          operation,
          typesModulePath,
        });
        const { typeError } = createTypeError({
          client,
          file,
          operation,
          pluginName: plugin.name,
          typesModulePath,
        });
        const { typeResponse } = createTypeResponse({
          client,
          file,
          operation,
          typesModulePath,
        });

        const expression = compiler.arrowFunction({
          parameters: [
            {
              isRequired: false,
              name: 'options',
              type: `Partial<${typeData}>`,
            },
          ],
          statements: [
            compiler.constVariable({
              expression: compiler.objectExpression({
                obj: [
                  {
                    key: 'mutationFn',
                    value: compiler.arrowFunction({
                      async: true,
                      multiLine: true,
                      parameters: [
                        {
                          name: 'localOptions',
                        },
                      ],
                      statements: [
                        compiler.constVariable({
                          destructure: true,
                          expression: compiler.awaitExpression({
                            expression: compiler.callExpression({
                              functionName: queryFn,
                              parameters: [
                                compiler.objectExpression({
                                  multiLine: true,
                                  obj: [
                                    {
                                      spread: 'options',
                                    },
                                    {
                                      spread: 'localOptions',
                                    },
                                    {
                                      key: 'throwOnError',
                                      value: true,
                                    },
                                  ],
                                }),
                              ],
                            }),
                          }),
                          name: 'data',
                        }),
                        compiler.returnVariable({
                          expression: 'data',
                        }),
                      ],
                    }),
                  },
                ],
              }),
              name: mutationOptionsFn,
              // TODO: better types syntax
              typeName: `${mutationsType}<${typeResponse}, ${typeError.name}, ${typeData}>`,
            }),
            compiler.returnVariable({
              expression: mutationOptionsFn,
            }),
          ],
        });
        const statement = compiler.constVariable({
          // TODO: describe options, same as the actual function call
          comment: [],
          exportConst: true,
          expression,
          name: toMutationOptionsName(operation),
        });
        file.add(statement);
      }

      const servicesModulePath = relativeModulePath({
        moduleOutput: files.services.getName(false),
        sourceOutput: plugin.output,
      });

      if (hasQueries || hasInfiniteQueries) {
        file.import({
          module: servicesModulePath,
          name: 'client',
        });
      }

      if (hasUsedQueryFn) {
        file.import({
          module: servicesModulePath,
          name: queryFn.split('.')[0],
        });
      }
    }
  }
};
