// This file is auto-generated by @hey-api/openapi-ts

import type { GetFooResponse, NestedDateObjectResponse } from './types.gen';

const fooSchemaResponseTransformer = (data: any) => {
    if (data.foo) {
        data.foo = new Date(data.foo);
    }
    if (data.bar) {
        data.bar = new Date(data.bar);
    }
    if (data.baz) {
        data.baz = new Date(data.baz);
    }
    if (data.requiredQux) {
        data.requiredQux = new Date(data.requiredQux);
    }
    return data;
};

export const getFooResponseTransformer = async (data: any): Promise<GetFooResponse> => {
    data = data.map((item: any) => {
        return fooSchemaResponseTransformer(item);
    });
    return data;
};

const nestedDateObjectSchemaResponseTransformer = (data: any) => {
    if (data.foo) {
        if (data.foo.bar) {
            data.foo.bar = new Date(data.foo.bar);
        }
    }
    return data;
};

export const nestedDateObjectResponseTransformer = async (data: any): Promise<NestedDateObjectResponse> => {
    data = nestedDateObjectSchemaResponseTransformer(data);
    return data;
};