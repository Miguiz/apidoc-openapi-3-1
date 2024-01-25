import fs from 'fs';
import apidoc, {DocOptions} from 'apidoc-light';

import {toSwagger} from './apidoc_to_swagger';
import path from 'path';

export function main(options: DocOptions & {output?: string}) {
    options.verbose && console.log('options', options);
    if (!options.src) {
        throw new Error('`cli.input` is required but was not provided.');
    }
    if (!(options.dryRun || options.output)) {
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

function createOutputFile(swaggerData: string, options: DocOptions & {output?: string}) {
    const output = options.output ?? './';
    const destPath = path.join(output, 'swagger.json');

    options.silent !== true && console.log(`\x1b[0;32mWrite swagger json file\x1b[0m: ${destPath} (dryRun=${options.dryRun})`);
    if (options.dryRun) {
        return;
    }
    fs.existsSync(output) || fs.mkdirSync(output);
    fs.writeFileSync(destPath, swaggerData);
}

export {toSwagger};
