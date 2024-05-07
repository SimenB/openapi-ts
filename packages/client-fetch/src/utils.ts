import type { Config } from './types';

interface PathSerializer {
  path: Record<string, unknown>;
  url: string;
}

const PATH_PARAM_RE = /\{[^{}]+\}/g;

type ArrayStyle = 'form' | 'spaceDelimited' | 'pipeDelimited';
type MatrixStyle = 'label' | 'matrix' | 'simple';
type ArraySeparatorStyle = ArrayStyle | MatrixStyle;
type ObjectStyle = 'form' | 'deepObject';
type ObjectSeparatorStyle = ObjectStyle | MatrixStyle;

export interface FetchOptions extends Omit<RequestInit, 'headers'> {
  /**
   * Headers...
   */
  headers?: HeadersOptions;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type QuerySerializer<T = unknown> = (
  query: Record<string, unknown>,
) => string;

// type BodySerializer<T> = (body: OperationRequestBodyContent<T>) => any;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type BodySerializer<T> = (body: any) => any;

interface SerializerOptions<T> {
  /**
   * @default true
   */
  explode: boolean;
  style: T;
}

interface SerializeOptions<T>
  extends SerializePrimitiveOptions,
    SerializerOptions<T> {}
interface SerializePrimitiveOptions {
  allowReserved?: boolean;
  name: string;
}
interface SerializePrimitiveParam extends SerializePrimitiveOptions {
  value: string;
}

export type HeadersOptions =
  | HeadersInit
  | Record<
      string,
      | string
      | number
      | boolean
      | (string | number | boolean)[]
      | null
      | undefined
    >;

export interface QuerySerializerOptions {
  allowReserved?: boolean;
  array?: SerializerOptions<ArrayStyle>;
  object?: SerializerOptions<ObjectStyle>;
}

export function serializePrimitiveParam({
  allowReserved,
  name,
  value,
}: SerializePrimitiveParam) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'object') {
    throw new Error(
      'Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.',
    );
  }

  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`;
}

const separatorArrayExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case 'label':
      return '.';
    case 'matrix':
      return ';';
    case 'simple':
      return ',';
    default:
      return '&';
  }
};

const separatorArrayNoExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case 'form':
      return ',';
    case 'pipeDelimited':
      return '|';
    case 'spaceDelimited':
      return '%20';
    default:
      return ',';
  }
};

const separatorObjectExplode = (style: ObjectSeparatorStyle) => {
  switch (style) {
    case 'label':
      return '.';
    case 'matrix':
      return ';';
    case 'simple':
      return ',';
    default:
      return '&';
  }
};

export function serializeArrayParam({
  allowReserved,
  explode,
  name,
  style,
  value,
}: SerializeOptions<ArraySeparatorStyle> & {
  value: unknown[];
}) {
  if (!explode) {
    const final = (
      allowReserved ? value : value.map((v) => encodeURIComponent(v as string))
    ).join(separatorArrayNoExplode(style));
    switch (style) {
      case 'label':
        return `.${final}`;
      case 'matrix':
        return `;${name}=${final}`;
      case 'simple':
        return final;
      default:
        return `${name}=${final}`;
    }
  }

  const separator = separatorArrayExplode(style);
  const final = value
    .map((v) => {
      if (style === 'label' || style === 'simple') {
        return allowReserved ? v : encodeURIComponent(v as string);
      }

      return serializePrimitiveParam({
        allowReserved,
        name,
        value: v as string,
      });
    })
    .join(separator);
  return style === 'label' || style === 'matrix' ? separator + final : final;
}

export const serializeObjectParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
}: SerializeOptions<ObjectSeparatorStyle> & {
  value: Record<string, unknown>;
}) => {
  if (style !== 'deepObject' && !explode) {
    const values: string[] = [];
    Object.entries(value).forEach(([key, v]) => {
      values.push(
        key,
        allowReserved ? (v as string) : encodeURIComponent(v as string),
      );
    });
    const final = values.join(',');
    switch (style) {
      case 'form':
        return `${name}=${final}`;
      case 'label':
        return `.${final}`;
      case 'matrix':
        return `;${name}=${final}`;
      default:
        return final;
    }
  }

  const separator = separatorObjectExplode(style);
  const final = Object.entries(value)
    .map(([key, v]) =>
      serializePrimitiveParam({
        allowReserved,
        name: style === 'deepObject' ? `${name}[${key}]` : key,
        value: v as string,
      }),
    )
    .join(separator);
  return style === 'label' || style === 'matrix' ? separator + final : final;
};

export function defaultPathSerializer({ path, url: _url }: PathSerializer) {
  let url = _url;
  const matches = _url.match(PATH_PARAM_RE);
  if (matches) {
    for (const match of matches) {
      let explode = false;
      let name = match.substring(1, match.length - 1);
      let style: ArraySeparatorStyle = 'simple';

      if (name.endsWith('*')) {
        explode = true;
        name = name.substring(0, name.length - 1);
      }

      if (name.startsWith('.')) {
        name = name.substring(1);
        style = 'label';
      } else if (name.startsWith(';')) {
        name = name.substring(1);
        style = 'matrix';
      }

      const value = path[name];

      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        url = url.replace(
          match,
          serializeArrayParam({ explode, name, style, value }),
        );
        continue;
      }

      if (typeof value === 'object') {
        url = url.replace(
          match,
          serializeObjectParam({
            explode,
            name,
            style,
            value: value as Record<string, unknown>,
          }),
        );
        continue;
      }

      if (style === 'matrix') {
        url = url.replace(
          match,
          `;${serializePrimitiveParam({
            name,
            value: value as string,
          })}`,
        );
        continue;
      }

      url = url.replace(
        match,
        style === 'label' ? `.${value as string}` : (value as string),
      );
    }
  }
  return url;
}

export const createQuerySerializer = <T = unknown>({
  allowReserved,
  array,
  object,
}: QuerySerializerOptions = {}) => {
  const querySerializer = (queryParams: T) => {
    const search = [];
    if (queryParams && typeof queryParams === 'object') {
      for (const name in queryParams) {
        const value = queryParams[name];

        if (value === undefined || value === null) {
          continue;
        }

        if (Array.isArray(value)) {
          search.push(
            serializeArrayParam({
              allowReserved,
              explode: true,
              name,
              style: 'form',
              value,
              ...array,
            }),
          );
          continue;
        }

        if (typeof value === 'object') {
          search.push(
            serializeObjectParam({
              allowReserved,
              explode: true,
              name,
              style: 'deepObject',
              value: value as Record<string, unknown>,
              ...object,
            }),
          );
          continue;
        }

        search.push(
          serializePrimitiveParam({
            allowReserved,
            name,
            value: value as string,
          }),
        );
      }
    }
    return search.join('&');
  };
  return querySerializer;
};

export function getUrl({
  baseUrl,
  path,
  query,
  querySerializer,
  url: _url,
}: {
  baseUrl: string;
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  querySerializer: QuerySerializer;
  url: string;
}) {
  const pathUrl = _url.startsWith('/') ? _url : `/${_url}`;
  let url = baseUrl + pathUrl;
  if (path) {
    url = defaultPathSerializer({ path, url });
  }
  let search = query ? querySerializer(query) : '';
  if (search.startsWith('?')) {
    search = search.substring(1);
  }
  if (search) {
    url += `?${search}`;
  }
  return url;
}

export const mergeHeaders = (...headers: Array<HeadersOptions | undefined>) => {
  const finalHeaders = new Headers();
  for (const header of headers) {
    if (!header || typeof header !== 'object') {
      continue;
    }

    const iterator =
      header instanceof Headers ? header.entries() : Object.entries(header);

    for (const [key, value] of iterator) {
      if (value === null) {
        finalHeaders.delete(key);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          finalHeaders.append(key, v as string);
        }
      } else if (value !== undefined) {
        finalHeaders.set(key, value as string);
      }
    }
  }
  return finalHeaders;
};

type ReqInterceptor<Req, Options> = (
  request: Req,
  options: Options,
) => Req | Promise<Req>;

type ResInterceptor<Res, Req, Options> = (
  response: Res,
  request: Req,
  options: Options,
) => Res | Promise<Res>;

class Interceptors<Interceptor> {
  _fns: Interceptor[];

  constructor() {
    this._fns = [];
  }

  eject(fn: Interceptor) {
    const index = this._fns.indexOf(fn);
    if (index !== -1) {
      this._fns = [...this._fns.slice(0, index), ...this._fns.slice(index + 1)];
    }
  }

  use(fn: Interceptor) {
    this._fns = [...this._fns, fn];
  }
}

export const createInterceptors = <Req, Res, Options>() => ({
  request: new Interceptors<ReqInterceptor<Req, Options>>(),
  response: new Interceptors<ResInterceptor<Res, Req, Options>>(),
});

export const formDataBodySerializer = <T extends Record<string, any>>(
  body: T,
) => {
  const formData = new FormData();
  for (const key in body) {
    formData.append(key, body[key]);
  }
  return formData;
};

export const jsonBodySerializer = <T>(body: T) => JSON.stringify(body);

const defaultQuerySerializer = createQuerySerializer({
  allowReserved: false,
  array: {
    explode: true,
    style: 'form',
  },
  object: {
    explode: true,
    style: 'deepObject',
  },
});

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export const createDefaultConfig = (): Config => ({
  baseUrl: '',
  bodySerializer: jsonBodySerializer,
  fetch: globalThis.fetch,
  global: true,
  headers: defaultHeaders,
  parseAs: 'json',
  querySerializer: defaultQuerySerializer,
});