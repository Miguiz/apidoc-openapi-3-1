import {pathToRegexp} from 'path-to-regexp';
import GenerateSchema from 'generate-schema';

import {OpenAPIV3_1} from 'openapi-types';

const swagger: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {} as OpenAPIV3_1.InfoObject,
    servers: [],
    paths: {},
};

export function toSwagger(apidocJson: Record<string, any>[], projectJson: Record<string, any>) {
    swagger.info = addInfo(projectJson);
    swagger.servers = addServers(projectJson);
    swagger.paths = extractPaths(apidocJson);
    return swagger;
}

// Removes <p> </p> tags from text
function removeTags(text: unknown) {
    return typeof text === 'string' ? text.replace(/(<([^>]+)>)/gi, '') : '';
}

function addInfo(projectJson: Record<string, any>) {
    return {
        title: projectJson.title || projectJson.name,
        version: projectJson.version,
        description: projectJson.description,
    };
}

function addServers(projectJson: Record<string, any>) {
    return [
        {
            url: projectJson.url ?? 'http://localhost/',
            description: 'API Server URL',
        },
    ];
}

/**
 * Extracts paths provided in json format
 * post, patch, put request parameters are extracted in body
 * get and delete are extracted to path parameters
 * @param apidocJson
 * @returns {{}}
 */
function extractPaths(apidocJson: Record<string, any>[]) {
    const apiPaths = groupByUrl(apidocJson);
    const paths: Record<string, any> = {};

    for (const apiPath of apiPaths) {
        const verbs = apiPath.verbs;
        let url = verbs[0].url;
        const pattern = pathToRegexp(url);
        const matches = pattern.exec(url);

        // Surrounds URL parameters with curly brackets -> :email with {email}
        for (let j = 1; matches && j < matches.length; j++) {
            const key = matches[j].slice(1);
            url = url.replace(matches[j], `{${key}}`);
        }

        for (const verb of verbs) {
            const obj = (paths[url] = paths[url] || {});

            Object.assign(obj, generateProps(verb));
        }
    }
    return paths;
}

function mapHeaderItem(i: Record<string, any>): OpenAPIV3_1.ParameterObject {
    return {
        in: 'header',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional,
        schema: {
            type: 'string',
            default: i.defaultValue,
            example: i.defaultValue,
        },
    };
}

function mapParameterItem(i: Record<string, any>): OpenAPIV3_1.ParameterObject {
    return {
        in: 'path',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional,
        schema: {
            type: 'string',
            default: i.defaultValue,
            example: i.defaultValue,
        },
    };
}

function mapQueryItem(i: Record<string, any>): OpenAPIV3_1.ParameterObject {
    return {
        in: 'query',
        name: i.field,
        description: removeTags(i.description),
        required: !i.optional,
        schema: {
            type: 'string',
            default: i.defaultValue,
            example: i.defaultValue
        },
    };
}

/**
 * apiDocParams
 * @param {type} type
 * @param {boolean} optional
 * @param {string} field
 * @param {string} defaultValue
 * @param {string} description
 */

/**
 *
 * @param {ApidocParameter[]} apiDocParams
 * @param {Object} parameterInBody
 */
function transferApidocParamsToSwaggerBody(apiDocParams: Record<string, any>[], parameterInBody: OpenAPIV3_1.MediaTypeObject) {
    const mountPlaces: Record<string, any> = {
        '': parameterInBody['schema'],
    };

    for (const i of apiDocParams) {
        const type = i.type ? i.type.toLowerCase() : 'string';
        const key = i.field;
        const {objectName = '', propertyName} = createNestedName(i.field);

        if (type.endsWith('object[]')) {
            // if schema(parsed from example) doesn't has this constructure, init
            if (!mountPlaces[objectName]['properties'][propertyName]) {
                mountPlaces[objectName]['properties'][propertyName] = {type: 'array', items: {type: 'object', properties: {}, required: []}};
            }

            // new mount point
            mountPlaces[key] = mountPlaces[objectName]['properties'][propertyName]['items'];
        } else if (type.endsWith('[]')) {
            // if schema(parsed from example) doesn't has this constructure, init
            if (!mountPlaces[objectName]['properties'][propertyName]) {
                mountPlaces[objectName]['properties'][propertyName] = {
                    items: {
                        type: type.slice(0, -2),
                        description: removeTags(i.description),
                        default: i.defaultValue,
                        example: i.defaultValue,
                    },
                    type: 'array',
                };
            }
        } else if (type === 'object') {
            // if schema(parsed from example) doesn't has this constructure, init
            if (!mountPlaces[objectName]['properties'][propertyName]) {
                mountPlaces[objectName]['properties'][propertyName] = {type: 'object', properties: {}, required: []};
            }

            // new mount point
            mountPlaces[key] = mountPlaces[objectName]['properties'][propertyName];
        } else {
            mountPlaces[objectName]['properties'][propertyName] = {
                type,
                description: removeTags(i.description),
                default: i.defaultValue,
                example: i.defaultValue,
            };
        }
        if (!i.optional) {
            // generate-schema forget init [required]
            if (mountPlaces[objectName]['required']) {
                mountPlaces[objectName]['required'].push(propertyName);
            } else {
                mountPlaces[objectName]['required'] = [propertyName];
            }
        }
    }

    return parameterInBody;
}
function generateProps(verb: Record<string, any>) {
    const pathItemObject: Record<string, OpenAPIV3_1.OperationObject> = {};
    const parameters = generateParameters(verb);
    const body = generateBody(verb);
    const responses = generateResponses(verb);
    const type = verb.type.toLowerCase();

    pathItemObject[type] = {
        tags: [verb.group],
        summary: removeTags(verb.name),
        description: removeTags(verb.title),
        requestBody: {content: {'application/json': body}},
        parameters,
        responses,
    };

    return pathItemObject;
}

function generateBody(verb: Record<string, any>) {
    const mixedBody = [];

    if (verb?.parameter?.fields) {
        mixedBody.push(...(verb.parameter.fields.Body || []));
    }
    if (verb?.body) {
        mixedBody.push(...(verb.body || []));
    }

    let body: OpenAPIV3_1.MediaTypeObject = {};
    if (mixedBody.length) {
        body = generateRequestBody(verb, mixedBody);
    }

    return body;
}

function generateParameters(verb: Record<string, any>) {
    let parameter = [];
    let query = [];
    const header = verb?.header?.fields?.Header || [];

    if (verb?.parameter?.fields) {
        parameter = verb.parameter.fields.Parameter || [];
        query = verb.parameter.fields.Query || [];
    }

    const parameters = [];
    parameters.push(...parameter.map(mapParameterItem));
    parameters.push(...query.map(mapQueryItem));
    parameters.push(...header.map(mapHeaderItem));
    parameters.push(...(verb.query || []).map(mapQueryItem));

    return parameters;
}

function generateRequestBody(verb: Record<string, any>, mixedBody: Record<string, any>[]) {
    const bodyParameter: OpenAPIV3_1.MediaTypeObject = {
        schema: {
            description: '',
            properties: {},
            type: 'object',
            required: [],
        },
    };

    if (verb?.parameter?.examples?.length > 0) {
        const example = verb.parameter.examples[0];
        const {json} = safeParseJson(example.content);
        bodyParameter.schema = GenerateSchema.json(example.title ?? '', json);
        //bodyParameter.description = example.title;
    }

    transferApidocParamsToSwaggerBody(mixedBody, bodyParameter);

    return bodyParameter;
}

function generateResponses(verb: Record<string, any>) {
    const success = verb.success;
    const error = verb.error;
    const responses: Record<string, OpenAPIV3_1.ResponseObject> = {
        200: {
            description: 'OK',
        },
    };

    if (success?.examples?.length > 0) {
        for (const example of success.examples) {
            const {code, json} = safeParseJson(example.content, 200);
            const schema = GenerateSchema.json(example.title, json);

            responses[code] = {
                description: example.title ?? 'OK',
                content: {'application/json': {schema}},
            };
        }
    }

    if (error?.examples?.length > 0) {
        for (const example of error.examples) {
            const {code, json} = safeParseJson(example.content, 400);
            const schema = GenerateSchema.json(example.title, json);

            responses[code] = {
                description: example.title ?? 'ERROR',
                content: {'application/json': {schema}},
            };
        }
    }

    mountResponseSpecSchema(verb, responses);

    return responses;
}

function mountResponseSpecSchema(verb: Record<string, any>, responses: Record<string, OpenAPIV3_1.ResponseObject>) {
    let fields: Record<string, any> = {};
    if (verb?.success?.fields) {
        fields = {...fields, ...verb.success.fields};
    }
    if (verb?.error?.fields) {
        fields = {...fields, ...verb.error.fields};
    }
    for (const field in fields) {
        const responseCode = parseInt(field.match(/\b([1-5][0-9]{2})\b/)?.[0] ?? '');

        if (isNaN(responseCode)) {
            continue;
        }
        const responseSpec = fields[field];
        const bodyParameter: OpenAPIV3_1.MediaTypeObject = {
            schema: {
                properties: {},
                type: 'object',
                required: [],
            },
        };
        transferApidocParamsToSwaggerBody(responseSpec, bodyParameter);
        responses[responseCode] = {
            description: responseSpec.title ?? '',
            content: {
                'application/json': bodyParameter,
            },
        };
    }
}

function safeParseJson(content: string, defaultCode = 200) {
    // such as  'HTTP/1.1 200 OK\n' +  '{\n' + ...

    let startingIndex = 0;
    for (let i = 0; i < content.length; i++) {
        const character = content[i];
        if (character === '{' || character === '[') {
            startingIndex = i;
            break;
        }
    }

    const mayCodeString = content.slice(0, startingIndex);
    const mayContentString = content.slice(startingIndex);

    const mayCodeSplit = mayCodeString.trim().split(' ');
    const code = mayCodeSplit.length === 3 ? parseInt(mayCodeSplit[1]) : defaultCode;

    let json = {};
    try {
        json = JSON.parse(mayContentString.replace(/,([ \t\n]+[}\])])/g, '$1'));
    } catch (error) {
        console.warn('parse error', mayContentString, error);
    }

    return {code, json};
}

function createNestedName(field: string, defaultObjectName?: string) {
    let propertyName = field;
    let objectName;
    const propertyNames = field?.split('.');

    if (propertyNames && propertyNames.length > 1) {
        propertyName = propertyNames.pop() as string;
        objectName = propertyNames.join('.');
    }

    return {
        propertyName: propertyName,
        objectName: objectName || defaultObjectName,
    };
}

function groupByUrl(apidocJson: Record<string, any>[]) {
    const grouped = Object.entries(
        apidocJson.reduce((groups: any, item: any) => {
            const key = item['url'];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {})
    );

    const results = grouped.map(([url, verbs]) => ({url, verbs}));

    return results as {url: string; verbs: Record<string, any>[]}[];
}
