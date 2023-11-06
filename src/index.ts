import fs from 'fs';
import apidoc, {DocOptions} from 'apidoc-light';

import {toSwagger} from './apidoc_to_swagger';

export function main(options: DocOptions & {output?: string}) {
    options.verbose && console.log('options', options);
    if (!options.src) {
        throw new Error('`cli.input` is required but was not provided.');
    }
    if (!options.output) {
        throw new Error('`cli.output` is required but was not provided.');
    }

    const {data, project} = apidoc.createDoc({...options, dryRun: true});

    const swagger = toSwagger(
        data.filter((x) => x.type),
        project
    );

    createOutputFile(JSON.stringify(swagger), options);

    return swagger;
}

function createOutputFile(swaggerData: string, options: Record<string, any>) {
    console.log('create dir: ' + options.output);
    if (!options.dryRun) {
        fs.existsSync(options.output) || fs.mkdirSync(options.output);
    }
    //Write swagger
    console.log('write swagger json file: ' + options.output + 'swagger.json');
    if (!options.dryRun) {
        fs.writeFileSync(options.output + './swagger.json', swaggerData);
    }
}

export {toSwagger};
