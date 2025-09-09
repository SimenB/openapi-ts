import { TypeScriptRenderer } from '../../../generate/renderer';
import type { IR } from '../../../ir/types';
import type { OpenApiV2_0_XTypes } from '../../../openApi/2.0.x';
import type { OpenApiV3_0_XTypes } from '../../../openApi/3.0.x';
import type { OpenApiV3_1_XTypes } from '../../../openApi/3.1.x';
import { ensureValidIdentifier } from '../../../openApi/shared/utils/identifier';
import type { OpenApi } from '../../../openApi/types';
import { tsc } from '../../../tsc';
import type { HeyApiSchemasPlugin } from './types';

const stripSchema = ({
  plugin,
  schema,
}: {
  plugin: HeyApiSchemasPlugin['Instance'];
  schema:
    | OpenApiV2_0_XTypes['SchemaObject']
    | OpenApiV3_0_XTypes['SchemaObject']
    | OpenApiV3_1_XTypes['SchemaObject'];
}) => {
  if (plugin.config.type === 'form') {
    if (schema.description) {
      delete schema.description;
    }

    if (schema['x-enum-descriptions']) {
      delete schema['x-enum-descriptions'];
    }

    if (schema['x-enum-varnames']) {
      delete schema['x-enum-varnames'];
    }

    if (schema['x-enumNames']) {
      delete schema['x-enumNames'];
    }

    if (schema.title) {
      delete schema.title;
    }
  }
};

const schemaToJsonSchemaDraft_04 = ({
  context,
  plugin,
  schema: _schema,
}: {
  context: IR.Context;
  plugin: HeyApiSchemasPlugin['Instance'];
  schema: OpenApiV2_0_XTypes['SchemaObject'];
}): OpenApiV2_0_XTypes['SchemaObject'] => {
  if (Array.isArray(_schema)) {
    return _schema.map((item) =>
      schemaToJsonSchemaDraft_04({
        context,
        plugin,
        schema: item,
      }),
    ) as unknown as OpenApiV2_0_XTypes['SchemaObject'];
  }

  const schema = structuredClone(_schema);

  if (schema.$ref) {
    // refs using unicode characters become encoded, didn't investigate why
    // but the suspicion is this comes from `@hey-api/json-schema-ref-parser`
    schema.$ref = decodeURI(schema.$ref);
    return schema;
  }

  stripSchema({ plugin, schema });

  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    schema.additionalProperties = schemaToJsonSchemaDraft_04({
      context,
      plugin,
      schema: schema.additionalProperties,
    });
  }

  if (schema.allOf) {
    schema.allOf = schema.allOf.map((item) =>
      schemaToJsonSchemaDraft_04({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.items) {
    schema.items = schemaToJsonSchemaDraft_04({
      context,
      plugin,
      schema: schema.items as OpenApiV2_0_XTypes['SchemaObject'],
    });
  }

  if (schema.properties) {
    for (const name in schema.properties) {
      const property = schema.properties[name]!;

      if (typeof property !== 'boolean') {
        schema.properties[name] = schemaToJsonSchemaDraft_04({
          context,
          plugin,
          schema: property,
        });
      }
    }
  }

  return schema;
};

const schemaToJsonSchemaDraft_05 = ({
  context,
  plugin,
  schema: _schema,
}: {
  context: IR.Context;
  plugin: HeyApiSchemasPlugin['Instance'];
  schema:
    | OpenApiV3_0_XTypes['SchemaObject']
    | OpenApiV3_0_XTypes['ReferenceObject'];
}):
  | OpenApiV3_0_XTypes['SchemaObject']
  | OpenApiV3_0_XTypes['ReferenceObject'] => {
  if (Array.isArray(_schema)) {
    return _schema.map((item) =>
      schemaToJsonSchemaDraft_05({
        context,
        plugin,
        schema: item,
      }),
    ) as
      | OpenApiV3_0_XTypes['SchemaObject']
      | OpenApiV3_0_XTypes['ReferenceObject'];
  }

  const schema = structuredClone(_schema);

  if ('$ref' in schema) {
    // refs using unicode characters become encoded, didn't investigate why
    // but the suspicion is this comes from `@hey-api/json-schema-ref-parser`
    schema.$ref = decodeURI(schema.$ref);
    return schema;
  }

  stripSchema({ plugin, schema });

  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    schema.additionalProperties = schemaToJsonSchemaDraft_05({
      context,
      plugin,
      schema: schema.additionalProperties,
    });
  }

  if (schema.allOf) {
    schema.allOf = schema.allOf.map((item) =>
      schemaToJsonSchemaDraft_05({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.anyOf) {
    schema.anyOf = schema.anyOf.map((item) =>
      schemaToJsonSchemaDraft_05({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.items) {
    schema.items = schemaToJsonSchemaDraft_05({
      context,
      plugin,
      schema: schema.items,
    });
  }

  if (schema.oneOf) {
    schema.oneOf = schema.oneOf.map((item) =>
      schemaToJsonSchemaDraft_05({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.properties) {
    for (const name in schema.properties) {
      const property = schema.properties[name]!;

      if (typeof property !== 'boolean') {
        schema.properties[name] = schemaToJsonSchemaDraft_05({
          context,
          plugin,
          schema: property,
        });
      }
    }
  }

  return schema;
};

const schemaToJsonSchema2020_12 = ({
  context,
  plugin,
  schema: _schema,
}: {
  context: IR.Context;
  plugin: HeyApiSchemasPlugin['Instance'];
  schema: OpenApiV3_1_XTypes['SchemaObject'];
}): OpenApiV3_1_XTypes['SchemaObject'] => {
  if (Array.isArray(_schema)) {
    return _schema.map((item) =>
      schemaToJsonSchema2020_12({
        context,
        plugin,
        schema: item,
      }),
    ) as OpenApiV3_1_XTypes['SchemaObject'];
  }

  const schema = structuredClone(_schema);

  stripSchema({ plugin, schema });

  if (schema.$ref) {
    // refs using unicode characters become encoded, didn't investigate why
    // but the suspicion is this comes from `@hey-api/json-schema-ref-parser`
    schema.$ref = decodeURI(schema.$ref);
  }

  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    schema.additionalProperties = schemaToJsonSchema2020_12({
      context,
      plugin,
      schema: schema.additionalProperties,
    });
  }

  if (schema.allOf) {
    schema.allOf = schema.allOf.map((item) =>
      schemaToJsonSchema2020_12({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.anyOf) {
    schema.anyOf = schema.anyOf.map((item) =>
      schemaToJsonSchema2020_12({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.items) {
    schema.items = schemaToJsonSchema2020_12({
      context,
      plugin,
      schema: schema.items,
    });
  }

  if (schema.oneOf) {
    schema.oneOf = schema.oneOf.map((item) =>
      schemaToJsonSchema2020_12({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.prefixItems) {
    schema.prefixItems = schema.prefixItems.map((item) =>
      schemaToJsonSchema2020_12({
        context,
        plugin,
        schema: item,
      }),
    );
  }

  if (schema.properties) {
    for (const name in schema.properties) {
      const property = schema.properties[name]!;

      if (typeof property !== 'boolean') {
        schema.properties[name] = schemaToJsonSchema2020_12({
          context,
          plugin,
          schema: property,
        });
      }
    }
  }

  return schema;
};

const schemaName = ({
  name,
  plugin,
  schema,
}: {
  name: string;
  plugin: HeyApiSchemasPlugin['Instance'];
  schema:
    | OpenApiV2_0_XTypes['SchemaObject']
    | OpenApiV3_0_XTypes['ReferenceObject']
    | OpenApiV3_0_XTypes['SchemaObject']
    | OpenApiV3_1_XTypes['SchemaObject'];
}): string => {
  let customName = '';

  if (plugin.config.nameBuilder) {
    if (typeof plugin.config.nameBuilder === 'function') {
      customName = plugin.config.nameBuilder(name, schema);
    } else {
      customName = plugin.config.nameBuilder.replace('{{name}}', name);
    }
  }

  if (!customName) {
    customName = `${name}Schema`;
  }

  return ensureValidIdentifier(customName);
};

const schemasV2_0_X = ({
  context,
  plugin,
}: {
  context: IR.Context<OpenApi.V2_0_X>;
  plugin: HeyApiSchemasPlugin['Instance'];
}) => {
  if (!context.spec.definitions) {
    return;
  }

  for (const name in context.spec.definitions) {
    const schema = context.spec.definitions[name]!;
    const f = plugin.gen.ensureFile(plugin.output);
    const symbol = f.ensureSymbol({
      name: schemaName({ name, plugin, schema }),
      selector: plugin.api.getSelector('ref', name),
    });
    const obj = schemaToJsonSchemaDraft_04({
      context,
      plugin,
      schema,
    });
    const statement = tsc.constVariable({
      assertion: 'const',
      exportConst: true,
      expression: tsc.objectExpression({ obj }),
      name: symbol.placeholder,
    });
    symbol.update({ value: statement });
  }
};

const schemasV3_0_X = ({
  context,
  plugin,
}: {
  context: IR.Context<OpenApi.V3_0_X>;
  plugin: HeyApiSchemasPlugin['Instance'];
}) => {
  if (!context.spec.components) {
    return;
  }

  for (const name in context.spec.components.schemas) {
    const schema = context.spec.components.schemas[name]!;
    const f = plugin.gen.ensureFile(plugin.output);
    const symbol = f.ensureSymbol({
      name: schemaName({ name, plugin, schema }),
      selector: plugin.api.getSelector('ref', name),
    });
    const obj = schemaToJsonSchemaDraft_05({
      context,
      plugin,
      schema,
    });
    const statement = tsc.constVariable({
      assertion: 'const',
      exportConst: true,
      expression: tsc.objectExpression({ obj }),
      name: symbol.placeholder,
    });
    symbol.update({ value: statement });
  }
};

const schemasV3_1_X = ({
  context,
  plugin,
}: {
  context: IR.Context<OpenApi.V3_1_X>;
  plugin: HeyApiSchemasPlugin['Instance'];
}) => {
  if (!context.spec.components) {
    return;
  }

  for (const name in context.spec.components.schemas) {
    const schema = context.spec.components.schemas[name]!;
    const f = plugin.gen.ensureFile(plugin.output);
    const symbol = f.ensureSymbol({
      name: schemaName({ name, plugin, schema }),
      selector: plugin.api.getSelector('ref', name),
    });
    const obj = schemaToJsonSchema2020_12({
      context,
      plugin,
      schema,
    });
    const statement = tsc.constVariable({
      assertion: 'const',
      exportConst: true,
      expression: tsc.objectExpression({ obj }),
      name: symbol.placeholder,
    });
    symbol.update({ value: statement });
  }
};

export const handler: HeyApiSchemasPlugin['Handler'] = ({ plugin }) => {
  plugin.gen.createFile(plugin.output, {
    extension: '.ts',
    path: '{{path}}.gen',
    renderer: new TypeScriptRenderer(),
  });

  if ('swagger' in plugin.context.spec) {
    schemasV2_0_X({
      context: plugin.context as IR.Context<OpenApi.V2_0_X>,
      plugin,
    });
    return;
  }

  switch (plugin.context.spec.openapi) {
    case '3.0.0':
    case '3.0.1':
    case '3.0.2':
    case '3.0.3':
    case '3.0.4':
      schemasV3_0_X({
        context: plugin.context as IR.Context<OpenApi.V3_0_X>,
        plugin,
      });
      break;
    case '3.1.0':
    case '3.1.1':
      schemasV3_1_X({
        context: plugin.context as IR.Context<OpenApi.V3_1_X>,
        plugin,
      });
      break;
    default:
      throw new Error('Unsupported OpenAPI specification');
  }
};
